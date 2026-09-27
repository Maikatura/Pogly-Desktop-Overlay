const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setUrl: (url) => ipcRenderer.send('set-url', url),
  setConnection: (connection) => ipcRenderer.send('set-connection', connection),
  setHotkey: (hotkey) => ipcRenderer.send('set-hotkey', hotkey)
})