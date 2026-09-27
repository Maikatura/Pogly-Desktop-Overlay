const { app, ipcMain, globalShortcut } = require('electron')
const { createWindow } = require('./src/window')
const { setupTray } = require('./src/tray')
const { setupShortcuts, registerHotkey } = require('./src/shortcuts')
const { DEFAULT_SERVER_URL, buildOverlayUrl, normalizeServerUrl, parseServerAndModuleFromUrl } = require('./src/connection')
const Store = require('electron-store')

const store = new Store()
let mainWindow = null
let tray = null
let toggleOverlay = null

// Initialize default settings
if (!store.get('hotkey')) store.set('hotkey', 'Insert')
if (!store.get('opacity')) store.set('opacity', 1)

// Migrate legacy installs that only stored the final `url`
// (e.g. https://cloud.pogly.gg/overlay?module=chippy) to the new
// split `serverUrl` + `module` settings used for self-hosted instances.
if (!store.get('serverUrl')) {
  const existingUrl = store.get('url') || ''
  if (existingUrl) {
    const { serverUrl, module } = parseServerAndModuleFromUrl(existingUrl)
    store.set('serverUrl', serverUrl || DEFAULT_SERVER_URL)
    if (module) store.set('module', module)
  } else {
    store.set('serverUrl', DEFAULT_SERVER_URL)
  }
}
if (!store.get('module')) store.set('module', '')
if (!store.get('url')) store.set('url', '')

// Rebuild the final overlay URL from parts when possible so a changed
// default stays consistent. A raw custom URL is left untouched.
function getEffectiveUrl() {
  const storedUrl = store.get('url') || ''
  const serverUrl = store.get('serverUrl') || DEFAULT_SERVER_URL
  const module = store.get('module') || ''
  if (module) {
    const built = buildOverlayUrl(serverUrl, module)
    if (built) return built
  }
  return storedUrl
}

function loadEffectiveUrl() {
  const effectiveUrl = getEffectiveUrl()
  if (mainWindow && effectiveUrl) {
    mainWindow.loadURL(effectiveUrl)
  }
}

// Handle full connection changes (server + module, or a raw custom URL)
ipcMain.on('set-connection', (event, connection) => {
  const { serverUrl, module, url } = connection || {}
  if (typeof url === 'string' && url.trim()) {
    const trimmedUrl = url.trim()
    store.set('url', trimmedUrl)
    const parsed = parseServerAndModuleFromUrl(trimmedUrl)
    if (parsed.serverUrl) store.set('serverUrl', parsed.serverUrl)
    // Only overwrite the module field when the custom URL actually carries one,
    // otherwise keep it for next time the dialog opens in simple mode.
    if (parsed.module) store.set('module', parsed.module)
  } else {
    const normalizedServer = normalizeServerUrl(serverUrl || DEFAULT_SERVER_URL) || DEFAULT_SERVER_URL
    const trimmedModule = (module || '').trim()
    const built = buildOverlayUrl(normalizedServer, trimmedModule)
    store.set('serverUrl', normalizedServer)
    store.set('module', trimmedModule)
    if (built) store.set('url', built)
  }
  loadEffectiveUrl()
})

// Handle URL changes (legacy: old dialog sent a pre-built URL string)
ipcMain.on('set-url', (event, newUrl) => {
  if (typeof newUrl !== 'string' || !newUrl.trim()) return
  const trimmedUrl = newUrl.trim()
  store.set('url', trimmedUrl)
  const { serverUrl, module } = parseServerAndModuleFromUrl(trimmedUrl)
  if (serverUrl) store.set('serverUrl', serverUrl)
  if (module) store.set('module', module)
  loadEffectiveUrl()
})

// Handle hotkey changes
ipcMain.on('set-hotkey', (event, newHotkey) => {
  globalShortcut.unregister(store.get('hotkey'))
  store.set('hotkey', newHotkey)
  registerHotkey(newHotkey, toggleOverlay)

  if (tray) tray.destroy()
  tray = setupTray(mainWindow, store)
})

app.whenReady().then(() => {
  mainWindow = createWindow(store)
  tray = setupTray(mainWindow, store)
  toggleOverlay = setupShortcuts(mainWindow, store)
})

app.on('will-quit', () => {
  if (tray) {
    tray.destroy()
  }
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('activate', () => {
  if (require('electron').BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow(store)
  }
})