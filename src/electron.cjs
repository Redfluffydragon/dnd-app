// Electron imports
const { app, ipcMain, BrowserWindow, dialog } = require("electron");
const serve = require("electron-serve");
const wsk = require("electron-window-state");
try { require("electron-reloader")(module); } catch { }

// App-specific imports
const os = require('os');
const path = require("path");
const express = require('express');
const exApp = express();
const expressWs = require('express-ws')(exApp);
const Store = require('electron-store');

const loadURL = serve({ directory: "." });
const vitePort = process.env.PORT || 3000;
const isdev = !app.isPackaged || (process.env.NODE_ENV == "development");
let mainwindow;

const serverPort = 80;

const DEFAULT_SESSION_DATA = {
  position: {
    x: 0,
    y: 0,
  }
}

function loadVite(port) {
  mainwindow.loadURL(`http://localhost:${port}`).catch(() => {
    setTimeout(() => { loadVite(port); }, 200);
  });
}

function createMainWindow() {
  let mws = wsk({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  mainwindow = new BrowserWindow({
    x: mws.x,
    y: mws.y,
    width: mws.width,
    height: mws.height,

    title: 'D&D Main Screen',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#da3e3e',
      symbolColor: 'white',
    },

    show: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isdev || true,
    }
  });

  mainwindow.once("close", () => {
    // save stuff before closing
    // set all to offline when closing
    for (const id in players) {
      players[id].online = false;
    }

    save();
    mainwindow = null;
  });

  mws.manage(mainwindow);

  if (isdev) loadVite(vitePort);
  else loadURL(mainwindow);

  mainwindow.once('ready-to-show', mainwindow.show);

  // get host computer local IP address to share
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }

  ipcMain.on('ip', () => {
    mainwindow.webContents.send('ip', addresses[addresses.length - 1]);
  });

  ipcMain.on('save', save)

  ipcMain.on('session', (event, data) => {
    data = JSON.parse(data);
    console.log(data);

    if (data.type === 'readystate' && data.readyState === 'ready') {
      if (session) {
        selectSession(session);
      }
      else {
        mainwindow.webContents.send('session', JSON.stringify({
          type: 'listsessions',
          sessions: sessionIDs,
        }));
      }

      // sync players when ready
      mainwindow.webContents.send('players', JSON.stringify({
        type: 'allplayers',
        players,
      }));
    }
    else if (data.type === 'newsession') {
      // use the creation time for session IDs
      const now = Date.now().toString();
      // Add new session name to list
      sessionIDs.push({
        name: data.name,
        id: now,
      });
      // Save session name
      store.set('sessionIDs', sessionIDs);

      // Create new session
      session = {
        name: data.name,
        id: now,
        createdAt: now,
        players: [],
      }
      // Save session
      store.set(`sessions.${session.id}`, session);

      selectSession(session);
    }
    else if (data.type === 'session') {
      session = store.get(`sessions.${data.id}`);
      selectSession(session);
    }
    else if (data.type === 'switchsession') {
      store.set(`sessions.${session.id}`, session);
      session = null;
      clearInterval(loopID);
    }
    else if (data.type === 'deletesession') {
      const name = sessionIDs.find(session => session.id.toString() === data.id.toString()).name;
      dialog.showMessageBox(mainwindow, {
        type: 'question',
        title: 'Confirm delete session',
        message: `Are you sure you want to delete your session "${name}"?`,
        // On Windows, only some button names show up in the expected place. (bottom right)
        // If you put in some arbitrary button name, it will be in the main window part with an arrow next to it
        buttons: [
          'Yes',
          'No'
        ]
      }).then(confirm => {
        if (confirm.response === 0) {
          const tempSession = store.get(`sessions.${data.id}`);
          if (tempSession) {
            store.set(`deleted.sessions.${data.id}`, tempSession);
            store.delete(`sessions.${data.id}`);
          }

          // TODO fix inconsistent number/string IDs (sort of fixed now)
          sessionIDs = sessionIDs.filter(session => session.id.toString() !== data.id.toString());
          store.set('sessionIDs', sessionIDs);

          mainwindow.webContents.send('session', JSON.stringify({
            type: 'listsessions',
            sessions: sessionIDs,
          }));
        }
      });
    }
  });

  // Express server for controls
  const staticDir = isdev ? '/build' : '';
  const staticMiddleware = express.static(path.join(__dirname, `..${staticDir}`));
  exApp
    .get('/*', (req, res, next) => {
      console.log(req.params);
      if (req.params[0] === '') {
        res.sendFile(path.join(__dirname, `..${staticDir}/control.html`));
      }
      else if (req.params[0].includes('.html') || !req.params[0].includes('.')) {
        res.sendStatus(404);
      }
      else {
        staticMiddleware(req, res, next);
      }
    })
    .ws('/control', (ws, req) => {
      ws.on('message', msg => {
        /** 
         * connect controller
         * connect player (enter ID/with ID from localStorage)
           * store player here
         * if session is started, put them in the session
           * add player id to session.players, store session
         * If not, send wait message 
         * When session is selected, put all connected players with an ID in the session
           * (Don't put them in the session if the controller doesn't have an ID yet)

        */
        msg = JSON.parse(msg);

        // connect controller (not linked to a player yet)
        if (msg.type === 'controllerconnected') {
          ws.send(response(200, {
            type: 'controllerconnected',
          }));
        }
        // connect a player (link websocket to data & stuff)
        else if (msg.type === 'connectplayer') {
          let id;
          if (msg.newPlayer) {
            if (!msg.name) {
              ws.send(response(400, {
                msg: 'Missing player ID',
              }));
              return;
            }

            // Ensure unique IDs
            for (const tempID in players) {
              if (players[tempID].name === msg.name) {
                ws.send(response(409, {
                  msg: 'Player names must be unique',
                }));
                return;
              }
            }

            // Create new player
            id = Date.now().toString();
            players[id] = {
              id: id,
              name: msg.name,
              online: true,
            };
          }
          else {
            id = msg.id;
            // If it's not a new player, make sure the player exists
            // If there's no id, assume they're connecting from a new device or something and just try to match the name
            // isNaN is to take care of the old ID scheme, could remove it if there are no more devices on that scheme
            if (!id || isNaN(id)) {
              for (const tempID in players) {
                if (players[tempID].name === msg.name) {
                  id = tempID;
                }
              }
            }

            // If no name matched, then conclude the player doesn't exist
            if (!id || !Object.keys(players).includes(id)) {
              ws.send(response(400, {
                msg: `Player ${msg.name || msg.id} does not exist. Would you like to add a new player?`,
              }));
              return;
            }

            players[id].online = true;
          }
          store.set('players', players);

          // link socket to player id
          sockets[id] = ws;

          if (!session) {
            ws.send(response(503, {
              msg: 'Session not started yet',
            }));
          }
          else {
            if (!session.players?.includes(id)) {
              session.players.push(id);
            }
            store.set(`sessions.${session.id}.players`, session.players);

            if (!players[id][session.id]) {
              players[id][session.id] = DEFAULT_SESSION_DATA;
            }
          }

          // confirm new player and send ID to store in localStorage
          ws.send(response(200, {
            type: 'playeradded',
            id,
            name: players[id].name,
            ...(session ? { sessionName: players[id][session.id]?.name } : {}),
          }));

          // Notify main window of player
          mainwindow.webContents.send('players', JSON.stringify({
            type: 'updateplayer',
            id,
            player: players[id],
          }));
        }
        else if (msg.type === 'control') {
          inputs[msg.id] = msg; // set to latest input each time, ignore other inputs
        }
        else if (msg.type === 'changeglobalname') {
          console.log('Change global name', msg.name);
          players[msg.id].name = msg.name;
          store.set(`players.${msg.id}.name`, msg.name);
          mainwindow.webContents.send('players', response(200, {
            type: 'updateplayer',
            id: msg.id,
            player: players[msg.id],
          }));

          ws.send(response(200, {
            type: 'changeglobalname',
            name: msg.name,
          }));
        }
        else if (msg.type === 'changesessionname' && session) {
          players[msg.id][session.id].name = msg.name;
          store.set(`players.${msg.id}.${session.id}.name`, msg.name);
          mainwindow.webContents.send('players', response(200, {
            type: 'updateplayer',
            id: msg.id,
            player: players[msg.id],
          }));

          ws.send(response(200, {
            type: 'changesessionname',
            name: msg.name,
          }));
        }
      });

      ws.on('close', () => {
        controllerDisconnect(ws);
      });
      ws.on('error', () => {
        controllerDisconnect(ws);
      });
    })
    .listen(serverPort, () => {
      console.log(`D&D app listening on port ${serverPort}`)
    })
}

