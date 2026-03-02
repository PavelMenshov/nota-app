# Building the Nota Desktop App for Windows

---

This guide explains how to build a Windows `.exe` for distribution (e.g. as a GitHub Release asset).

## Prerequisites

- Node.js 20+
- pnpm 8+
- Windows (for building the Windows target; use macOS/Linux + Wine or CI for cross-build)

## Icon (optional)

The build expects `assets/icon.ico` for the Windows app icon. If the file is missing:

- **Option A:** Add a multi-resolution `.ico` (e.g. 256×256) to `assets/icon.ico`. See `assets/README.md` for tips.
- **Option B:** Remove the `"icon": "assets/icon.ico"` line from the `"win"` section in `package.json` to use the default Electron icon.

## Production build (for release)

1. **Set the web app URL** to your production URL so the packaged app loads the live site:

   ```powershell
   $env:WEB_APP_URL = "https://your-nota-domain.com"
   ```

   Or on Linux/macOS:

   ```bash
   export WEB_APP_URL=https://your-nota-domain.com
   ```

2. **From the monorepo root:**

   ```bash
   pnpm --filter @nota/desktop run build
   pnpm --filter @nota/desktop run package:win
   ```

   Or from `apps/desktop`:

   ```bash
   pnpm build
   pnpm package:win
   ```

   The `build` step compiles TypeScript and, when `WEB_APP_URL` is set, writes it into `dist/build-env.json` so the packaged app loads your production URL when users run the .exe.

3. **Output:** Installer and portable builds are in `apps/desktop/release/`:

   - `Nota-Setup-0.1.0.exe` (NSIS installer)
   - `Nota 0.1.0.exe` (portable; exact name may vary by electron-builder version)

Use these artifacts when creating a GitHub Release (upload as release assets).

## GitHub Actions (optional)

A workflow at `.github/workflows/desktop-release.yml` builds the Windows app on **version tag push** (e.g. `v0.1.0`):

1. **Set repository variable** `WEB_APP_URL` to your production web app URL (e.g. `https://app.nota.example.com`) so the packaged app loads the live site:  
   Repo → Settings → Secrets and variables → Actions → Variables → New variable.

2. **Create and push a tag** (from repo root):
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. The workflow runs on Windows, builds the desktop app, and creates a **GitHub Release** for that tag with the `.exe` installer and portable executable attached. No manual upload needed.

If `assets/icon.ico` is missing, the workflow removes the `icon` entry from `package.json` before building so the build does not fail (Electron default icon is used).

## Version

Update `version` in `apps/desktop/package.json` (and optionally in the web app’s `app-config`) before building for a release.
