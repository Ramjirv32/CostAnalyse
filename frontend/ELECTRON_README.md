# Electron App Setup

Your React frontend is now configured as an Electron desktop application with a window size of **1200x800**.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

**Option A: Run separately (recommended for development)**
```bash
# Terminal 1 - Start Vite dev server
npm run dev

# Terminal 2 - Start Electron (once Vite is running)
npm run electron:dev
```

**Option B: You can create a concurrent script** (optional)
Install `concurrently`: `npm install -D concurrently`
Then add to package.json scripts:
```json
"dev:electron": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && npm run electron:dev\""
```

### 3. Build for Production

```bash
# Build the React app and package as Electron app
npm run electron:build
```

This will create distributable packages in the `release/` directory.

## 📁 Files Created

- **main.js** - Electron main process (creates 1200x800 window)
- **preload.js** - Secure bridge between Electron and React
- **vite.config.js** - Updated with `base: './'` for Electron compatibility
- **package.json** - Added Electron scripts and dependencies

## 🔧 Configuration

### Window Size
The app opens with dimensions: **1200px × 800px**

To change this, edit `main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1200,  // Change this
  height: 800,  // Change this
  // ...
});
```

### IPC Communication

The app includes a sample IPC handler for communication between React and Electron:

**In your React components:**
```javascript
// Check if running in Electron
if (window.electronAPI) {
  const tabs = await window.electronAPI.getTabs();
  console.log(tabs);
}
```

**Add more IPC handlers in main.js:**
```javascript
ipcMain.handle('your-channel', async (event, args) => {
  // Your logic here
  return result;
});
```

**Expose them in preload.js:**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  yourMethod: (args) => ipcRenderer.invoke('your-channel', args),
});
```

## 📦 Build Outputs

- **Linux**: AppImage, .deb
- **Windows**: NSIS installer, portable .exe
- **macOS**: .dmg, .zip

## 🔍 Troubleshooting

- **Electron shows blank screen**: Make sure Vite dev server is running on port 5173
- **Build fails**: Run `npm run build` first to ensure React app builds successfully
- **DevTools not opening**: Check `main.js` - DevTools only open in development mode
