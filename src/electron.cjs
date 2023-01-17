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

const serverPort = 8000;

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
    }
    else if (data.type === 'newsession') {
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
        players: {},
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
      console.log(req.params);
      const slug = req.params[0] === 'play' ? 'out-of-app-error' : req.params[0];
      res.sendFile(path.join(__dirname, `..${staticDir}/${slug || 'index'}.html`));
    })
    .ws('/control', (ws, req) => {
      ws.on('message', msg => {
        msg = JSON.parse(msg);
        console.log('controller:', msg);

        if (!session) {
          tempSockets.push(ws);
          ws.send(response(503, {
            msg: 'Session not started yet',
          }));
          return;
        }
        else if (msg.type === 'controllerconnected') {
          ws.send(response(200, {
            type: 'sessionstart',
          }));
        }

        if (msg.type === 'connectplayer' && msg.id) {
          if (msg.newPlayer && session.players[msg.id]) {
            ws.send(response(409, {
              msg: 'Player names must be unique',
            }));
            return;
          }
          if (!session.players[msg.id]) {
            session.players[msg.id] = {};
          }
          // link socket to player id
          sockets[msg.id] = ws;

          mainwindow.webContents.send('players', JSON.stringify({
            type: 'allplayers',
            players: session.players
          }));

          ws.send(response(200, {
            type: 'playeradded',
            id: msg.id,
          }));
          store.set(`sessions.${session.name}.players`, session.players);
        }
        else if (msg.type === 'control') {
          mainwindow.webContents.send('control', response(200, msg));
        }
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

function notifyControllers(msg) {
  for (const socket of tempSockets) {
    socket.send(msg);
  }
}

function selectSession(session) {
  mainwindow.webContents.send('session', response(200, {
    type: 'session',
    session,
  }));

  notifyControllers(response(200, {
    type: 'sessionstart',
  }));
}

const store = new Store();

const sessionIDs = store.get('sessionIDs') || [];

let session = null;

const tempSockets = [];
// store sockets separately because they don't need to be persistently stored
const sockets = {};

app.once("ready", createMainWindow);
app.on("activate", () => { if (!mainwindow) createMainWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
