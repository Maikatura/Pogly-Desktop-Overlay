const { BrowserWindow } = require('electron')
const path = require('path')
const { DEFAULT_SERVER_URL, buildOverlayUrl, parseServerAndModuleFromUrl } = require('./connection')

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getConnectionState(store) {
  let serverUrl = store.get('serverUrl') || DEFAULT_SERVER_URL
  let module = store.get('module') || ''
  const storedUrl = store.get('url') || ''

  if ((!serverUrl || !module) && storedUrl) {
    const parsed = parseServerAndModuleFromUrl(storedUrl)
    if (parsed.serverUrl) serverUrl = parsed.serverUrl
    if (parsed.module) module = parsed.module
  }

  const built = module ? buildOverlayUrl(serverUrl, module) : ''
  // If a stored URL exists but doesn't match server+module (extra query params
  // like ?domain= / ?auth= / ?layout=, or a non-/overlay path), open the
  // dialog in advanced mode so we don't silently drop those params.
  const startInCustomMode = Boolean(storedUrl && (!built || storedUrl !== built))
  const customUrl = startInCustomMode ? storedUrl : (built || storedUrl)

  return { serverUrl, module, storedUrl, startInCustomMode, customUrl }
}

function promptForUrl(store, mainWindow) {
  const urlWindow = new BrowserWindow({
    width: 560,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    },
    autoHideMenuBar: true,
    frame: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    minWidth: 480,
    minHeight: 560
  })

  const { serverUrl, module, startInCustomMode, customUrl } = getConnectionState(store)

  const htmlContent = encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connect Pogly Overlay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 24px;
            margin: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .container {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          h3 {
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 600;
          }

          label {
            font-size: 12px;
            font-weight: 600;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .hint {
            font-size: 12px;
            color: #888;
          }

          input[type="text"] {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s ease;
          }

          input[type="text"]:focus {
            outline: none;
            border-color: #6441a5;
            box-shadow: 0 0 0 3px rgba(100, 65, 165, 0.12);
          }

          .presets {
            display: flex;
            gap: 8px;
          }

          .preset-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            background: #f6f3fc;
            color: #6441a5;
            transition: all 0.2s ease;
          }

          .preset-btn:hover {
            background: #ece4f7;
            border-color: #6441a5;
          }

          .url-preview {
            font-size: 11px;
            color: #888;
            word-break: break-all;
            min-height: 16px;
            background: #f8f8f8;
            border-radius: 6px;
            padding: 8px 10px;
          }

          .url-preview span {
            color: #6441a5;
            font-weight: 500;
          }

          .error {
            font-size: 12px;
            color: #c0392b;
            min-height: 16px;
          }

          .advanced-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #444;
            cursor: pointer;
            user-select: none;
          }

          .actions {
            display: flex;
            justify-content: flex-end;
          }

          button.primary {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #6441a5;
            color: white;
          }

          button.primary:hover {
            background: #503289;
          }

          button.primary:disabled {
            background: #ccc;
            cursor: default;
          }
        </style>

        <div class="container">
          <h3>Connect Pogly Overlay</h3>

          <div id="simpleSection" class="container" style="gap: 14px;">
            <div class="field">
              <label for="serverUrl">Server URL</label>
              <input
                type="text"
                id="serverUrl"
                value="${escapeAttr(serverUrl)}"
                placeholder="https://cloud.pogly.gg"
                spellcheck="false"
                autocomplete="off"
              >
              <div class="presets">
                <button class="preset-btn" id="presetCloud" type="button">Pogly Cloud</button>
                <button class="preset-btn" id="presetLocal" type="button">Localhost :8080</button>
              </div>
              <div class="hint">Self-hosted? Enter your instance address, e.g. http://localhost:8080 or https://pogly.example.com. You can also paste a full overlay URL here and it will be split automatically.</div>
            </div>

            <div class="field">
              <label for="moduleName">Module name</label>
              <input
                type="text"
                id="moduleName"
                value="${escapeAttr(module)}"
                placeholder="e.g. chippy (self-hosted default is pogly)"
                spellcheck="false"
                autocomplete="off"
                autofocus
              >
            </div>
          </div>

          <div id="advancedSection" class="field" style="display: none;">
            <label for="customUrl">Full overlay URL</label>
            <input
              type="text"
              id="customUrl"
              value="${escapeAttr(customUrl)}"
              placeholder="https://your-instance/overlay?module=pogly&domain=..."
              spellcheck="false"
              autocomplete="off"
            >
            <div class="hint">Advanced: paste the exact overlay URL (same one you would use as an OBS browser source). Supports extra params like &amp;domain= &amp;auth= &amp;layout= &amp;transparent=.</div>
          </div>

          <label class="advanced-toggle">
            <input type="checkbox" id="customMode" ${startInCustomMode ? 'checked' : ''}>
            Use full custom URL (advanced)
          </label>

          <div class="url-preview" id="preview"></div>
          <div class="error" id="error"></div>
          <div class="actions">
            <button class="primary" id="saveBtn" onclick="submit()">Connect</button>
          </div>
        </div>

        <script>
          var CLOUD_URL = '${DEFAULT_SERVER_URL}';
          var serverInput = document.getElementById('serverUrl');
          var moduleInput = document.getElementById('moduleName');
          var customToggle = document.getElementById('customMode');
          var customInput = document.getElementById('customUrl');
          var simpleSection = document.getElementById('simpleSection');
          var advancedSection = document.getElementById('advancedSection');
          var preview = document.getElementById('preview');
          var errorEl = document.getElementById('error');
          var saveBtn = document.getElementById('saveBtn');

          function withProtocol(v) {
            v = (v || '').trim();
            if (!v) return '';
            if (/^[a-zA-Z][a-zA-Z0-9+.\\-]*:\\/\\//.test(v)) return v;
            return 'https://' + v;
          }

          function normalizeServer(v) {
            v = withProtocol(v).trim().replace(/\\/+$/, '');
            v = v.replace(/\\/overlay\\/?$/i, '');
            return v;
          }

          function buildUrl(server, mod) {
            var s = normalizeServer(server);
            var m = (mod || '').trim();
            if (!s || !m) return '';
            return s + '/overlay?module=' + encodeURIComponent(m);
          }

          function isValidServer(v) {
            try {
              var n = normalizeServer(v);
              if (!n) return false;
              var u = new URL(n);
              return u.protocol === 'http:' || u.protocol === 'https:';
            } catch (e) { return false; }
          }

          function isValidModule(v) {
            return /^[A-Za-z0-9_-]+$/.test((v || '').trim());
          }

          function normalizeCustomUrl(v) {
            v = (v || '').trim();
            if (!v) return '';
            if (!/^[a-zA-Z][a-zA-Z0-9+.\\-]*:\\/\\//.test(v)) v = 'https://' + v;
            return v;
          }

          function isValidCustomUrl(v) {
            try {
              var u = new URL(normalizeCustomUrl(v));
              return u.protocol === 'http:' || u.protocol === 'https:';
            } catch (e) { return false; }
          }

          function trySplitFullUrl(raw) {
            try {
              var text = (raw || '').trim();
              if (!text || text.indexOf('?module=') === -1) return false;
              var u = new URL(withProtocol(text));
              var mod = u.searchParams.get('module');
              if (!mod) return false;
              var base = u.protocol + '//' + u.host;
              var p = u.pathname || '';
              p = p.replace(/\\/overlay\\/?$/i, '');
              if (p && p !== '/') base += p.replace(/\\/+$/, '');
              serverInput.value = base;
              moduleInput.value = mod;
              return true;
            } catch (e) { return false; }
          }

          function syncModeVisibility() {
            var custom = customToggle.checked;
            simpleSection.style.display = custom ? 'none' : 'flex';
            advancedSection.style.display = custom ? 'flex' : 'none';
          }

          function updatePreview() {
            syncModeVisibility();
            var finalUrl = '';
            var error = '';
            if (customToggle.checked) {
              var raw = customInput.value.trim();
              if (!raw) {
                error = '';
              } else if (!isValidCustomUrl(raw)) {
                error = 'Enter a valid http(s) overlay URL.';
              } else {
                finalUrl = normalizeCustomUrl(raw);
              }
              preview.textContent = finalUrl;
              saveBtn.disabled = !finalUrl || !!error;
              errorEl.textContent = error;
            } else {
              var server = serverInput.value;
              var mod = moduleInput.value;
              if (!server && !mod) {
                error = '';
              } else if (!isValidServer(server)) {
                error = 'Enter a valid server URL, e.g. https://cloud.pogly.gg or http://localhost:8080.';
              } else if (!mod.trim()) {
                error = 'Enter your module name.';
              } else if (!isValidModule(mod)) {
                error = 'Module names may only contain letters, numbers, dashes and underscores.';
              } else {
                finalUrl = buildUrl(server, mod);
              }
              if (finalUrl) {
                var idx = finalUrl.indexOf('?module=');
                preview.textContent = '';
                preview.appendChild(document.createTextNode(finalUrl.slice(0, idx + 8)));
                var span = document.createElement('span');
                span.textContent = finalUrl.slice(idx + 8);
                preview.appendChild(span);
              } else {
                preview.textContent = '';
              }
              saveBtn.disabled = !finalUrl;
              errorEl.textContent = error;
            }
          }

          function submit() {
            if (saveBtn.disabled) return;
            if (customToggle.checked) {
              var raw = normalizeCustomUrl(customInput.value);
              if (!isValidCustomUrl(raw)) return;
              if (window.electronAPI && window.electronAPI.setConnection) {
                window.electronAPI.setConnection({ url: raw });
              } else {
                window.electronAPI.setUrl(raw);
              }
              window.close();
              return;
            }
            var server = normalizeServer(serverInput.value);
            var mod = moduleInput.value.trim();
            if (!isValidServer(server) || !isValidModule(mod)) return;
            if (window.electronAPI && window.electronAPI.setConnection) {
              window.electronAPI.setConnection({ serverUrl: server, module: mod });
            } else {
              window.electronAPI.setUrl(buildUrl(server, mod));
            }
            window.close();
          }

          document.getElementById('presetCloud').addEventListener('click', function() {
            serverInput.value = CLOUD_URL;
            if (customToggle.checked) { customToggle.checked = false; }
            updatePreview();
            moduleInput.focus();
          });

          document.getElementById('presetLocal').addEventListener('click', function() {
            serverInput.value = 'http://localhost:8080';
            if (customToggle.checked) { customToggle.checked = false; }
            updatePreview();
            moduleInput.focus();
          });

          serverInput.addEventListener('change', function() {
            if (trySplitFullUrl(serverInput.value)) {
              updatePreview();
            }
          });

          serverInput.addEventListener('input', updatePreview);
          moduleInput.addEventListener('input', updatePreview);
          customInput.addEventListener('input', updatePreview);
          customToggle.addEventListener('change', updatePreview);
          customInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submit();
          });
          moduleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submit();
          });
          serverInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              if (trySplitFullUrl(serverInput.value)) updatePreview();
              submit();
            }
          });

          updatePreview();
        </script>
      </body>
    </html>
  `)

  urlWindow.loadURL(`data:text/html;charset=UTF-8,${htmlContent}`)
  urlWindow.removeMenu()
}

function promptForHotkey(store) {
  const hotkeyWindow = new BrowserWindow({
    width: 400,
    height: 250,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    },
    autoHideMenuBar: true,
    frame: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    minWidth: 300,
    minHeight: 250
  })

  const currentHotkey = store.get('hotkey')
  const htmlContent = encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Set Hotkey</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 24px;
            margin: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }
          
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          
          h3 { 
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
          }
          
          #key { 
            font-size: 32px;
            font-weight: 600;
            padding: 20px 40px;
            background: #f8f8f8;
            border: 2px solid #2196F3;
            border-radius: 8px;
            min-width: 140px;
            text-align: center;
            color: #1a1a1a;
            transition: all 0.2s ease;
            user-select: none;
          }
          
          #key:empty:before {
            content: "${currentHotkey || 'F22'}";
            color: #666;
          }
          
          #instruction {
            font-size: 13px;
            color: #666;
            text-align: center;
          }
        </style>

        <div class="container">
          <h3>Press any key to set as hotkey</h3>
          <div id="key"></div>
          <div id="instruction">Press Esc to cancel</div>
        </div>

        <script>
          const keyDisplay = document.getElementById('key');
          
          document.addEventListener('keydown', (e) => {
            e.preventDefault();
            
            if (e.key === 'Escape') {
              window.close();
              return;
            }
            
            const key = e.key.toUpperCase();
            keyDisplay.textContent = key;
            window.electronAPI.setHotkey(key);
            // Close the window after a brief delay to show the key
            setTimeout(() => window.close(), 200);
          });
        </script>
      </body>
    </html>
  `)

  hotkeyWindow.loadURL(`data:text/html;charset=UTF-8,${htmlContent}`)
  hotkeyWindow.removeMenu()
}

module.exports = { promptForUrl, promptForHotkey }
