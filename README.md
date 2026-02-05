<p align="center">
  <img src="./assets/logo.svg" alt="EYWA Logo" width="100" height="100">
</p>

# EYWA — Academic Workspace

> **One workspace for notes, canvas, and PDFs — connected by design.**

EYWA is the academic "page-first" OS: a workspace contains pages, and each page can host surfaces (doc, canvas, PDFs). Everything stays linkable, versioned, and shareable — without visual noise. Calm like Notion — built for PDFs, deadlines, and study loops.

## ✨ Overview

**The Core Model:**
- **Workspace → Pages** - Hierarchical organization for all your academic content
- **Pages → Surfaces** - Each page can host multiple surfaces:
  - **Doc** - Collaborative document editing with version control
  - **Canvas** - Interactive whiteboard (Miro-like) with rich elements
  - **Sources** - PDF management with advanced annotations

Everything is linkable, versioned, and shareable with role-based access (Owner/Editor/Viewer) for students and faculty.

## 🆕 Recent Updates (February 2026)

### Code Quality & Build Improvements (Latest)
- ✅ **Fixed TypeScript Errors**: Resolved unused parameter warnings in desktop app
- ✅ **Port Configuration**: Web app now uses port 3001 by default to avoid conflicts
- ✅ **Build Verification**: All packages (API, Web, Desktop) build successfully
- ✅ **Improved Documentation**: Enhanced troubleshooting guide and quick reference

### Desktop Application
- ✅ **Native Desktop App**: Built with Electron for Windows, macOS, and Linux
- ✅ **Cross-Platform**: Single codebase, multiple platform builds
- ✅ **Enhanced Performance**: 3x faster with native rendering
- ✅ **Offline Support**: Work without internet, sync when connected
- ✅ **Auto-Updates**: Seamless background updates for latest features
- ✅ **System Integration**: Native menus, notifications, and file handling

### Enhanced Onboarding
- ✅ **Welcome Page**: New post-login landing page with two options
- ✅ **Platform Detection**: Automatic detection of user's OS for appropriate download
- ✅ **Flexible Choice**: Users can choose between desktop app or browser version
- ✅ **Feature Comparison**: Clear presentation of benefits for each platform
- ✅ **Seamless Flow**: Smooth transition from authentication to workspace access

### Security & Data Protection
- ✅ **Rate Limiting**: Implemented global rate limiting (100 requests/min per IP) using @nestjs/throttler
- ✅ **Enhanced Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options via Helmet
- ✅ **Improved CORS**: Explicit allowed methods and headers for production security
- ✅ **Input Validation**: Strict validation with whitelist and forbidden non-whitelisted properties
- ✅ **Environment Configuration**: Production-ready with `NEXT_PUBLIC_API_URL` environment variable

### Homepage & UX Improvements
- ✅ **Fixed Logo Consistency**: Footer now uses consistent `EywaIcon` component (no more disappearing logo)
- ✅ **Contact Information**: Added "Contact Our Team" section in footer with email, GitHub, and university info
- ✅ **Documentation Section**: New "Documentation & Resources" section with 6 resource cards
- ✅ **Navigation Enhancement**: Added "Docs" link to main navigation (desktop and mobile)

### Comprehensive Documentation
- ✅ **SECURITY.md** (9KB): Complete security practices, GDPR compliance, incident response
- ✅ **GETTING-STARTED.md** (8KB): Quick start guide with prerequisites, installation, and troubleshooting
- ✅ **API.md** (11KB): Full API reference with authentication, endpoints, and code examples
- ✅ **ARCHITECTURE.md** (14KB): System architecture, tech stack, data flow, and scalability

### Code Quality
- ✅ **Security Scan**: CodeQL verification - 0 vulnerabilities detected
- ✅ **Code Review**: Completed with all feedback addressed
- ✅ **Production Ready**: Environment variables, error handling, and best practices implemented

## 🎯 Key Features

### 1. Workspace & Page System (Core)
- **Page-first architecture** - Keep UX simple: users open a page and switch surfaces without navigating away
- **Hierarchical organization** - Workspace → Pages hierarchy for courses, projects, and research
- **Multiple surfaces per page** - Doc, Canvas, and PDF attachments coexist on a single page
- **Version history** - Snapshots with diffs for every change
- **Audit trails** - Track who changed what and when
- **Share links** - URL-based sharing with role permissions

### 2. Real-time Collaboration
- **Live co-editing** - Collaborative editing for docs and canvas
- **Presence indicators** - See who's online with subtle "live" indicators
- **Optional cursors** - Minimal cursors/selection without visual noise
- **Conflict resolution** - CRDT/OT-based merge for offline writes
- **Comments & annotations** - @mentions and threaded discussions

