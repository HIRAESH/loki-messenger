const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const fs = require('fs')
const autoUpdater = require('electron-updater').autoUpdater
const autoUpdaterInterval = 60 * 60 * 1000;
const ipc = electron.ipcMain;
const Menu = electron.Menu;
const shell = electron.shell;

app.setAppUserModelId('org.whispersystems.signal-desktop')

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  return true;
});

if (shouldQuit) {
  app.quit();
  return;
}

const package_json = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
process.env.NODE_ENV = package_json.environment || process.env.NODE_ENV || 'development';
process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config');
const config = require('config');

// use a separate data directory for development
if (config.has('storageProfile')) {
  app.setPath('userData', path.join(app.getPath('appData'),
        'Signal-' + config.get('storageProfile')));
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 610,
    webPreferences: {
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load locale
  const locale = 'en'; // FIXME
  const localeData = JSON.parse(fs.readFileSync(path.join(__dirname, '_locales', locale, 'messages.json'), 'utf-8'))
  ipc.on('locale-data', function(event, arg) {
    event.returnValue = localeData;
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'background.html'),
    protocol: 'file:',
    slashes: true,
    query: {
      locale: locale,
      version: package_json.version,
      buildExpiration: config.get('buildExpiration'),
      serverUrl: config.get('serverUrl'),
      NODE_ENV: process.env.NODE_ENV
    }
  }))

  if (config.get('openDevTools')) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  }

  mainWindow.webContents.on('new-window', (e, url) => {
      e.preventDefault();
      const protocol = require('url').parse(url).protocol
      if (protocol === 'http:' || protocol === 'https:') {
            shell.openExternal(url)
      }
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  if (!config.get('disableAutoUpdate')) {
    autoUpdater.addListener('update-downloaded', function() {
      autoUpdater.quitAndInstall()
    });
    autoUpdater.checkForUpdates();
    setInterval(function() { autoUpdater.checkForUpdates(); }, autoUpdaterInterval);
  }

  let template = require('./menu.js');
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.