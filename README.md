# EYWA Platform - All-in-One Academic Ecosystem

> **One Platform. Zero Friction.**

EYWA is a unified academic ecosystem for university students and faculty, combining notes, PDF annotations, interactive whiteboards, tasks, and calendar in one intelligent platform. Developed by PolyU students for the entire academic community.

## ✨ Core Features

### 🎯 Product Core
- **Workspaces & Pages**: Hierarchical content organization for courses, projects, and research
- **Three page modes**:
  - **Doc** - Collaborative document editing with version control
  - **Canvas** - Interactive whiteboard (Miro-like) with rich elements
  - **Sources** - PDF management with advanced annotations
- **Role-based Access**: Owner/Editor/Viewer permissions for students and faculty

### 👥 Built for the Entire Academic Community
**For Students:**
- Personal and group workspaces
- Study materials organization
- Assignment tracking and submission
- Peer collaboration

**For Faculty & Instructors:**
- Course workspace creation and management
- Material distribution and updates
- Student progress monitoring
- Grading and feedback integration
- Research collaboration spaces

### 🤝 Collaboration Modes
- **Real-time collaborative editing** (Doc and Canvas)
- **Presence** - See who's online across workspaces
- **Comments & annotations** with @mentions
- **Version history** with rollback and audit trails
- **Cross-role collaboration** between students and instructors

### 📄 PDF & Document Intelligence
- PDF upload and secure storage
- Smart annotations (highlights, notes, drawings)
- Full-text search across all uploaded materials
- Extract highlights into organized notes with citations
- OCR support for scanned documents

### 🎨 Canvas (Miro-like Whiteboard)
- Sticky notes, text blocks, shapes, and connectors
- Image embedding and file cards
- Real-time multi-user collaboration
- Canvas → Outline conversion for structured documents
- **Open Canvas API** for programmatic board management and automation
- AFFiNE Blocks integration for extensibility

### 🤖 AI Study Assistant with Academic Context
- **Intelligent Summarization** - Condense complex materials while preserving key concepts
- **Smart Flashcards** - Auto-generate study cards from content
- **Research Assistance** - AI leverages secure agents to access and reference university library resources, providing deeper academic context alongside current page materials
- **Citation Support** - Help with proper referencing and bibliography
- **Context-Aware Help** - Understands course context through integration with university systems
- **Usage Analytics** - Track AI assistance patterns for learning optimization

### 📅 Academic Task & Calendar System
- Assignment tracking with deadlines
- Course schedule integration
- Group project milestone planning
- Automated reminders and notifications
- Sync with university academic calendars

### 🔌 API & Integrations
- **Open REST API** for extending platform capabilities
- **Canvas API** for programmatic board management and automation
- **LMS Integration** - Seamless connectivity with Blackboard, Moodle, and other learning systems
- **Library System Access** - Secure connection to university knowledge bases
- **Single Sign-On (SSO)** - PolyU NetID and enterprise authentication support
- **Export SDK** - Custom export formats and workflow automation

### 📤 Export & Distribution
- Export to PDF, DOCX, and Markdown
- Background job processing for large exports
- Send to Notion, OneNote, and other platforms
- Course pack creation for instructors
- Submission-ready formatting

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

```bash
# Clone the repository
git clone https://github.com/expusercatherine/eywa-platform.git
cd eywa-platform

# Setup (coming soon)
npm run setup

# Development
docker-compose up -d
npm run dev