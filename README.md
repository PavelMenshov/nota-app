<p align="center">
  <img src="./assets/logo.svg" alt="Nota Logo" width="100" height="100">
</p>

# Nota — Academic Workspace

> One workspace for notes, canvas, and PDFs — connected by design.

Nota is an academic platform for **students and faculty**. Workspaces contain pages; each page has Doc, Canvas, and Sources (PDF). Everything is versioned, shareable, and collaborative. Target deployment: 2–3 universities (e.g. Skolkovo, HSE, CU in Russia; Minerva internationally).

---

## Product scope (requirements mapping)

### 1. Accounts and access

- Registration and login
- User profile
- **Roles:** Owner / Editor / Viewer
- **Share links** to workspace or page
- **History:** who changed what and when

### 2. Workspaces and pages (core)

- Create and manage Workspaces
- Create and manage Pages inside a Workspace
- Each Page has three modes: **Doc** | **Canvas** | **Sources (PDF)**
- Search across pages (title, tags, content)

### 3. Doc (notes/documents)

- Save and load Doc content per page
- **Real-time collaborative editing**
- Comments on Doc
- **Versions / rollback** (snapshot history)

### 4. Canvas (Miro-like board)

- Save and load Canvas per page
- **Real-time collaborative editing**
- Comments and presence (who’s online)
- **Canvas → Outline:** selected board elements become a structure/outline in Doc

### 5. Sources (PDF)

- Upload multiple PDFs per page
- Store PDFs and control access
- View PDF (serve file to client)
- **Annotations:** highlights and notes/comments
- **Full-text search** in PDFs for that page
- **Extract highlights → Doc** as blocks with source and page number

### 6. Tasks and calendar

- **Tasks:** create, update, close; deadline, status, link to Page
- **Calendar:** manual events; link to Workspace/Page

### 7. Export

- Export Page/Doc to **PDF** and **DOCX**
- Export runs as a **job:** user starts it → gets a file when ready

### 8. AI (study helper)

- AI **does not** generate ready answers; it helps study.
- **Summary:** compress notes/material (Doc + PDF highlights) per page.
- **Flashcards:** generate cards from page content.
- **Context:** AI uses agents with access to **university library systems and knowledge bases**, not only current page materials, for deeper academic context.
- **Usage:** limits / request counting for AI.

---

## For students and faculty

- **Students:** notes, PDFs, canvas, tasks, calendar, AI study tools, collaboration.
- **Faculty:** create and manage workspaces, share materials, control student access (roles), view content, and collaborate with teams. Same roles (Owner/Editor/Viewer) apply.

---

## API and integrations

- **Open API** for extending the platform and building integrations.
- **Canvas API** for programmatic board management and automation.
- **Other APIs:** Workspaces, Pages, Doc, Sources, Tasks, Calendar, Export, AI — documented in Swagger (`/api/docs`).
- **Chat and calls:** integration with **Zoom** and **Google Meet** for online sync and meetings.
- **LMS:** API and architecture support integration with or replacement of LMS (e.g. Blackboard, grading systems); connectivity and custom LMS scenarios are in scope.

---

## Tech stack

| Layer     | Technology                          |
|----------|--------------------------------------|
| Backend  | NestJS, TypeScript, Prisma ORM       |
| Frontend | Next.js 15, React 18, Tailwind CSS   |
| Desktop  | Electron 28                          |
| Database | PostgreSQL 16, Redis                 |
| Realtime | Socket.io, Yjs/CRDT                  |
| Storage  | S3-compatible (AWS/MinIO), local     |
| AI       | OpenAI / Anthropic Claude            |
| Build    | pnpm workspaces, Turborepo           |

---

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

### Setup

```bash
git clone https://github.com/PavelMenshov/nota-platform.git
cd nota-platform
pnpm install

cp .env.example .env
cp .env packages/database/.env

docker compose up -d

pnpm db:generate
pnpm db:push

pnpm dev
```

### Access

| Service      | URL                        |
|-------------|----------------------------|
| Web App     | http://localhost:3000      |
| API         | http://localhost:4000      |
| API Docs    | http://localhost:4000/api/docs |
| Prisma Studio | `pnpm db:studio` → http://localhost:5555 |

### Troubleshooting

- **Database errors:** ensure Docker is running (`docker compose up -d`), and `DATABASE_URL` in `.env` and `packages/database/.env` points to `localhost:5432` (no `db.prisma.io`).
- **Build:** from repo root run `pnpm install`, `pnpm db:generate`, `pnpm db:push` with Docker up.
- **Ports:** Web default 3000, API 4000. Override in `.env` or run web on another port, e.g. `pnpm --filter @nota/web dev -- -p 4040`.

---

## Project structure

```
nota-platform/
├── apps/
│   ├── api/              # NestJS: auth, workspaces, pages, doc, canvas,
│   │   └── src/modules/  # sources, tasks, calendar, ai, export, realtime
│   ├── web/              # Next.js: auth, dashboard, workspace UI
│   └── desktop/          # Electron desktop app
├── packages/
│   ├── database/         # Prisma schema and client
│   └── shared/           # Shared types and validation (Zod)
├── docs/
├── docker-compose.yml
└── .env.example
```

---

## Configuration

**AI (optional):**

```env
OPENAI_API_KEY="sk-..."
AI_PROVIDER="openai"

# Or Anthropic
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="anthropic"
```

Without keys, AI features return placeholders.

**File storage (production):** set `S3_*` in `.env`. Development uses local `uploads/`.

---

## Commands

```bash
pnpm dev           # API + Web
pnpm build         # Build all
pnpm lint          # Lint
pnpm db:generate   # Prisma client
pnpm db:push       # Apply schema
pnpm db:studio     # Prisma Studio
pnpm db:migrate    # Run migrations
```

---

## Documentation

- [Getting Started](./docs/GETTING-STARTED.md)
- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [Desktop App](./docs/DESKTOP-APP.md)
- [Prisma Setup](./docs/PRISMA-SETUP.md)

---

*Nota — for the academic community (students and faculty).*
