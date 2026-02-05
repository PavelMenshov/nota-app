# EYWA Desktop Application

Desktop application for EYWA platform built with Electron.

## Features

- Native desktop experience for EYWA platform
- Cross-platform support (Windows, macOS, Linux)
- Offline capability
- Native notifications
- Auto-updates
- System tray integration

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start
```

## Building

```bash
# Build for all platforms
pnpm package

# Build for specific platform
pnpm package:win   # Windows
pnpm package:mac   # macOS
pnpm package:linux # Linux
```

## Environment Variables

- `WEB_APP_URL`: URL of the web application (default: http://localhost:3000)
- `NODE_ENV`: Set to 'development' for dev mode

## Architecture

- **main.ts**: Main process handling window creation, menu, and system integration
- **preload.ts**: Preload script exposing safe APIs to the renderer process
- Built-in security with context isolation and sandboxing

## Distribution

The built application will be available in the `release` directory:
- Windows: `.exe` installer and portable `.exe`
- macOS: `.dmg` and `.zip`
- Linux: `.AppImage` and `.deb`
