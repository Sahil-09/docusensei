# System Architecture Specification: Multi-Source Knowledge Assistant (MSKA)

## Overview

An AI-powered chat application that supports:

- User Authentication
- Real-time AI Chat
- Persistent Chat History
- User Profile Management
- User Custom Instructions (Global Prompt)
- OCR-based Document Processing
- Knowledge Base Integration (RAG-ready)
- WebSocket-based Streaming Responses

---

# Tech Stack

## Frontend

- Next.js 15+
- TypeScript
- Clerk Authentication
- TailwindCSS
- Shadcn/UI
- Socket.io Client

## Backend

- NestJS
- TypeScript
- Clerk JWT Verification
- Socket.io Gateway
- Prisma ORM

## Database

- PostgreSQL
- Prisma

## AI Services

- Gemini API
- OCR LLM Model

## Storage

- S3 Compatible Storage
  - AWS S3
  - MinIO
  - Cloudflare R2

---

# High Level Architecture

```text
┌─────────────┐
│   Mobile    │
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Next.js Frontend    │
│                     │
│ Login               │
│ Profile             │
│ Chat                │
└──────┬──────────────┘
       │ REST API
       │
       ▼
┌──────────────────────────┐
│ NestJS API Gateway       │
│ /api/v1                  │
└──────┬───────────────────┘
       │
       ├──────────────► Gemini API
       │
       ├──────────────► OCR Service
       │
       ├──────────────► Knowledge Base
       │
       ├──────────────► PostgreSQL
       │
       └──────────────► S3 Storage

Realtime Communication
Frontend ◄────────Socket.io────────► Backend
```

---

# Functional Requirements

## Authentication

Using Clerk for:

- Sign Up
- Login
- Session Management
- JWT Validation
- User Management

### User Flow

```text
User Login
      │
      ▼
Clerk Authentication
      │
      ▼
Frontend receives session token
      │
      ▼
Send JWT to NestJS
      │
      ▼
NestJS validates token
      │
      ▼
Authorized API access
```

---

# Application Screens

## 1. Login Screen

Features:

- Clerk Sign In
- Clerk Sign Up
- Forgot Password

---

## 2. Profile Screen

Features:

- View Profile
- Update User Settings
- Theme Selection
- Global AI Instructions

Example:

```text
"You are a senior software architect.
Always provide examples in TypeScript."
```

---

## 3. Chat Screen

Features:

- Create New Chat
- View Chat History
- Send Messages
- Stream AI Responses
- Upload Documents
- OCR Processing
- Knowledge Base Search

---

# Backend API Design

Base URL

```http
/api/v1
```

---

## Authentication

### POST /signup

Handled by Clerk.

---

### POST /login

Handled by Clerk.

---

## User

### GET /profile

Returns current user profile.

Response

```json
{
  "id": "usr_123",
  "email": "user@email.com",
  "firstName": "Sahil",
  "lastName": "Patel"
}
```

---

## Settings

### GET /settings

Fetch user settings.

### POST /settings

Update user settings.

Request

```json
{
  "theme": "dark",
  "globalInstruction": "Answer as senior architect."
}
```

---

## Chats

### POST /chat

Create chat or send message.

Request

```json
{
  "chatId": "optional",
  "message": "Explain CAP theorem"
}
```

---

### GET /chat/:id

Fetch complete chat.

---

### GET /chat

Get all chats for current user.

---

### DELETE /chat/:id

Delete chat.

---

# WebSocket Design

## Purpose

Stream AI responses in real time.

---

## Events

### Client → Server

```typescript
send_message
```

Payload

```typescript
{
  chatId: string;
  message: string;
}
```

---

### Server → Client

```typescript
message_chunk
```

Payload

```typescript
{
  chatId: string;
  chunk: string;
}
```

---

### Completion Event

```typescript
message_complete
```

Payload

```typescript
{
  chatId: string;
}
```

---

# OCR Flow

## Upload Flow

```text
User Uploads Image/PDF
        │
        ▼
Upload To S3
        │
        ▼
Backend Receives File URL
        │
        ▼
OCR LLM Processing
        │
        ▼
Extract Text
        │
        ▼
Store Result
        │
        ▼
Available In Chat Context
```

---

# Knowledge Base Flow

## RAG Architecture

```text
Document Upload
      │
      ▼
OCR / Parsing
      │
      ▼
Chunking
      │
      ▼
Embeddings
      │
      ▼
Vector Storage
      │
      ▼
Knowledge Base Search
      │
      ▼
Context Injection
      │
      ▼
Gemini Response
```

---

# Database Schema

## User

```prisma
model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique

  email         String   @unique
  firstName     String?
  lastName      String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  chats         Chat[]
  settings      UserSettings?
}
```

---

## UserSettings

```prisma
model UserSettings {
  id                 String   @id @default(cuid())

  userId             String   @unique
  theme              String   @default("dark")

  globalInstruction  String?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

---

## Chat

```prisma
model Chat {
  id          String   @id @default(cuid())

  userId      String

  title       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User @relation(fields: [userId], references: [id])

  messages    Message[]
  documents   Document[]
}
```

---

## Message

```prisma
model Message {
  id          String   @id @default(cuid())

  chatId      String

  role        MessageRole

  content     String   @db.Text

  createdAt   DateTime @default(now())

  chat        Chat @relation(fields: [chatId], references: [id])
}
```

---

## Document

```prisma
model Document {
  id              String   @id @default(cuid())

  chatId          String?

  userId          String

  fileName        String
  fileUrl         String

  extractedText   String? @db.Text

  createdAt       DateTime @default(now())

  chat            Chat? @relation(fields: [chatId], references: [id])
}
```

---

## Enums

```prisma
enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

---

# Recommended NestJS Modules

```text
src/

├── auth/
├── users/
├── settings/
├── chats/
├── messages/
├── documents/
├── storage/
├── ai/
├── ocr/
├── knowledge-base/
├── websocket/
├── prisma/
├── common/
└── config/
```

---

# AI Service Flow

```text
User Message
      │
      ▼
Load User Settings
      │
      ▼
Load Chat History
      │
      ▼
Load KB Context
      │
      ▼
Construct Prompt
      │
      ▼
Gemini API
      │
      ▼
Stream Tokens
      │
      ▼
WebSocket
      │
      ▼
Frontend
```

---

# Future Enhancements

## Phase 2

- Multi Model Support
  - Gemini
  - OpenAI
  - Claude

- Chat Search

- Folder Organization

- Shared Chats

- Team Workspaces

- Voice Chat

- Speech To Text

- Image Generation

- Agent Workflows

- MCP Integrations

- Tool Calling

---

# MVP Deliverables

### Authentication

- Clerk Login
- Clerk Signup
- Protected Routes

### User Management

- Profile
- Settings

### Chat

- Chat Creation
- Message Streaming
- Chat History

### OCR

- File Upload
- OCR Extraction

### Knowledge Base

- Document Upload
- Context Retrieval

### Infrastructure

- PostgreSQL
- Prisma
- S3 Storage
- Gemini Integration
- Socket.io
