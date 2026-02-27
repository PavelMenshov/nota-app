<p align="center">
  <img src="./assets/logo.svg" alt="Nota Logo" width="100" height="100">
</p>

# Nota — Academic Workspace

> **One workspace for notes, canvas, and PDFs — connected by design.**

Nota is an academic "page-first" workspace: a workspace contains pages, and each page can host surfaces (doc, canvas, PDFs). Everything stays linkable, versioned, and shareable — without visual noise.

## ✨ Key Features

- **Workspace → Pages → Surfaces** — Hierarchical organization for courses, projects, and research
- **Doc Editor** — Collaborative document editing with version history
- **Canvas Whiteboard** — Interactive whiteboard with shapes, notes, and connectors
- **PDF/DOCX/PPTX Support** — Upload, view, and annotate documents directly in the workspace
- **Folders & Tabs** — Organize documents in folders, open multiple files simultaneously as browser-like tabs
- **Real-time Collaboration** — Live co-editing with presence indicators via WebSocket
- **Tasks & Calendar** — Built-in task management and calendar for deadlines
- **AI Assistant** — Summarization, flashcard generation, and content explanation (OpenAI/Claude)
- **Integrations** — Quick access to Zoom, Microsoft Teams, and Outlook
- **Export** — Export to PDF, DOCX, Markdown, or send to Notion
- **Share Links** — URL-based sharing with role-based access (Owner/Editor/Viewer)
- **Desktop App** — Native Electron app for Windows, macOS, and Linux

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Frontend** | Next.js 15, React 18, Tailwind CSS |
| **Desktop** | Electron 28 |
| **Database** | PostgreSQL 16, Redis |
| **Realtime** | Socket.io, Yjs/CRDT |
| **Storage** | S3-compatible (AWS/MinIO), local fallback |
| **AI** | OpenAI / Anthropic Claude |
| **Build** | pnpm workspaces, Turborepo |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

### Setup

```bash
# 1. Clone and install
git clone https://github.com/PavelMenshov/nota-platform.git
cd nota-platform
pnpm install

# 2. Configure environment
cp .env.example .env
cp .env packages/database/.env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 4. Initialize database
pnpm db:generate
pnpm db:push

# 5. Start development servers
pnpm dev
```

### Access

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3001 |
| **API Server** | http://localhost:4000 |
| **API Docs (Swagger)** | http://localhost:4000/api/docs |
| **Prisma Studio** | `pnpm db:studio` → http://localhost:5555 |

> The web app uses port 3001 by default to avoid conflicts. When running `pnpm dev`, the web app automatically waits for the API to be ready.

## 📁 Project Structure

```
nota-platform/
├── apps/
│   ├── api/              # NestJS Backend API
│   │   └── src/modules/  # auth, workspaces, pages, doc, canvas,
│   │                     # sources, tasks, calendar, ai, export, realtime
│   ├── web/              # Next.js Frontend
│   │   └── src/
│   │       ├── app/      # App Router (auth, dashboard, workspace)
│   │       ├── components/
│   │       └── lib/      # API client, stores, utilities
│   └── desktop/          # Electron Desktop App
├── packages/
│   ├── database/         # Prisma schema & client
│   └── shared/           # Shared types & validation (Zod)
├── docs/                 # Extended documentation
├── docker-compose.yml
└── .env.example
```

## ⚙️ Configuration

### AI Features (Optional)

```env
# OpenAI (recommended)
OPENAI_API_KEY="sk-..."
AI_PROVIDER="openai"

# Or Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="anthropic"
```

Without an API key, AI features return placeholder responses.

### File Storage (Production)

```env
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
```

For development, files are stored locally in the `uploads/` directory.

## 🛠️ Common Commands

```bash
pnpm dev              # Start all services (API + Web)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:migrate       # Run database migrations
```

## 🐛 Troubleshooting

**Database connection issues:**
```bash
docker compose ps          # Check if containers are running
docker compose up -d       # Start containers
cp .env packages/database/.env  # Ensure Prisma has env vars
```

**Build errors:**
```bash
rm -rf node_modules .next dist
pnpm install
pnpm db:generate
```

**Port conflicts:**
```bash
# Default ports: Web=3001, API=4000, PostgreSQL=5432, Redis=6379
# Change web port in apps/web/package.json
```

For detailed troubleshooting, see the [docs/](./docs/) directory.

## 📖 Documentation

- [Getting Started](./docs/GETTING-STARTED.md) — Installation and setup guide
- [API Reference](./docs/API.md) — Full API documentation
- [Architecture](./docs/ARCHITECTURE.md) — System design and tech stack
- [Security](./docs/SECURITY.md) — Security practices and GDPR compliance
- [Desktop App](./docs/DESKTOP-APP.md) — Desktop app setup and distribution
- [Prisma Setup](./docs/PRISMA-SETUP.md) — Database configuration details

## 🎨 Design Philosophy

Nota follows a **"calm UI, strong model"** philosophy:
- **Minimal interface** — Content takes center stage
- **Versioned** — Every change is tracked and reversible
- **Collaborative** — Real-time without the noise
- **Academic-first** — Designed for studying, research, and teaching

---

*Developed by PolyU students for the academic community*
