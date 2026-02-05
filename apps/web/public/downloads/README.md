# Desktop App Downloads

This directory should contain the built desktop application installers.

## Build and Deploy Desktop Apps

To generate the desktop app installers:

```bash
# Navigate to desktop app
cd apps/desktop

# Install dependencies
pnpm install

# Build for current platform
pnpm build
pnpm package

# Build for specific platforms
pnpm package:win    # Windows (.exe)
pnpm package:mac    # macOS (.dmg)
pnpm package:linux  # Linux (.AppImage)
```

## Expected Files

After building, move the following files here for distribution:

- **Windows**: `EYWA-Setup.exe` (installer) or `EYWA-portable.exe`
- **macOS**: `EYWA.dmg` (disk image) or `EYWA.zip`
- **Linux**: `EYWA.AppImage` or `EYWA.deb`

## Production Deployment

For production, use a CDN or file hosting service:

1. Upload built files to a CDN (e.g., AWS S3, Cloudflare)
2. Update download URLs in `/apps/web/src/app/welcome/page.tsx`
3. Set up proper MIME types and download headers
4. Implement version checking and update notifications

## Security

- Sign your applications (code signing certificates)
- Use HTTPS for all download links
- Implement checksum verification (SHA-256)
- Set up auto-update infrastructure for seamless updates