// App-specific logic

/**
 * Create and stringify a response. Loosely based on HTTP responses.
 * @param {number} status The HTTP status code
 * @param {*} body Must be stringifiable
 * @returns {string} The response body and status stringified
 */
function response(status, body) {
  return JSON.stringify({
    ...body,
    status,
    ok: status === 200,
  })
}

function selectSession(session) {
  for (const id in players) {
    if (players[id].online) {
      // Add all online players to session
      // TODO might not be desired behavior
      if (!session.players.includes(id)) {
        session.players.push(id);
      }
      // When the session starts, make sure all players are initialized
      if (players[id] && !players[id][session.id]) {
        players[id][session.id] = DEFAULT_SESSION_DATA;
        // If it just created a new field, update render
        mainwindow.webContents.send('players', JSON.stringify({
          type: 'updateplayer',
          id,
          player: players[id],
        }));
      }
    }
  }

  mainwindow.webContents.send('session', response(200, {
    type: 'session',
    session,
  }));

  for (const id in sockets) {
    sockets[id].send(response(200, {
      type: 'sessionstart',
      sessionName: players[id][session.id].name,
    }));
  }

  loopID = setInterval(loop, 30); // worst game loop probably
}

function controllerDisconnect(ws) {
  for (const id in sockets) {
    if (sockets[id] === ws) {
      mainwindow.webContents.send('players', JSON.stringify({
        type: 'playeroffline',
        id: id,
      }));
    }
  }
}

function save() {
  store.set('players', players);
  session && store.set(`sessions.${session.id}`, session);
}

function loop() {
  for (const id in inputs) {
    if (inputs[id].direction) {
      // shouldn't need this because players are initialized correctly, right?
      /* if (!players[id][session.id]?.position) {
        players[id][session.id].position = {
          x: 0,
          y: 0,
        };
      } */
      players[id][session.id].position.x += inputs[id].direction.x;
      players[id][session.id].position.y += inputs[id].direction.y;

      mainwindow.webContents.send('control', response(200, {
        id: inputs[id].id,
        position: players[id][session.id].position,
      }));
    }
  }
  inputs = {};
}

const store = new Store();
console.log('Store location: ', app.getPath('userData'));

let sessionIDs = store.get('sessionIDs') || [];

let session = null;
const players = store.get('players') || {}; // an array of player IDs

// store sockets separately because they don't need to be persistently stored
const sockets = {};

let inputs = {}; // for buffering controller inputs
let loopID;

app.once("ready", createMainWindow);
app.on("activate", () => { if (!mainwindow) createMainWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
