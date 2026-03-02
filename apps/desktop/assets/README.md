# Application icons

Place your application icons here for packaged builds:

- **icon.ico** – Windows (multi-resolution, e.g. 256×256). Required for a custom app icon on Windows; if missing, remove the `icon` entry under `win` in `package.json` or the build may fail.
- **icon.png** – Linux (512×512 or larger).
- **icon.icns** – macOS icon bundle.

To generate icons from a single PNG source, use tools like `electron-icon-builder`. Recommended source: 1024×1024 PNG with transparency.
