// Electron imports
const { app, ipcMain, BrowserWindow } = require("electron");
const serve = require("electron-serve");
const ws = require("electron-window-state");
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
  let mws = ws({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  mainwindow = new BrowserWindow({
    x: mws.x,
    y: mws.y,
    width: mws.width,
    height: mws.height,

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

  ipcMain.on('main', (_, msg) => {
    console.log(msg);
  });

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
        console.log('controller:', msg);
        // Send to main window
        mainwindow.webContents.send('control', msg);

        // parse for use here
        const unstrung = JSON.parse(msg);
        if (unstrung.controllerID) {
          if (unstrung.newPlayer) {
            if (!players[unstrung.controllerID]) {
              players[unstrung.controllerID] = {};
            }
            else {
              ws.send(response(409, {
                msg: 'Player names must be unique',
              }))
              return;
            }
          }
          sockets[unstrung.controllerID] = ws;
          ws.send(response(200, {
            type: 'playeradded',
            id: unstrung.controllerID,
          }));
          store.set('players', players);
        }
      });
    })
    .listen(serverPort, () => {
      console.log(`D&D app listening on port ${serverPort}`)
    })
}

// App-specific logic

function response(status, body) {
  return JSON.stringify({
    ...body,
    status,
    ok: status === 200,
  })
}

const store = new Store();

const players = store.get('players') || {};

// store sockets separately because they don't need to be persistently stored
const sockets = {};

app.once("ready", createMainWindow);
app.on("activate", () => { if (!mainwindow) createMainWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
