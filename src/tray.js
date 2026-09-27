const { Tray, Menu, globalShortcut, clipboard } = require('electron')
const path = require('path')
const { promptForUrl, promptForHotkey } = require('./dialogs')
const { registerHotkey } = require('./shortcuts')
const { DEFAULT_SERVER_URL } = require('./connection')

function setupTray(mainWindow, store) {
  const tray = new Tray(path.join(__dirname, '../pogly.ico'))

  function toggleWindowVisibility() {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  }

  function setOpacity(value) {
    if (mainWindow) {
      mainWindow.setOpacity(value)
      store.set('opacity', value)
      tray.setContextMenu(buildMenu())
    }
  }

  function resetSettings() {
    globalShortcut.unregisterAll()
    store.clear()
    store.set('hotkey', 'Insert')
    store.set('serverUrl', DEFAULT_SERVER_URL)
    store.set('module', '')
    store.set('url', '')
    store.set('opacity', 1)
    if (mainWindow) {
      mainWindow.setOpacity(1)
      mainWindow.hide()
    }
    registerHotkey('Insert', toggleWindowVisibility)
    tray.setContextMenu(buildMenu())
    promptForUrl(store, mainWindow)
  }

  function buildMenu() {
    const serverUrl = store.get('serverUrl') || DEFAULT_SERVER_URL
    const module = store.get('module') || ''
    const currentUrl = store.get('url') || ''
    const connectionLabel = module ? `${module} @ ${serverUrl}` : (currentUrl || serverUrl)
    return Menu.buildFromTemplate([
      {
        label: `Toggle Overlay (${store.get('hotkey')})`,
        click: toggleWindowVisibility
      },
      {
        label: `Connection: ${connectionLabel}`,
        enabled: false
      },
      {
        label: 'Opacity',
        submenu: [
          { label: '25%', type: 'radio', checked: store.get('opacity') === 0.25, click: () => setOpacity(0.25) },
          { label: '50%', type: 'radio', checked: store.get('opacity') === 0.50, click: () => setOpacity(0.50) },
          { label: '75%', type: 'radio', checked: store.get('opacity') === 0.75, click: () => setOpacity(0.75) },
          { label: '100%', type: 'radio', checked: store.get('opacity') === 1, click: () => setOpacity(1) }
        ]
      },
      { type: 'separator' },
      {
        label: 'Change Connection (Server / Module)',
        click: () => promptForUrl(store, mainWindow)
      },
      {
        label: 'Copy Overlay URL',
        enabled: Boolean(store.get('url')),
        click: () => {
          const urlToCopy = store.get('url') || ''
          if (urlToCopy) clipboard.writeText(urlToCopy)
        }
      },
      {
        label: 'Change Hotkey',
        click: () => promptForHotkey(store)
      },
      { type: 'separator' },
      {
        label: 'Reset Settings',
        click: () => resetSettings()
      },
      {
        label: 'Exit',
        click: () => require('electron').app.quit()
      }
    ])
  }

  tray.setContextMenu(buildMenu())
  tray.setToolTip('Pogly Overlay')
  tray.on('double-click', toggleWindowVisibility)

  return tray
}

module.exports = { setupTray }