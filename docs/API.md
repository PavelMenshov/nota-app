# API Documentation

## Overview

The EYWA Platform API is a RESTful API built with NestJS that provides endpoints for managing workspaces, pages, documents, tasks, and more.

## Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.eywa.app/api`

## Interactive Documentation

Visit the Swagger UI for interactive API documentation:
- **Local**: http://localhost:4000/api/docs

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

**Important Note:** Authentication endpoints (`/api/auth/login` and `/api/auth/register`) use POST requests and cannot be tested by typing the URL in a browser's address bar (which sends GET requests). Use the web application at `http://localhost:3001` or the Swagger UI at `http://localhost:4000/api/docs` to test authentication.

**Register a new account:**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Login:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Rate Limiting

- **Global Rate Limit**: 100 requests per minute per IP address
- **Authentication Endpoints**: 5 attempts per 15 minutes
- **AI Endpoints**: Daily limits apply based on user plan

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "email must be a valid email address",
    "password must be at least 8 characters"
  ]
}
```

Common HTTP Status Codes:
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Core Resources

### 1. Workspaces

Workspaces are the top-level organizational unit.

#### List Workspaces

```bash
GET /api/workspaces
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "clx...",
    "name": "My Academic Workspace",
    "description": "Study materials and notes",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Workspace

```bash
POST /api/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My New Workspace",
  "description": "Optional description"
}
```

#### Get Workspace

```bash
GET /api/workspaces/:id
Authorization: Bearer <token>
```

#### Update Workspace

```bash
PATCH /api/workspaces/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Workspace

```bash
DELETE /api/workspaces/:id
Authorization: Bearer <token>
```

### 2. Pages

Pages belong to workspaces and can host multiple surfaces (doc, canvas, PDFs).

#### List Pages in Workspace

```bash
GET /api/workspaces/:workspaceId/pages
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "clx...",
    "workspaceId": "clx...",
    "title": "Study Notes",
    "icon": "📚",
    "parentId": null,
    "order": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Page

```bash
POST /api/pages
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "clx...",
  "title": "New Page",
  "icon": "📄",
  "parentId": null
}
```

#### Get Page

```bash
GET /api/pages/:id
Authorization: Bearer <token>
```

#### Update Page

```bash
PATCH /api/pages/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "icon": "📝"
}
```

#### Delete Page

```bash
DELETE /api/pages/:id
Authorization: Bearer <token>
```

### 3. Documents (Doc Surface)

Document editor content for pages.

#### Get Document Content

```bash
GET /api/doc/:pageId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "clx...",
  "pageId": "clx...",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Hello, world!"
          }
        ]
      }
    ]
  }
}
```

#### Update Document Content

```bash
PUT /api/doc/:pageId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": {
    "type": "doc",
    "content": [...]
  }
}
```

### 4. Tasks

Task management with kanban-style statuses.

#### List Tasks

```bash
GET /api/tasks?workspaceId=clx...&status=TODO
Authorization: Bearer <token>
```

**Query Parameters:**
- `workspaceId` (optional): Filter by workspace
- `status` (optional): TODO, IN_PROGRESS, DONE
- `pageId` (optional): Filter by linked page

**Response:**
```json
[
  {
    "id": "clx...",
    "workspaceId": "clx...",
    "title": "Complete assignment",
    "description": "Finish the math homework",
    "status": "TODO",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "pageId": "clx...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Task

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "clx...",
  "title": "New Task",
  "description": "Task description",
  "status": "TODO",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "pageId": "clx..."
}
```

#### Update Task

```bash
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "DONE"
}
```

#### Delete Task

```bash
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### 5. Calendar Events

Calendar events with optional task linking.

#### List Events

```bash
GET /api/calendar?workspaceId=clx...&start=2024-01-01&end=2024-01-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `workspaceId` (required): Workspace ID
- `start` (optional): Start date (ISO 8601)
- `end` (optional): End date (ISO 8601)

**Response:**
```json
[
  {
    "id": "clx...",
    "workspaceId": "clx...",
    "title": "Study Session",
    "description": "Review chapter 5",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-01-15T12:00:00.000Z",
    "taskId": null
  }
]
```

#### Create Event

```bash
POST /api/calendar
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "clx...",
  "title": "Meeting",
  "startDate": "2024-01-15T10:00:00.000Z",
  "endDate": "2024-01-15T11:00:00.000Z"
}
```

### 6. AI Features

AI-powered study assistance.

#### Generate Summary

```bash
POST /api/ai/summary
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageId": "clx...",
  "content": "Long text to summarize..."
}
```

**Response:**
```json
{
  "summary": "Brief summary of the content...",
  "wordCount": 50
}
```

#### Generate Flashcards

```bash
POST /api/ai/flashcards
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageId": "clx...",
  "content": "Study material content..."
}
```

**Response:**
```json
{
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "It is..."
    }
  ]
}
```

### 7. Export

Export pages to various formats.

#### Create Export Job

```bash
POST /api/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageId": "clx...",
  "format": "PDF"
}
```

**Formats:** PDF, DOCX

**Response:**
```json
{
  "jobId": "clx...",
  "status": "PENDING",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Export Job Status

```bash
GET /api/export/:jobId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "jobId": "clx...",
  "status": "COMPLETED",
  "downloadUrl": "https://...",
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

## WebSocket (Real-time Collaboration)

Connect to the WebSocket gateway for real-time features:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join a page room
socket.emit('join-page', { pageId: 'clx...' });

// Listen for document updates
socket.on('doc-update', (data) => {
  console.log('Document updated:', data);
});

// Send document changes
socket.emit('doc-change', {
  pageId: 'clx...',
  changes: [...]
});
```

**Events:**
- `join-page`: Join a page for real-time updates
- `leave-page`: Leave a page room
- `doc-change`: Send document changes
- `doc-update`: Receive document updates
- `presence`: User presence updates

## Security

### Headers

All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS

CORS is configured to allow requests from the frontend application only:
- Allowed origins: Configured via `CORS_ORIGIN` environment variable
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials: Enabled for cookie-based authentication

### Input Validation

All request bodies are validated using class-validator:
- Whitelist: Unknown properties are stripped
- Transformation: Payloads are transformed to DTO instances
- Forbid non-whitelisted: Throws error if unexpected properties present

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create a workspace
const workspace = await client.post('/workspaces', {
  name: 'My Workspace'
});

// List pages
const pages = await client.get(`/workspaces/${workspace.id}/pages`);
```

### Python

```python
import requests

BASE_URL = 'http://localhost:4000/api'
headers = {'Authorization': f'Bearer {token}'}

# Create a workspace
response = requests.post(
    f'{BASE_URL}/workspaces',
    json={'name': 'My Workspace'},
    headers=headers
)
workspace = response.json()
```

## Pagination

List endpoints support pagination:

```bash
GET /api/pages?page=1&limit=20
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

## Versioning

The API is currently at version 0.1.0. Future versions will be accessible via path:
- Current: `/api/...`
- Future: `/api/v2/...`

## Support

- **Documentation**: http://localhost:4000/api/docs
- **GitHub**: https://github.com/expusercatherine/eywa-platform
- **Email**: support@eywa.app

---

*Last updated: February 2026*
