const { app, ipcMain, BrowserWindow } = require("electron");
const serve = require("electron-serve");
const ws = require("electron-window-state");
try { require("electron-reloader")(module); } catch { }

const http = require("http");
const path = require("path");
const express = require('express');
const exApp = express();
const expressWs = require('express-ws')(exApp);

const loadURL = serve({ directory: "." });
const port = process.env.PORT || 3000;
const isdev = !app.isPackaged || (process.env.NODE_ENV == "development");
let mainwindow;

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
  })

  // Express server for controls
  exApp
    .use(express.static(path.join(__dirname, '../build')))
    .get(/^\/([^\.]+)$/, (req, res) => {
      console.log(req.params);
      if (!req.params[0].includes('.')) {
        res.sendFile(path.join(__dirname, `../build/${req.params[0] || 'index'}.html`));
      }
    })
    .ws('/play', (ws, req) => {
      mainSocket = ws;
      ws.on('message', msg => {
        console.log(msg);
        ws.send('received: ' + msg)
      });
    })
    .ws('/control', (ws, req) => {
      ws.on('message', msg => {
        console.log('controller:', msg);
        mainwindow.webContents.send('control', msg);
      });
    })
    .listen(8000, () => {
      console.log(`D&D app listening on port ${8000}`)
    })
}

app.once("ready", createMainWindow);
app.on("activate", () => { if (!mainwindow) createMainWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

