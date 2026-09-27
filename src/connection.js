const DEFAULT_SERVER_URL = 'https://cloud.pogly.gg'
const DEFAULT_OVERLAY_PATH = '/overlay'

function ensureProtocol(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed
  // Default to http for localhost / private hosts, https otherwise.
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(trimmed)) {
    return `http://${trimmed}`
  }
  return `https://${trimmed}`
}

function normalizeServerUrl(input) {
  let server = ensureProtocol(input).trim()
  if (!server) return ''
  // Strip trailing slashes.
  server = server.replace(/\/+$/, '')
  // Strip a trailing /overlay (users often paste the full overlay URL).
  server = server.replace(/\/overlay\/?$/i, '')
  return server
}

function isValidServerUrl(input) {
  try {
    const normalized = normalizeServerUrl(input)
    if (!normalized) return false
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch (_) {
    return false
  }
}

function isValidModuleName(input) {
  const name = (input || '').trim()
  if (!name) return false
  // Pogly module names: letters, numbers, dashes, underscores. No spaces/URLs.
  return /^[A-Za-z0-9_-]+$/.test(name)
}

function buildOverlayUrl(serverUrl, moduleName) {
  const server = normalizeServerUrl(serverUrl)
  const module = (moduleName || '').trim()
  if (!server || !module) return ''
  return `${server}${DEFAULT_OVERLAY_PATH}?module=${encodeURIComponent(module)}`
}

function parseServerAndModuleFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return { serverUrl: '', module: '' }
    const trimmed = url.trim()
    if (!trimmed) return { serverUrl: '', module: '' }
    const parsed = new URL(ensureProtocol(trimmed))
    const module = parsed.searchParams.get('module') || ''
    let base = `${parsed.protocol}//${parsed.host}`
    // Keep any sub-path prefix (e.g. reverse-proxy subpaths), minus the /overlay suffix.
    let pathname = parsed.pathname || ''
    pathname = pathname.replace(/\/overlay\/?$/i, '')
    if (pathname && pathname !== '/') {
      base += pathname.replace(/\/+$/, '')
    }
    return { serverUrl: base, module }
  } catch (_) {
    return { serverUrl: '', module: '' }
  }
}

function isValidOverlayUrl(input) {
  try {
    const trimmed = (input || '').trim()
    if (!trimmed) return false
    const parsed = new URL(ensureProtocol(trimmed))
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    // Accept any http(s) URL so advanced params (?domain=&auth=&layout=...) keep working.
    return true
  } catch (_) {
    return false
  }
}

module.exports = {
  DEFAULT_SERVER_URL,
  DEFAULT_OVERLAY_PATH,
  ensureProtocol,
  normalizeServerUrl,
  isValidServerUrl,
  isValidModuleName,
  buildOverlayUrl,
  parseServerAndModuleFromUrl,
  isValidOverlayUrl
}