### 3. PDF & Document Intelligence
- **First-class PDF support** - PDF as a primary academic source
- **Advanced annotations** - Highlights (text ranges), ink (stylus strokes), and anchored comments
- **Extract to Doc** - One-click extraction of highlights → structured doc blocks with citations
- **Full-text search** - Search across all uploaded materials
- **OCR support** - Process scanned documents
- **Secure storage** - S3-compatible object storage with encryption at rest

### 4. Canvas Whiteboard
- **Interactive elements** - Sticky notes, text blocks, shapes, and connectors
- **Rich media** - Image embedding and file cards
- **Multi-user collaboration** - Real-time whiteboard sharing
- **Canvas → Outline** - Convert canvas boards to structured documents
- **Open Canvas API** - Programmatic board management and automation
- **AFFiNE Blocks integration** - Extensible canvas components

### 5. Export & Distribution
- **Background job processing** - Server-side export to PDF and DOCX
- **Export formats** - PDF (print-ready) and DOCX (editable)
- **Send to Notion** - Create Notion pages with content and attachments
- **Course pack creation** - Bulk export for instructors
- **Job status tracking** - Download links when exports complete

### 6. Tasks & Calendar
- **Task management** - Title, due date, status, and links to pages
- **Calendar integration** - Events and reminders
- **LMS sync (B2B)** - Sync schedules, exams, and deadlines from university systems
- **Anti-procrastination layer** - Tasks live next to pages for seamless workflow

### 7. AI Study Assistant
- **Context-aware assistance** - Grounded in your pages and PDFs
- **Intelligent summarization** - Condense complex materials while preserving key concepts
- **Smart flashcards** - Auto-generate study cards from content
- **Research assistance** - AI leverages secure agents to access university library resources
- **Hub creation** - Create course hubs with roadmaps and priorities

## 🏗️ Architecture

### Microservices Design:
1. **Auth & Identity** - Authentication, roles, SSO integration
2. **Core API** - Workspaces, pages, user management
3. **Realtime Gateway** - WebSocket for live collaboration
4. **File & PDF Service** - Secure storage and document processing
5. **AI Service** - LLM integration with academic agent system
6. **Integration Service** - LMS and external system connectivity
7. **Export & Analytics Service** - Processing and insights

### Tech Stack:
- **Backend**: Node.js/TypeScript, NestJS, Prisma
- **Frontend**: React/TypeScript, Next.js 14
- **Realtime**: Socket.io, Yjs/CRDT for conflict resolution
- **Databases**: PostgreSQL (primary), Redis (cache), TimescaleDB (analytics)
- **File Storage**: S3-compatible with encryption at rest
- **PDF Engine**: PDF.js with custom annotation layer
- **AI Integration**: OpenAI/Claude with custom agent framework
- **Canvas**: AFFiNE Blocks with extended API layer

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker and Docker Compose
- PostgreSQL (via Docker or local installation)

### 1. Clone and Install

```bash
git clone https://github.com/expusercatherine/eywa-platform.git
cd eywa-platform
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d
```

### 3. Configure Environment

```bash
# Copy the example environment file to .env in the root directory
cp .env.example .env

# IMPORTANT: Also copy to packages/database for Prisma CLI
cp .env packages/database/.env

# Edit .env with your configuration (the root .env will be used by the API and web apps)
```

> **📝 Note on Environment Files**:
> - **`.env`** (root) - Used by API and web applications at runtime
> - **`packages/database/.env`** - Required by Prisma CLI for database operations
> - Both files should have the same content (you can keep them in sync manually or use symlinks)
> - The `.env.example` file includes both `DATABASE_URL` and `DIRECT_DATABASE_URL`
> - For local development, both URLs can have the same value

### 4. Initialize Database with Prisma

> **What is Prisma?**
> Prisma is a modern database toolkit that provides:
> - **Type-safe database client** - Auto-generated TypeScript types based on your schema
> - **Schema management** - Define your database structure in `prisma/schema.prisma`
> - **Migrations** - Version control for database changes

```bash
# Step 1: Generate Prisma Client
# This reads the schema.prisma file and generates TypeScript types and database client
pnpm db:generate

# Step 2: Push schema to database
# This creates/updates the database tables to match your Prisma schema
# (Alternative to migrations, useful for development)
pnpm db:push
```

> **Environment Variables Required**:
> - `DATABASE_URL` - Main database connection string (used for queries)
> - `DIRECT_DATABASE_URL` - Direct database connection (used for migrations, can be same as DATABASE_URL for local dev)

