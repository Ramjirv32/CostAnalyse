const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Disable sandbox to avoid permission issues
app.commandLine.appendSwitch('no-sandbox');

// Keep a reference to prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading from localhost
    },
  });

  // Always load from Vite dev server (port 5173)
  mainWindow.loadURL('http://localhost:5173');
  
  // Open DevTools
  mainWindow.webContents.openDevTools();
}

// Start the app when Electron is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Set up IPC handlers for communication with the renderer process
ipcMain.handle('get-tabs', async () => {
  try {
    // Fetch data from the backend server if you have one
    // const response = await fetch('http://localhost:5000/tabs');
    // const data = await response.json();
    // return data;
    return []; // Placeholder - implement your logic here
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return [];
  }
});

// Additional IPC handlers can be added here for more functionality
