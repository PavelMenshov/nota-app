# Getting Started with Nota

Welcome to Nota - Your All-in-One Academic Ecosystem! This guide will help you get up and running with Nota in minutes.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [First Steps](#first-steps)
4. [Core Concepts](#core-concepts)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20 or higher
- **pnpm** 8 or higher
- **Docker** and Docker Compose
- **Git**

### System Requirements

- **Operating System**: macOS, Linux, or Windows (with WSL2)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space
- **Network**: Internet connection for initial setup

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/PavelMenshov/nota-platform.git
cd nota-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the monorepo, including the API and web applications.

### 3. Start Infrastructure

Nota requires PostgreSQL, Redis, and MinIO (for file storage). Start them using Docker Compose:

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker-compose ps
```

You should see three services running:
- `nota-postgres` on port 5432
- `nota-redis` on port 6379
- `nota-minio` on ports 9000 and 9001

### 4. Configure Environment

Copy the example environment file:

```bash
# Copy to root directory
cp .env.example .env

# Copy to database package for Prisma CLI
cp .env packages/database/.env
```

Edit the `.env` file and set all placeholder values (e.g. `YOUR_POSTGRES_PASSWORD`, `YOUR_JWT_SECRET`). Use strong, unique values in production; for local Docker dev you can use simple passwords that match the values you set for `POSTGRES_PASSWORD` and MinIO in `.env`.

**Important Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_DATABASE_URL`: Direct database connection (same as DATABASE_URL for local dev)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `OPENAI_API_KEY`: (Optional) For AI features

### 5. Initialize Database

Generate Prisma client and push schema to database:

```bash
# Generate Prisma client types
pnpm db:generate

# Push schema to database
pnpm db:push
```

**Prisma and DB commands:** After pulling schema changes or editing `schema.prisma`, run `pnpm db:generate` (and `pnpm db:push` for dev). If you see TypeScript errors like `Property 'user' does not exist on type 'PrismaService'`, run `pnpm db:generate` and restart your IDE/TS server. For migrations in production use `pnpm db:migrate`; for Prisma Studio use `pnpm db:studio`.

**Wipe the database:** To delete all data and start from a clean schema, run `pnpm db:wipe`. This requires Docker (e.g. `docker compose up -d`). It drops the `nota` database, recreates it, and runs `pnpm db:push`. Stop the API before running it. Without Docker, drop the database manually (e.g. `psql -U nota -d template1 -c "DROP DATABASE IF EXISTS nota;" -c "CREATE DATABASE nota;"`) then run `pnpm db:push`.

### 6. Start Development Servers

Start both API and web applications:

```bash
pnpm dev
```

Or start them individually:

```bash
# In one terminal - API
cd apps/api
pnpm dev

# In another terminal - Web
cd apps/web
pnpm dev
```

### 7. Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Documentation (Swagger)**: http://localhost:4000/api/docs
- **MinIO Console**: http://localhost:9001 (credentials: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from `.env`)

## First Steps

### Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in your details:
   - Full name
   - Email address
   - Password (minimum 8 characters)
4. Click "Create Account"

### Create Your First Workspace

After registration, you'll be prompted to create a workspace:

1. Enter a workspace name (e.g., "My Academic Hub")
2. Optionally add a description
3. Click "Create Workspace"

Your first workspace is created! 🎉

### Create Your First Page

Pages are the core organizational unit in Nota:

1. In your workspace, click "+ New Page"
2. Enter a page title (e.g., "Study Notes")
3. Choose a page icon (optional)
4. Click "Create"

### Explore Surfaces

Each page can host multiple "surfaces":

- **Doc**: Collaborative document editor
- **Canvas**: Interactive whiteboard
- **Sources**: PDF viewer with annotations

Switch between surfaces using the tabs at the top of the page.

## Core Concepts

### Workspace Hierarchy

```
Workspace
  └── Pages
      ├── Doc Surface
      ├── Canvas Surface
      └── PDF Sources
```

### Roles & Permissions

- **Owner**: Full control, can manage members
- **Editor**: Can create and modify content
- **Viewer**: Read-only access

### Version History

Every change is tracked:
- View previous versions
- See who made changes and when
- Restore old versions if needed

### Sharing

Share workspaces or pages via:
- **Direct member addition**: Add users by email
- **Share links**: Generate public or private links
- **Role-based permissions**: Control access level

## Common Tasks

### Creating a Doc

1. Open a page
2. Click "Doc" tab
3. Start typing!
4. Changes auto-save every few seconds

**Features:**
- Rich text formatting
- Headings and lists
- Code blocks
- Tables
- Images and links

### Uploading PDFs

1. Open a page
2. Click "Sources" tab
3. Click "Upload PDF"
4. Select your PDF file
5. Add annotations:
   - Highlight text
   - Add comments
   - Draw with ink tool

### Managing Tasks

1. Click "Tasks" in sidebar
2. Create a new task:
   - Title
   - Due date
   - Status (To Do, In Progress, Done)
   - Link to page (optional)
3. Drag tasks to change status

### Using the Calendar

1. Click "Calendar" in sidebar
2. View monthly calendar
3. Click a day to add event
4. Events can link to tasks

### AI Features

If you have an AI API key configured:

1. Open any doc
2. Select text
3. Click "AI" button
4. Choose:
   - **Summarize**: Get a concise summary
   - **Flashcards**: Generate study cards
   - **Explain**: Get detailed explanations

### Inviting Collaborators

1. Open a workspace
2. Click "Members" or "Share"
3. Enter email address
4. Select role (Owner/Editor/Viewer)
5. Click "Invite"

They'll receive an invitation email.

### Exporting Content

1. Open a page
2. Click "Export" button
3. Choose format:
   - PDF (print-ready)
   - DOCX (editable)
4. Wait for export to complete
5. Download file

## Troubleshooting

### API connection (web app shows "Cannot connect to API server")

1. **Docker** — `docker compose up -d` and `docker compose ps` (postgres, redis, minio running).
2. **Env** — `.env` in root and `packages/database/.env`.
3. **DB** — `pnpm db:generate` and `pnpm db:push`.
4. **API** — `pnpm dev:api` (or `pnpm dev`). API at `http://localhost:4000`.
5. **Web** — `pnpm dev:web` if not using `pnpm dev`. Web at `http://localhost:3000`.

Check: `curl http://localhost:4000/api/health`. If CORS errors, set `CORS_ORIGIN` in `.env` to your web URL and restart the API.

### Database Connection Failed

**Problem**: Can't connect to PostgreSQL

**Solutions:**
1. Ensure Docker containers are running:
   ```bash
   docker-compose ps
   ```
2. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
3. Check DATABASE_URL in .env file

### Prisma Errors

**Problem**: "Environment variable not found: DIRECT_DATABASE_URL"

**Solution:**
```bash
# Make sure .env exists in both locations
cp .env packages/database/.env
```

### Port Already in Use

**Problem**: Port 3000 or 4000 already in use

**Solutions:**
1. Stop the service using that port
2. Or change ports in:
   - `.env`: Change `PORT` variable
   - `docker-compose.yml`: Change port mappings

### Build Errors

**Problem**: TypeScript or build errors

**Solutions:**
1. Clear caches:
   ```bash
   rm -rf node_modules .next dist
   pnpm install
   pnpm db:generate
   ```
2. Ensure you're using Node.js 20+
3. Check for TypeScript errors in IDE

### AI Features Not Working

**Problem**: AI requests return placeholder responses

**Solution:**
Add AI API key to `.env` (use your real key from OpenAI or Anthropic; never commit it):
```bash
# For OpenAI
OPENAI_API_KEY="your-openai-api-key"
AI_PROVIDER="openai"

# For Anthropic Claude
ANTHROPIC_API_KEY="your-anthropic-api-key"
AI_PROVIDER="anthropic"
```

### File Upload Errors

**Problem**: Can't upload files

**Solutions:**
1. Check MinIO is running:
   ```bash
   docker-compose ps nota-minio
   ```
2. Verify S3 configuration in .env
3. Check file size limits (default: 10MB)

### Windows-Specific Issues

**Problem**: `EINVAL: invalid argument, readlink` error when running `pnpm dev` in apps/web

**Description**: This error occurs on Windows when Next.js tries to read symlinks in the `.next` directory, which is not fully supported on Windows file systems.

**Solutions:**
1. **Clear the .next directory** (recommended first step):
   ```bash
   # In PowerShell or Command Prompt
   cd apps\web
   rmdir /s /q .next
   pnpm dev
   ```
   
   Or in Git Bash/WSL:
   ```bash
   cd apps/web
   rm -rf .next
   pnpm dev
   ```

2. **The configuration fix** has already been applied in `apps/web/next.config.js` - it sets the `outputFileTracingRoot` to the monorepo root, which prevents symlink issues.

3. **If the error persists**, ensure you're using the latest version of Node.js and pnpm:
   ```bash
   node --version  # Should be 20.x or higher
   pnpm --version  # Should be 8.x or higher
   ```

4. **Alternative**: Use WSL2 (Windows Subsystem for Linux) for development, which has better symlink support and better matches production Linux environments.

## Next Steps

Now that you're up and running:

1. **Explore Features**: Try all the surfaces and tools
2. **Read Documentation**: Check out other guides
3. **Join Community**: Visit GitHub for discussions
4. **Provide Feedback**: Report bugs or suggest features

## Quick Reference

### Useful Commands

```bash
# Start everything
pnpm dev

# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Prisma Studio

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Default Ports

- **Web App**: 3000
- **API**: 4000
- **PostgreSQL**: 5432
- **Redis**: 6379
- **MinIO API**: 9000
- **MinIO Console**: 9001

### Keyboard Shortcuts

- `Cmd/Ctrl + K`: Open command palette
- `Cmd/Ctrl + P`: Quick page search
- `Cmd/Ctrl + B`: Bold text
- `Cmd/Ctrl + I`: Italic text
- `Cmd/Ctrl + S`: Save (auto-save is on by default)

## Additional Resources

- [Architecture Overview](../README.md#-architecture)
- [API Documentation](http://localhost:4000/api/docs)
- [Security Guide](./SECURITY.md)
- [GitHub Repository](https://github.com/PavelMenshov/nota-platform)

## Before release (opening repo or creating a tag)

- **Secrets** — No `.env` or real API keys in repo or history. (Gitleaks runs in CI.)
- **Clone URL** — Update `git clone` URLs in README/docs if repo is under a different org.
- **LICENSE** — Present (MIT); update copyright if needed.
- **Tag/release** — e.g. `git tag -a v0.1.0 -m "Release"` then push tag; create GitHub Release and attach build artifacts (e.g. desktop .exe).

## Need Help?

- **GitHub Issues**: Report bugs or request features
- **Email**: support@nota.app
- **Community**: Join discussions on GitHub

---

*Happy learning with Nota! 🚀*