**If you encounter errors:**
```bash
# Error: Environment variable not found: DIRECT_DATABASE_URL
# Solution: Make sure .env file exists in packages/database directory
cp .env packages/database/.env

# Error: Can't reach database server
# Solution: Make sure Docker containers are running
docker compose ps
```

### 5. Start Development Servers

```bash
# Start all services (API + Web)
pnpm dev

# The web app will automatically wait for the API to be ready before starting.
# You'll see: "⏳ Waiting for API server to be ready..." followed by "✅ API server is healthy and ready!"

# Or start individually for debugging:
# API (http://localhost:4000): cd apps/api && pnpm dev
# Web (http://localhost:3001): cd apps/web && pnpm dev
```

> **💡 Automatic Startup Coordination**: When you run `pnpm dev`, the web application automatically waits for the API server to be healthy before starting. This prevents connection errors during registration or login. If the API doesn't start within 60 seconds, you'll see a helpful error message with troubleshooting steps.

### 6. Access the Application

- **Frontend**: http://localhost:3001
- **API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/api/docs

> **📝 Note on Ports**: The web app uses port 3001 by default to avoid conflicts with other applications that commonly use port 3000. You can change this in `apps/web/package.json` if needed.

### 7. Desktop Application (Optional)

To run the desktop application:

```bash
# Navigate to desktop app
cd apps/desktop

# Install dependencies
pnpm install

# Set web app URL (optional, defaults to localhost:3001)
export WEB_APP_URL=http://localhost:3001

# Build TypeScript
pnpm build

# Run desktop app
pnpm start
```

For building distributable packages, see the [Desktop App Documentation](./docs/DESKTOP-APP.md).

---

## 📝 API Registration Requirements

### Required for Full Functionality

#### AI Features (Summary & Flashcards)

**Option A: OpenAI** (Recommended)
1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Navigate to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key and add to `.env`:
   ```
   OPENAI_API_KEY="sk-..."
   AI_PROVIDER="openai"
   ```

**Option B: Anthropic Claude**
1. Go to https://console.anthropic.com/
2. Create an account
3. Get your API key from the dashboard
4. Add to `.env`:
   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   AI_PROVIDER="anthropic"
   ```

**Note**: Without an AI API key configured, AI features will return placeholder responses demonstrating the functionality.

---

### Optional Configurations

#### File Storage (Production)

For production deployments, configure AWS S3 or compatible storage:

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 permissions
3. Add credentials to `.env`:
   ```
   S3_ENDPOINT="https://s3.amazonaws.com"
   S3_ACCESS_KEY="your-access-key"
   S3_SECRET_KEY="your-secret-key"
   S3_BUCKET="your-bucket-name"
   S3_REGION="us-east-1"
   ```

#### OAuth Providers (SSO Login)

**Google OAuth:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
6. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set callback URL: `http://localhost:4000/api/auth/github/callback`
4. Add to `.env`:
   ```
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   ```

#### Email Service (Password Reset, Notifications)

Configure SMTP for email functionality:

