// Electron imports
const { app, ipcMain, BrowserWindow } = require("electron");
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
const port = process.env.PORT || 3000;
const isdev = !app.isPackaged || (process.env.NODE_ENV == "development");
let mainwindow;

const serverPort = 80;

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

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isdev || true,
    }
  });

  mainwindow.once("close", () => { mainwindow = null; });

  if (!isdev) mainwindow.removeMenu();
  // else mainwindow.webContents.openDevTools();
  mws.manage(mainwindow);

  if (isdev) loadVite(port);
  else loadURL(mainwindow);

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
    mainwindow.webContents.send('ip', addresses[0]);
  });

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
      const now = Date.now();
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
  });

  // Express server for controls
  const staticDir = isdev ? '/build' : '';
  exApp
    .use(express.static(path.join(__dirname, `..${staticDir}`)))
    .get(/^\/([^\.]+)$/, (req, res) => {
      // don't serve the play page from this server, only accessible from inside the app
      // maybe change to 404? pretend it doesn't exist as a web page?
      const slug = req.params[0] === 'play' ? 'out-of-app-error' : req.params[0];
      res.sendFile(path.join(__dirname, `..${staticDir}/${slug || 'index'}.html`));
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

         * TODO better storage for players
          probably store players separately, with different stats per session
          session.players would then be an array of player IDs
          only 

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
            id = Date.now();
            players[id] = {
              id: id,
              name: msg.name,
              online: true,
            };
          }
          // make sure the request has an ID
          else if (!msg.id) {
            ws.send(response(400, {
              msg: 'Missing player ID',
            }));
            return;
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

          // confirm new player and send ID to store in localStorage
          ws.send(response(200, {
            type: 'playeradded',
            id,
            name: players[id].name,
          }));

          // Notify main window of player - main window checks if it know about it or not
          mainwindow.webContents.send('players', JSON.stringify({
            type: 'addplayer',
            player: players[id],
          }));

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
          }
        }
        else if (msg.type === 'control') {
          mainwindow.webContents.send('control', response(200, msg));
        }
        else if (msg.type === 'changeglobalname') {
          console.log('Change global name', msg.name);
          players[msg.id].name = msg.name;
          store.set(`players.${msg.id}.name`, msg.name);
          mainwindow.webContents.send('players', response(200, {
            type: 'updateplayer',
            id: msg.id,
            player: {
              name: msg.name,
            }
          }));

          ws.send(response(200, {
            type: 'changeglobalname',
            name: msg.name,
          }));
        }
        // TODO session name change (and also session names)
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

function notifyAllSockets(msg) {
  for (const socket of expressWs.getWss().clients) {
    socket.send(msg);
  }
}

function selectSession(session) {
  if (session.players) {
    for (const id in session.players) {
      if (!sockets[id]) {
        session.players[id].online = false;
      }
    }
  }

  mainwindow.webContents.send('session', response(200, {
    type: 'session',
    session,
  }));

  notifyAllSockets(response(200, {
    type: 'sessionstart',
  }));
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

const store = new Store();
console.log('Store location: ', app.getPath('userData'));

const sessionIDs = store.get('sessionIDs') || [];

let session = null;
const players = store.get('players') || {}; // an array of player IDs
// set all to offline to start
for (const id in players) {
  players[id].online = false;
}

// store sockets without IDs to make it easier to send to all of them
// Might be able to use expressWs.getWss().clients instead
const tempSockets = [];
// store sockets separately because they don't need to be persistently stored
const sockets = {};

app.once("ready", createMainWindow);
app.on("activate", () => { if (!mainwindow) createMainWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
