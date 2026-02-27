# Architecture Guide

## Overview

Nota follows a modern microservices-inspired architecture with clear separation of concerns, built on a monorepo structure using Turborepo for efficient builds and development.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Web Frontend   │         │  Mobile (Future) │         │
│  │   (Next.js 14)   │         │  (React Native)  │         │
│  └──────────────────┘         └──────────────────┘         │
└────────────┬─────────────────────────────┬─────────────────┘
             │                             │
             │ HTTPS / WSS                 │
             │                             │
┌────────────┴─────────────────────────────┴─────────────────┐
│                      Gateway Layer                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NestJS API Gateway                       │  │
│  │  - Authentication & Authorization                     │  │
│  │  - Rate Limiting & Security                          │  │
│  │  - Request Routing                                    │  │
│  │  - API Documentation (Swagger)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
│   Service    │  │   Service   │  │   Service   │
│   Modules    │  │   Modules   │  │   Modules   │
└──────────────┘  └─────────────┘  └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
┌─────────────────────────┴────────────────────────────────────┐
│                      Data Layer                              │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │PostgreSQL │  │   Redis   │  │   MinIO   │  │WebSocket │ │
│  │ (Primary) │  │  (Cache)  │  │(S3-Files) │  │ Gateway  │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Project Structure

```
nota-platform/
├── apps/                      # Application packages
│   ├── api/                   # NestJS Backend API
│   │   └── src/
│   │       ├── modules/       # Feature modules
│   │       │   ├── auth/      # Authentication
│   │       │   ├── workspaces/
│   │       │   ├── pages/
│   │       │   ├── doc/       # Document editor
│   │       │   ├── canvas/    # Whiteboard
│   │       │   ├── sources/   # PDF management
│   │       │   ├── tasks/
│   │       │   ├── calendar/
│   │       │   ├── ai/        # AI features
│   │       │   ├── export/
│   │       │   └── realtime/  # WebSocket
│   │       └── common/        # Shared utilities
│   │
│   └── web/                   # Next.js Frontend
│       └── src/
│           ├── app/           # App Router pages
│           ├── components/    # UI components
│           ├── lib/           # Utilities, API client
│           └── hooks/         # React hooks
│
├── packages/                  # Shared packages
│   ├── database/              # Prisma schema & client
│   └── shared/                # Shared types & validation
│
├── docs/                      # Documentation
├── docker-compose.yml         # Development infrastructure
└── turbo.json                 # Turborepo configuration
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios
- **Real-time**: Socket.io-client

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **ORM**: Prisma
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Throttler

### Database & Storage
- **Primary Database**: PostgreSQL 16
- **Cache**: Redis 7
- **File Storage**: MinIO (S3-compatible)
- **Search** (Future): Meilisearch/Elasticsearch

### DevOps & Tools
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Containerization**: Docker & Docker Compose
- **CI/CD** (Future): GitHub Actions
- **Testing**: Jest, Playwright

### External Services
- **AI**: OpenAI GPT / Anthropic Claude
- **Email** (Future): SendGrid
- **OAuth** (Future): Google, GitHub

## Core Modules

### 1. Authentication Module (`auth`)

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing (bcrypt)
- Session management
- OAuth integration (planned)

**Database Schema:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Security:**
- Password strength requirements
- Rate limiting on auth endpoints
- Token expiration (7 days default)
- Secure password reset flow

### 2. Workspaces Module (`workspaces`)

**Responsibilities:**
- Workspace CRUD operations
- Member management
- Role-based access control (Owner, Editor, Viewer)
- Share link generation
- Workspace settings

**Database Schema:**
```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  members     WorkspaceMember[]
  pages       Page[]
  createdAt   DateTime @default(now())
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        Role     @default(VIEWER)
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}
```

### 3. Pages Module (`pages`)

**Responsibilities:**
- Page CRUD operations
- Hierarchical organization (nested pages)
- Page ordering
- Page icons and metadata

**Database Schema:**
```prisma
model Page {
  id          String   @id @default(cuid())
  workspaceId String
  title       String
  icon        String?
  parentId    String?  // For nested pages
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### 4. Document Module (`doc`)

**Responsibilities:**
- Rich text document storage
- Version history (planned)
- Collaborative editing
- Block-based content structure

**Content Format:**
- ProseMirror/TipTap JSON format
- Block-based structure
- Supports: paragraphs, headings, lists, code blocks, tables, etc.

### 5. Canvas Module (`canvas`)

**Responsibilities:**
- Interactive whiteboard
- Shape and element management
- Real-time collaboration
- Export to image/PDF

**Technology:**
- Excalidraw or AFFiNE Blocks
- Canvas API for custom elements

### 6. Sources Module (`sources`)

**Responsibilities:**
- PDF file upload and storage
- PDF annotations (highlights, comments, ink)
- Extract highlights to doc blocks
- File metadata management

**Storage:**
- Files stored in MinIO (S3-compatible)
- Metadata in PostgreSQL
- PDF.js for rendering

### 7. Tasks Module (`tasks`)

**Responsibilities:**
- Task CRUD operations
- Kanban board (TODO, IN_PROGRESS, DONE)
- Due dates and priorities
- Link to pages
- Task assignments (planned)

### 8. Calendar Module (`calendar`)

**Responsibilities:**
- Event CRUD operations
- Calendar views (month, week, day)
- Event reminders
- Link to tasks
- LMS sync (planned for B2B)

### 9. AI Module (`ai`)

**Responsibilities:**
- Content summarization
- Flashcard generation
- Study assistance
- RAG (Retrieval Augmented Generation)
- Rate limiting and usage tracking

**Integration:**
- OpenAI GPT-4 or Anthropic Claude
- Context-aware prompts
- Streaming responses

### 10. Export Module (`export`)

**Responsibilities:**
- Background job processing
- PDF generation (print-ready)
- DOCX generation (editable)
- Job status tracking
- Download link generation

**Technology:**
- Puppeteer for PDF
- docx library for DOCX
- Job queue (Bull + Redis, planned)

### 11. Realtime Module (`realtime`)

**Responsibilities:**
- WebSocket gateway
- User presence
- Document collaboration (CRDT/OT)
- Live cursors and selection
- Broadcast updates

**Technology:**
- Socket.io for WebSocket
- Yjs for CRDT (planned)
- Awareness protocol for presence

## Data Flow

### 1. Page Viewing Flow

```
User → Web App → API Gateway → Pages Module → Database
                                      ↓
                             Get Page Data
                                      ↓
User ← Web App ← API Response ← Pages Module
```

### 2. Real-time Collaboration Flow

```
User A → Web App → WebSocket → Realtime Gateway
                                      ↓
                              Broadcast to room
                                      ↓
User B ← Web App ← WebSocket ← Realtime Gateway
```

### 3. AI Processing Flow

```
User → Web App → API Gateway → AI Module → OpenAI/Claude
                                      ↓
                              Process response
                                      ↓
User ← Web App ← API Response ← AI Module
```

### 4. File Upload Flow

```
User → Web App → API Gateway → Sources Module
                                      ↓
                              Upload to MinIO
                                      ↓
                              Save metadata
                                      ↓
User ← Web App ← API Response ← Sources Module
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. API validates credentials
3. Password verified with bcrypt
4. JWT token generated with user payload
5. Token sent to client
6. Client stores token (HTTP-only cookie or localStorage)
7. Subsequent requests include token in Authorization header
8. API validates token on each request
```

### Authorization Layers

1. **Authentication Guard**: Verifies JWT token
2. **Role Guard**: Checks user role for resource
3. **Ownership Guard**: Verifies user owns/can access resource
4. **Rate Limit Guard**: Prevents abuse

### Security Measures

- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Strict origin validation
- **Rate Limiting**: Throttler module
- **Input Validation**: class-validator DTOs
- **SQL Injection**: Prisma ORM (parameterized queries)
- **XSS Protection**: Content sanitization
- **CSRF**: SameSite cookies
- **Password Security**: Bcrypt hashing

## Database Design

### Key Design Decisions

1. **CUID for IDs**: Collision-resistant, lexicographically sortable
2. **Soft Deletes**: Keep deleted data for 30 days (planned)
3. **Audit Trails**: Track who changed what and when
4. **Optimistic Locking**: Version field for conflict resolution
5. **Indexes**: Strategic indexes on frequently queried fields

### Relationships

```
User
  ├── owns → Workspace[]
  ├── member of → WorkspaceMember[]
  └── creates → Page[], Task[], Event[]

Workspace
  ├── has → Page[]
  ├── has → Task[]
  ├── has → Event[]
  └── has → WorkspaceMember[]

Page
  ├── has → Doc (1:1)
  ├── has → Canvas (1:1)
  ├── has → Source[] (1:many)
  └── has → children → Page[]
```

## Scalability Considerations

### Current Architecture (MVP)

- Single server deployment
- PostgreSQL for all data
- Redis for caching
- MinIO for files

### Future Scaling Path

1. **Horizontal Scaling**
   - Load balancer (Nginx/Traefik)
   - Multiple API instances
   - Redis Cluster for session storage

2. **Database Optimization**
   - Read replicas for queries
   - PgBouncer for connection pooling
   - Partitioning for large tables

3. **Caching Strategy**
   - Redis for hot data
   - CDN for static assets
   - Browser caching with ETags

4. **Microservices Split** (if needed)
   - Separate AI service
   - Separate export/job processing service
   - Separate real-time service

5. **Search Enhancement**
   - Elasticsearch/Meilisearch for full-text search
   - Separate search index

## Deployment

### Development

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
pnpm install

# Setup database
pnpm db:push

# Start all services
pnpm dev
```

### Production (Future)

- Containerized deployment (Docker)
- Kubernetes orchestration
- PostgreSQL managed service (RDS/Supabase)
- Redis managed service (ElastiCache)
- S3 for file storage
- CloudFront CDN
- GitHub Actions CI/CD

## Monitoring & Observability

### Planned

- **Logging**: Winston + CloudWatch
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Error Tracking**: Sentry
- **Analytics**: PostHog
- **Uptime**: Pingdom

## Performance Optimization

1. **Frontend**
   - Next.js ISR for static pages
   - Image optimization
   - Code splitting
   - Lazy loading components

2. **Backend**
   - Database query optimization
   - N+1 query prevention
   - Response caching
   - Compression (gzip/brotli)

3. **Network**
   - HTTP/2
   - WebSocket for real-time
   - CDN for assets
   - DNS prefetching

## Testing Strategy

1. **Unit Tests**: Individual functions and methods
2. **Integration Tests**: Module interactions
3. **E2E Tests**: Full user workflows (Playwright)
4. **API Tests**: Endpoint validation
5. **Load Tests**: Performance under load (k6)

## Contributing

See the main README.md for contribution guidelines.

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

*Last updated: February 2026*