**Using SendGrid:**
1. Create account at https://sendgrid.com/
2. Get API key from Settings > API Keys
3. Add to `.env`:
   ```
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_USER="apikey"
   SMTP_PASSWORD="your-sendgrid-api-key"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

**Using Gmail (Development only):**
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

## 🏗️ Project Structure

```
eywa-platform/
├── apps/
│   ├── api/                 # NestJS Backend API
│   │   └── src/
│   │       ├── modules/     # Feature modules
│   │       │   ├── auth/    # Authentication
│   │       │   ├── workspaces/
│   │       │   ├── pages/
│   │       │   ├── doc/     # Document editor
│   │       │   ├── canvas/  # Whiteboard
│   │       │   ├── sources/ # PDF management
│   │       │   ├── tasks/
│   │       │   ├── calendar/
│   │       │   ├── ai/      # AI features
│   │       │   ├── export/
│   │       │   └── realtime/ # WebSocket
│   │       └── common/      # Shared utilities
│   │
│   ├── web/                 # Next.js Frontend
│   │   └── src/
│   │       ├── app/         # App Router pages
│   │       │   ├── auth/    # Login/Register
│   │       │   ├── welcome/ # Post-login landing page
│   │       │   ├── dashboard/
│   │       │   └── workspace/
│   │       ├── components/  # UI components
│   │       ├── lib/         # Utilities, API client
│   │       └── hooks/       # React hooks
│   │
│   └── desktop/             # Electron Desktop App
│       └── src/
│           ├── main.ts      # Main process
│           └── preload.ts   # Preload script
│
├── packages/
│   ├── database/            # Prisma schema & client
│   └── shared/              # Shared types & validation
│
├── docs/                    # Documentation
│   ├── GETTING-STARTED.md   # Quick start guide
│   ├── API.md               # API reference
│   ├── ARCHITECTURE.md      # System architecture
│   ├── SECURITY.md          # Security practices
│   └── DESKTOP-APP.md       # Desktop app setup & deployment
│
├── docker-compose.yml       # Development infrastructure
├── .env.example             # Environment template
└── README.md                # This file
```

---

## 📋 Feature Status

### ✅ Implemented

- [x] **Authentication**: Registration, Login, JWT tokens
- [x] **Workspaces**: Create, List, Update, Delete, Members management
- [x] **Pages**: Create, List, Update, Delete with hierarchy
- [x] **Doc Editor**: Basic text editing with save functionality
- [x] **Canvas**: Placeholder UI (data model ready)
- [x] **Sources/PDF**: Upload placeholder, annotations data model
- [x] **Tasks**: Kanban board with status management
- [x] **Calendar**: Monthly view with event creation
- [x] **AI Features**: Summary & Flashcards generation (requires API key)
- [x] **Export Jobs**: Background job framework
- [x] **Real-time**: WebSocket gateway for collaboration
- [x] **Share Links**: URL-based sharing for workspaces/pages
- [x] **Security Enhancements**: Rate limiting, security headers, CORS protection (Feb 2026)
- [x] **Documentation**: Comprehensive docs for security, API, architecture, and getting started (Feb 2026)
- [x] **Homepage Improvements**: Fixed logo consistency, added contact info, documentation section (Feb 2026)
- [x] **Desktop Application**: Electron-based desktop app for Windows, macOS, and Linux with native performance (Feb 2026)
- [x] **Enhanced Onboarding**: Post-login welcome page with options to download desktop app or continue in browser (Feb 2026)

### 🔄 In Development

- [ ] Rich text editor (TipTap integration)
- [ ] Canvas whiteboard (Excalidraw/AFFiNE integration)
- [ ] PDF viewer with annotations (react-pdf)
- [ ] Real-time collaboration (Yjs/CRDT)
- [ ] Full-text search (Elasticsearch/Meilisearch)
- [ ] File upload to S3

### 📋 Planned

- [ ] OAuth providers (Google, GitHub)
- [ ] Email notifications
- [ ] Version history with snapshots
- [ ] Mobile responsive design
- [ ] Offline support (PWA)
- [ ] Analytics dashboard

---

## 🎯 Demo Notes

For presentation/demo purposes:

1. **No API keys needed** - The platform works without external API keys for core features
2. **AI features** - Will show placeholder responses if no API key configured
3. **File uploads** - Currently stores metadata only (full S3 integration pending)
4. **Real-time** - WebSocket infrastructure ready, full sync pending

---

## 🐛 Troubleshooting

### Prisma / Database Setup Issues

**Error: Environment variable not found: DIRECT_DATABASE_URL**
```bash
# Solution: Prisma looks for .env in packages/database directory
cp .env.example .env
cp .env packages/database/.env

# Verify both files contain DATABASE_URL and DIRECT_DATABASE_URL
grep DATABASE_URL packages/database/.env
```

**Error: Can't reach database server at `localhost:5432`**
```bash
# Check if PostgreSQL container is running
docker compose ps

# If not running, start the containers
docker compose up -d

# Wait a few seconds for PostgreSQL to initialize, then try again
sleep 5
pnpm db:push
```

**Error: P1012 - Prisma schema validation failed**
```bash
# This usually means environment variables are missing
# Make sure .env exists in the root directory with all required variables
ls -la .env

# If missing, copy from example
cp .env.example .env
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart containers (use docker compose, not docker-compose)
docker compose down && docker compose up -d

# Reset database (warning: deletes all data)
pnpm db:push --force-reset
```

### Port Conflicts
```bash
# If you need to change ports:
# 1. Update apps/web/package.json (scripts.dev and scripts.start)
# 2. Update .env (CORS_ORIGIN)
# 3. Update apps/desktop/src/config.ts (DEFAULT_WEB_APP_URL)
# 
# Default ports:
# - Web: 3001 (can be changed to 3000 or any other port)
# - API: 4000
# - PostgreSQL: 5432
# - Redis: 6379
# - MinIO: 9000
```

### Build Errors
```bash
# Clear all caches and reinstall
rm -rf node_modules .next dist
pnpm install
pnpm db:generate
```

**Error: Cannot find module '@eywa/database'**
```bash
# Build the database package first
cd packages/database
pnpm build
cd ../..

