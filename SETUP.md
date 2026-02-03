# EYWA Platform - Setup Guide & API Registration

> **Version**: 0.1.0 (Development Preview)

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
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
```

### 4. Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 5. Start Development Servers

```bash
# Start all services (API + Web)
pnpm dev

# Or start individually:
# API (http://localhost:4000): cd apps/api && pnpm dev
# Web (http://localhost:3000): cd apps/web && pnpm dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/api/docs

---

## 📝 API Registration Requirements

### Required for Full Functionality

#### 1. AI Features (Summary & Flashcards)

**Option A: OpenAI** (Recommended)
1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Navigate to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key and add to `.env.local`:
   ```
   OPENAI_API_KEY="sk-..."
   AI_PROVIDER="openai"
   ```

**Option B: Anthropic Claude**
1. Go to https://console.anthropic.com/
2. Create an account
3. Get your API key from the dashboard
4. Add to `.env.local`:
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
3. Add credentials to `.env.local`:
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
6. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set callback URL: `http://localhost:4000/api/auth/github/callback`
4. Add to `.env.local`:
   ```
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   ```

#### Email Service (Password Reset, Notifications)

Configure SMTP for email functionality:

**Using SendGrid:**
1. Create account at https://sendgrid.com/
2. Get API key from Settings > API Keys
3. Add to `.env.local`:
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
│   └── web/                 # Next.js Frontend
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # UI components
│           ├── lib/         # Utilities, API client
│           └── hooks/       # React hooks
│
├── packages/
│   ├── database/            # Prisma schema & client
│   └── shared/              # Shared types & validation
│
├── docker-compose.yml       # Development infrastructure
├── .env.example             # Environment template
└── SETUP.md                 # This file
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

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Restart containers
docker-compose down && docker-compose up -d

# Reset database
pnpm db:push --force-reset
```

### Port Conflicts
```bash
# Change ports in docker-compose.yml and .env.local
# Default: API=4000, Web=3000, Postgres=5432, Redis=6379
```

### Build Errors
```bash
# Clear all caches and reinstall
rm -rf node_modules .next dist
pnpm install
pnpm db:generate
```

---

## 📞 Support

- **Issues**: GitHub Issues
- **Email**: support@eywa.app (placeholder)

---

*Developed by PolyU students for the entire academic community*
