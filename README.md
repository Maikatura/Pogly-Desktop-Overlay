<p align="center">
    <a href="https://pogly.gg#gh-dark-mode-only" target="_blank">
        <img width="350" src="./images/dark/logo.png" alt="Pogly">
    </a>
    <a href="https://pogly.gg#gh-light-mode-only" target="_blank">
        <img width="350" src="./images/light/logo.png" alt="Pogly">
    </a>
</p>
<p align="center"><em>Desktop Overlay — display your Pogly module directly on screen</em></p>

<p align="center">
    <a href="https://github.com/PoglyApp/pogly-cloud"><img src="https://img.shields.io/badge/built_for-Pogly_Cloud-6441a5.svg?style=flat-square" /></a>
    &nbsp;
    <img src="https://img.shields.io/badge/built_with-Electron-47848F.svg?style=flat-square" />
    &nbsp;
    <a href="https://github.com/PoglyApp/pogly-desktop-overlay/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-50C878.svg?style=flat-square" /></a>
</p>

<p align="center">
    <a href="https://discord.gg/pogly"><img height="25" src="./images/social/discord.svg" alt="Discord" /></a>
    &nbsp;
    <a href="https://www.twitch.tv/poglygg"><img height="25" src="./images/social/twitch.svg" alt="Twitch" /></a>
    &nbsp;
    <a href="https://www.youtube.com/@PoglyApp"><img height="25" src="./images/social/youtube.svg" alt="YouTube" /></a>
    &nbsp;
    <a href="https://x.com/PoglyApp"><img height="25" src="./images/social/twitter.svg" alt="Twitter" /></a>
</p>

<br>

## What is Pogly Desktop Overlay?

[Pogly](https://pogly.gg) is a real-time collaborative stream overlay — think Figma, but for your OBS sources. This companion app lets you display your Pogly module as a **transparent, click-through overlay directly on your desktop**, so your overlay is always visible while you game without needing OBS in the foreground.

## Getting Started

### Download

Grab the latest release from the [releases page](https://github.com/PoglyApp/pogly-desktop-overlay/releases).

### First Launch

1. On first launch you'll be prompted to enter your **Pogly server URL** and **module name**
   - **Pogly Cloud:** server `https://cloud.pogly.gg`, module e.g. `chippy`
   - **Self-hosted (pogly-standalone Docker):** server e.g. `http://localhost:8080` or `https://pogly.example.com`, module e.g. `pogly`
2. The app constructs the URL automatically: `<server>/overlay?module=<name>`
   - Cloud example: `https://cloud.pogly.gg/overlay?module=chippy`
   - Self-hosted example: `http://localhost:8080/overlay?module=pogly`
3. The overlay loads fullscreen, transparent, and click-through — it won't interfere with your game

> **Advanced:** tick `Use full custom URL` in the connection dialog to paste the exact overlay URL instead (same one you'd use as an OBS browser source). This preserves extra params like `&domain=`, `&auth=`, `&layout=`, or `&transparent=`.

### Controls

| Action | How |
|---|---|
| Toggle overlay visibility | Press `Insert` (default) or your configured hotkey |
| Change connection (server / module) | Right-click tray icon → Change Connection (Server / Module) |
| Copy current overlay URL | Right-click tray icon → Copy Overlay URL |
| Change hotkey | Right-click tray icon → Change Hotkey |
| Adjust opacity | Right-click tray icon → Opacity |
| Reset all settings | Right-click tray icon → Reset Settings |
| Exit | Right-click tray icon → Exit |

Double-clicking the tray icon also toggles the overlay.

> **Stream Deck tip:** Add a Hotkey button and bind it to `Insert` (or whatever you configure) for one-tap toggling.

## Building from Source

### Prerequisites

- Node.js
- npm

### Installation

```bash
git clone https://github.com/PoglyApp/pogly-desktop-overlay
cd pogly-desktop-overlay
npm install
npm start
```

### Build for distribution

```bash
npm run build
```

## Technical Details

### Project Structure

```
├── src/
│   ├── connection.js  # Server/module URL building, parsing, validation
│   ├── dialogs.js     # Server/module connection and hotkey prompts
│   ├── shortcuts.js   # Global hotkey registration
│   ├── tray.js        # System tray menu
│   ├── webContent.js  # Content scaling (1920x1080 → native resolution)
│   └── window.js      # Main overlay window setup
├── main.js            # Entry point and IPC handlers
├── preload.js         # IPC bridge
└── package.json
```

### Notes

- The overlay window is scaled from a fixed 1920×1080 canvas to fit your actual screen resolution. This matches how Pogly Cloud renders its canvas.
- Self-hosted `pogly-standalone` instances expose the same `/overlay?module=<name>` route on whatever origin the container is served from (default `http://localhost:8080` for the Docker image), defaulting the SpacetimeDB domain to same-origin — so just pointing the desktop app at your instance origin is enough.
- Settings (server URL, module, full overlay URL, hotkey, opacity) are persisted automatically between sessions via `electron-store`. Existing installs with only a cloud `url` saved are migrated automatically to the new `serverUrl` + `module` settings.

## License

MIT

