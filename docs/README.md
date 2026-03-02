# Nota documentation

Overview of the `docs/` folder. For a quick setup from the repo root, see the main [README Quick start](../README.md#quick-start).

## Main guides

| Document | Purpose |
|----------|--------|
| [**GETTING-STARTED.md**](./GETTING-STARTED.md) | **Primary onboarding** — install, run locally, first steps, concepts, common tasks, troubleshooting (English). |
| [**LOCAL_DEV_RU.md**](./LOCAL_DEV_RU.md) | **Short local dev guide in Russian** (Локальный запуск). Same setup flow as GETTING-STARTED but condensed, plus tunnel/CORS for sharing. For Russian-speaking contributors. |

## Reference

| Document | Purpose |
|----------|--------|
| [**API.md**](./API.md) | REST API reference (auth, workspaces, pages, etc.). Use Swagger at `http://localhost:4000/api/docs` for interactive docs. |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System and monorepo structure, auth, data layer, realtime, security. |
| [**SECURITY.md**](./SECURITY.md) | Security practices, repo security (secrets, env), compliance, reporting. |
| [**DESKTOP-APP.md**](./DESKTOP-APP.md) | Build, run, and package the Electron desktop app. |
| [**PRISMA-SETUP.md**](./PRISMA-SETUP.md) | Prisma client generation, type errors, and DB commands. For full project setup, use [GETTING-STARTED.md](./GETTING-STARTED.md) first. |
| [**API-CONNECTION-TROUBLESHOOTING.md**](./API-CONNECTION-TROUBLESHOOTING.md) | When the web app shows "Cannot connect to API server" — checklist and fixes. Full setup is in [GETTING-STARTED.md](./GETTING-STARTED.md). |

## Avoiding redundancy

- **First-time setup and run:** use [GETTING-STARTED.md](./GETTING-STARTED.md) (or [LOCAL_DEV_RU.md](./LOCAL_DEV_RU.md) if you prefer Russian).
- **API connection / red status in UI:** use [API-CONNECTION-TROUBLESHOOTING.md](./API-CONNECTION-TROUBLESHOOTING.md) and the setup steps in GETTING-STARTED.
- **Prisma types / DB scripts:** use [PRISMA-SETUP.md](./PRISMA-SETUP.md); initial env and Docker are in GETTING-STARTED.
