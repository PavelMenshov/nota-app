# EYWA Platform - All-in-One Academic Workspace

> **One Platform. Zero Friction.**

EYWA is a unified platform for university students, combining notes, PDF annotations, interactive whiteboards, tasks, and calendar in one application. Developed by PolyU students for students.

## ✨ Core Features

### 🎯 Product Core
- **Workspaces & Pages**: Hierarchical content organization
- **Three page modes**:
  - **Doc** - Collaborative document editing
  - **Canvas** - Interactive whiteboard (Miro-like)
  - **Sources** - PDF management and annotations

### 🤝 Collaboration Modes
- **Real-time collaborative editing** (Doc and Canvas)
- **Presence** - See who's online
- **Comments** on elements
- **Version history** and rollback

### 📄 PDF Handling
- PDF upload and storage
- Annotations (highlights, notes)
- Full-text search within PDFs
- Extract highlights into Doc

### 🎨 Canvas (Miro-like Whiteboard)
- Sticky notes, text blocks, shapes
- Connectors, images, file cards
- Canvas → Outline conversion in Doc
- AFFiNE Blocks integration

### 📅 Tasks & Calendar
- Tasks with deadlines linked to pages
- Calendar events
- Integration with academic systems (Blackboard)

### 🤖 AI Study Assistant
- **Summary** - Compress study materials
- **Flashcards** - Create memorization cards
- Limited to current page sources
- Request limits/usage tracking

### 📤 Export
- Export to PDF and DOCX
- Background job processing
- Send to Notion

## 🏗️ Architecture

### Microservices:
1. **Auth & Identity** - Authentication, roles, access control
2. **Core API** - Workspaces, pages, tasks, calendar
3. **Realtime Gateway** - WebSocket for collaboration
4. **File Service** - File upload/storage, PDF processing
5. **Export Service** - Background export jobs
6. **AI Service** - LLM integration

### Tech Stack:
- **Backend**: Node.js/TypeScript, NestJS, Prisma
- **Frontend**: React/TypeScript, Next.js
- **Realtime**: Socket.io, CRDT (Yjs)
- **Databases**: PostgreSQL, Redis
- **File Storage**: S3-compatible storage
- **PDF**: PDF.js, custom annotations
- **Canvas**: AFFiNE Blocks integration

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/eywa-platform.git
cd eywa-platform

# Setup (coming soon)
npm run setup

# Development
docker-compose up -d
npm run dev