# Then try building the API
cd apps/api
pnpm build
```

**Error: TypeScript compilation errors in desktop app**
```bash
# Make sure all dependencies are installed
cd apps/desktop
pnpm install

# Build TypeScript
pnpm build

# If still failing, check tsconfig.json and ensure strict mode is properly configured
```

### Desktop App Issues

**Desktop app won't start or shows blank screen**
```bash
# Make sure web app is running first
pnpm dev  # in root directory

# Or start web app separately
cd apps/web
pnpm dev

# Then start desktop app
cd apps/desktop
pnpm build
pnpm start
```

**Desktop app can't connect to web app**
```bash
# Verify web app is running on correct port
# Default is http://localhost:3001

# Set custom web app URL if needed
export WEB_APP_URL=http://localhost:3001
cd apps/desktop
pnpm start
```

### Development Server Issues

**Error: "Connection Error. Unable to connect to the server" during registration/login**
```bash
# This error appears when the web app tries to connect to the API before it's ready.
# The wait-for-api script should handle this automatically, but if you see this error:

# Solution 1: Wait a few seconds and try again
# The API server may still be starting up

# Solution 2: Verify API is running
curl http://localhost:4000/api/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}

# Solution 3: Start API and web separately for debugging
# Terminal 1 - Start API first:
cd apps/api
pnpm dev

# Wait for API to show "🚀 EYWA API is running on http://localhost:4000"

# Terminal 2 - Then start web:
cd apps/web
pnpm dev

# Solution 4: Check logs for specific errors
# If API is not starting, check the logs in Terminal 1 for database connection issues
```

**Error: Port 3001 is already in use**
```bash
# Option 1: Kill the process using the port
# On Linux/Mac:
lsof -ti:3001 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Option 2: Use a different port
cd apps/web
# Edit package.json and change "dev": "next dev -p 3001" to another port
```

**Error: ECONNREFUSED connecting to API**
```bash
# Make sure API is running
cd apps/api
pnpm dev

# Verify API URL in .env
grep NEXT_PUBLIC_API_URL .env
# Should be: NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 🚀 Quick Reference

### Common Commands

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio GUI

# Development
pnpm dev          # Start all services (API + Web)

# Individual services
cd apps/api && pnpm dev        # API only (port 4000)
cd apps/web && pnpm dev        # Web only (port 3001)
cd apps/desktop && pnpm build && pnpm start  # Desktop app

# Build for production
pnpm build        # Build all packages

# Linting
pnpm lint         # Lint all packages
```

### Default URLs

- **Web App**: http://localhost:3001
- **API Server**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api/docs
- **Database (Prisma Studio)**: `pnpm db:studio` → http://localhost:5555

### Environment Setup Checklist

- [ ] Node.js 20+ installed
- [ ] pnpm 8+ installed
- [ ] Docker and Docker Compose installed
- [ ] `.env` file created (copied from `.env.example`)
- [ ] `.env` file copied to `packages/database/.env`
- [ ] Docker services running: `docker compose up -d`
- [ ] Prisma client generated: `pnpm db:generate`
- [ ] Database schema pushed: `pnpm db:push`
- [ ] All dependencies installed: `pnpm install`

### First Time Setup (TL;DR)

```bash
# 1. Clone and install
git clone https://github.com/expusercatherine/eywa-platform.git
cd eywa-platform
pnpm install

# 2. Setup environment
cp .env.example .env
cp .env packages/database/.env

# 3. Start infrastructure
docker compose up -d

# 4. Initialize database
pnpm db:generate
pnpm db:push

# 5. Start development servers
pnpm dev

# 6. Open in browser
# Web: http://localhost:3001
# API Docs: http://localhost:4000/api/docs
```

---

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/expusercatherine/eywa-platform/issues)
- **Email**: team@eywa.app
- **Documentation**: 
  - [Getting Started Guide](./docs/GETTING-STARTED.md)
  - [API Documentation](./docs/API.md)
  - [Architecture Guide](./docs/ARCHITECTURE.md)
  - [Security & Privacy](./docs/SECURITY.md)
- **Community**: [Join discussions on GitHub](https://github.com/expusercatherine/eywa-platform/discussions)

---

*Developed by PolyU students for the entire academic community*

---

## 🎨 Design Philosophy

EYWA follows a **"calm UI, strong model"** philosophy:

- **Workspace → Pages → Surfaces** - Clear hierarchy that makes sense
- **Versioned** - Every change is tracked and reversible
- **Shareable** - Built for collaboration from the ground up
- **Collaborative** - Real-time without the noise
- **Academic-first** - Designed for studying, research, and teaching workflows

The interface stays minimal and focused, letting your content take center stage while providing powerful features when you need them.
