# Desktop Application Setup

This guide explains how to set up, develop, and deploy the Nota desktop application.

## Overview

The Nota desktop application is built with Electron and provides a native desktop experience for all major platforms (Windows, macOS, and Linux). It wraps the web application in a native shell with enhanced features like:

- **Native Performance**: Faster startup and better resource management
- **Offline Support**: Work without internet connectivity
- **System Integration**: Native menus, notifications, and file associations
- **Auto-updates**: Seamless background updates
- **Enhanced Security**: Sandboxed environment with local data encryption

## Architecture

```
apps/desktop/
├── src/
│   ├── main.ts       # Main process (Node.js environment)
│   └── preload.ts    # Preload script (bridge between main and renderer)
├── assets/           # Application icons and resources
├── package.json      # Dependencies and build configuration
└── tsconfig.json     # TypeScript configuration
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Development tools for native modules:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `build-essential` package

## Development Setup

### 1. Install Dependencies

```bash
cd apps/desktop
pnpm install
```

### 2. Configure Environment

The desktop app connects to the web application. Set the URL via environment variable:

```bash
# Development (default)
export WEB_APP_URL=http://localhost:3000

# Production
export WEB_APP_URL=https://your-production-url.com
```

### 3. Build TypeScript

```bash
pnpm build
```

This compiles TypeScript files from `src/` to `dist/`.

### 4. Run in Development Mode

```bash
# Build and run
pnpm dev

# Or run separately
pnpm build
pnpm start
```

The app will:
- Load the web application from `WEB_APP_URL`
- Open DevTools automatically in development
- Enable hot-reload for main process changes (requires rebuild)

## Building for Distribution

### Create Application Icons

Before building, add proper icons to `apps/desktop/assets/`:

```bash
# Required files:
assets/
├── icon.png      # 1024x1024 PNG (Linux)
├── icon.ico      # Multi-resolution ICO (Windows)
└── icon.icns     # ICNS bundle (macOS)
```

You can generate these from a single high-res PNG using tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png2icons](https://github.com/idesis-gmbh/png2icons)

### Build for Current Platform

```bash
pnpm package
```

This creates installers in `apps/desktop/release/`.

### Build for Specific Platforms

```bash
# Windows
pnpm package:win

# macOS (requires macOS host)
pnpm package:mac

# Linux
pnpm package:linux
```

### Build Outputs

**Windows**:
- `Nota-Setup-{version}.exe` - NSIS installer
- `Nota-{version}.exe` - Portable executable

**macOS**:
- `Nota-{version}.dmg` - Disk image
- `Nota-{version}.zip` - Compressed app

**Linux**:
- `Nota-{version}.AppImage` - Universal Linux app
- `nota_{version}_amd64.deb` - Debian package

## Code Signing (Production)

### Windows

1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.pfx
   export CSC_KEY_PASSWORD=your-password
   ```

### macOS

1. Join Apple Developer Program
2. Create Developer ID certificate
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   ```

### Linux

AppImage and DEB packages don't require signing but can be GPG-signed for verification.

## Auto-Updates

The app uses `electron-updater` for seamless updates.

### Setup Update Server

1. Host release files on a server or CDN
2. Create a `latest.yml` (Windows/Linux) or `latest-mac.yml` (macOS) file:

```yaml
version: 0.1.0
files:
  - url: Nota-Setup-0.1.0.exe
    sha512: abc123...
    size: 85000000
path: Nota-Setup-0.1.0.exe
sha512: abc123...
releaseDate: '2026-02-05T09:00:00.000Z'
```

3. Configure update server URL in `main.ts`:

```typescript
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-updates-server.com/releases'
});
```

## Distribution

### Deployment Checklist

- [ ] Build for all target platforms
- [ ] Sign applications with valid certificates
- [ ] Test installers on clean systems
- [ ] Generate checksums (SHA-256) for verification
- [ ] Upload to distribution server/CDN
- [ ] Update download URLs in web app (`/welcome` page)
- [ ] Create release notes
- [ ] Update documentation

### Recommended Distribution

1. **GitHub Releases**: Free, automatic checksums, version tracking
2. **CDN**: Fast global distribution (AWS S3 + CloudFront, Cloudflare)
3. **App Stores**: 
   - Microsoft Store (Windows)
   - Mac App Store (macOS)
   - Snap Store, Flathub (Linux)

## Security Best Practices

The desktop app is configured with security in mind:

✅ **Context Isolation**: Enabled by default
✅ **Node Integration**: Disabled in renderer
✅ **Sandbox**: Enabled for renderer processes
✅ **Preload Script**: Controlled IPC bridge
✅ **Content Security Policy**: Configured via Helmet (web app)

### Additional Recommendations

1. **Keep Electron Updated**: Regular security patches
2. **Validate User Input**: Never pass untrusted data to shell commands
3. **Secure IPC**: Use `ipcRenderer.invoke` instead of `send`
4. **External Links**: Always use `shell.openExternal()`
5. **Local Storage**: Encrypt sensitive data with `electron-store`

## Debugging

### Enable DevTools

In development, DevTools open automatically. In production:

```typescript
// main.ts
if (process.env.DEBUG) {
  mainWindow.webContents.openDevTools();
}
```

### Main Process Debugging

```bash
# With Node.js inspector
pnpm start:debug

# Then attach debugger (Chrome DevTools or VS Code)
```

### Logging

```typescript
// Main process
console.log('Main:', message);

// Renderer process (via remote debugging)
console.log('Renderer:', message);
```

Logs are saved to:
- **Windows**: `%USERPROFILE%\AppData\Roaming\Nota\logs\`
- **macOS**: `~/Library/Logs/Nota/`
- **Linux**: `~/.config/Nota/logs/`

## Troubleshooting

### Build Errors

**Error: Cannot find module 'electron'**
```bash
cd apps/desktop
pnpm install
```

**Error: spawn EACCES (Linux)**
```bash
chmod +x apps/desktop/release/Nota-*.AppImage
```

### Runtime Errors

**White screen on startup**
- Check `WEB_APP_URL` is correct and accessible
- Verify web app is running (dev) or deployed (prod)
- Check console for CORS errors

**App won't start (macOS)**
```bash
# Remove quarantine attribute
xattr -cr /Applications/Nota.app
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: cd apps/desktop && pnpm build
      - run: cd apps/desktop && pnpm package
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: apps/desktop/release/*
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Best Practices](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)

## Support

For issues specific to the desktop app:
1. Check `apps/desktop/README.md`
2. Review Electron and electron-builder documentation
3. Open an issue on GitHub with:
   - Platform and version
   - Steps to reproduce
   - Error logs (from app logs directory)
