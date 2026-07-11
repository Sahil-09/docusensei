# Implementation Plan: Multi-Source Knowledge Assistant (MSKA)

**Project**: DocuSensei - AI-powered chat application with knowledge base  
**Version**: 1.0.0  
**Created**: 2026-07-09  
**Status**: Ready for Implementation

---

## Executive Summary

Build a full-stack AI chat application with:
- User authentication (Clerk)
- Real-time AI chat with streaming responses (Gemini)
- Document processing with OCR
- Knowledge base with RAG (Retrieval-Augmented Generation)
- Persistent chat history
- WebSocket-based real-time communication

**Timeline**: 10 weeks  
**Team Size**: 1-2 developers  
**MVP Target**: Full feature set (Phases 1-5)

---

## Architecture Decisions

### Technology Stack

#### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + TailwindCSS + Shadcn/UI
- **Authentication**: Clerk
- **Real-time**: Socket.io Client
- **State Management**: React Context + SWR

#### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **Authentication**: Clerk JWT verification
- **Real-time**: Socket.io Gateway
- **AI**: Google Gemini API
- **Storage**: Local filesystem → MinIO (production)

#### Infrastructure
- **Database**: PostgreSQL (local development)
- **Storage**: Local filesystem (dev) → MinIO (prod)
- **Vector DB**: pgvector extension (same PostgreSQL instance)
- **AI Provider**: Google Gemini
- **OCR**: Gemini Vision API

#### Key Integrations
- **Clerk**: Authentication, user management, JWT tokens
- **Gemini API**: AI chat, streaming responses, OCR
- **pgvector**: Vector similarity search for RAG

---

## Database Schema

### Entity Relationship Diagram

```
User (1) ←→ (1) UserSettings
User (1) ←→ (N) Chat
Chat (1) ←→ (N) Message
Chat (1) ←→ (N) Document
Document (1) ←→ (N) DocumentChunk
```

### Prisma Schema

```prisma
// ============================================
// User & Authentication
// ============================================

model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique
  
  email         String   @unique
  firstName     String?
  lastName      String?
  avatarUrl     String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  settings      UserSettings?
  chats         Chat[]
  documents     Document[]
  
  @@map("users")
}

model UserSettings {
  id                 String   @id @default(cuid())
  
  userId             String   @unique
  theme              String   @default("dark")
  globalInstruction  String?  @db.Text
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_settings")
}

// ============================================
// Chat & Messages
// ============================================

model Chat {
  id          String   @id @default(cuid())
  
  userId      String
  
  title       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    Message[]
  documents   Document[]
  
  @@index([userId, createdAt])
  @@map("chats")
}

model Message {
  id          String        @id @default(cuid())
  
  chatId      String
  
  role        MessageRole
  
  content     String        @db.Text
  
  tokenCount  Int?
  
  createdAt   DateTime      @default(now())
  
  chat        Chat          @relation(fields: [chatId], references: [id], onDelete: Cascade)
  
  @@index([chatId, createdAt])
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ============================================
// Documents & Knowledge Base
// ============================================

model Document {
  id                String                      @id @default(cuid())
  
  chatId            String
  userId            String
  
  fileName          String
  fileUrl           String
  fileSize          Int?
  mimeType          String?
  
  extractedText     String?                     @db.Text
  
  processingStatus  DocumentProcessingStatus    @default(PENDING)
  
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  
  chat              Chat                        @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user              User                        @relation(fields: [userId], references: [id])
  chunks            DocumentChunk[]
  
  @@index([userId])
  @@index([chatId])
  @@map("documents")
}

model DocumentChunk {
  id          String    @id @default(cuid())
  
  documentId  String
  
  content     String    @db.Text
  
  embedding   Unsupported("vector")?
  
  metadata    Json?
  
  createdAt   DateTime  @default(now())
  
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@map("document_chunks")
}

enum DocumentProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## API Contracts

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.docusensei.com/api/v1
```

### Authentication Header
```http
Authorization: Bearer <clerk_jwt_token>
```

---

### User Endpoints

#### GET /users/profile
Returns current user profile.

**Response**:
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "firstName": "Sahil",
  "lastName": "Patel",
  "avatarUrl": "https://..."
}
```

#### PATCH /users/profile
Update user profile.

**Request**:
```json
{
  "firstName": "Sahil",
  "lastName": "Patel",
  "avatarUrl": "https://..."
}
```

**Response**: Updated user object

---

### Settings Endpoints

#### GET /settings
Fetch user settings.

**Response**:
```json
{
  "id": "set_123",
  "userId": "usr_123",
  "theme": "dark",
  "globalInstruction": "You are a senior software architect..."
}
```

#### PATCH /settings
Update user settings.

**Request**:
```json
{
  "theme": "light",
  "globalInstruction": "Answer concisely with code examples."
}
```

**Response**: Updated settings object

---

### Chat Endpoints

#### POST /chats
Create a new chat.

**Request**:
```json
{
  "title": "Optional title"
}
```

**Response**:
```json
{
  "id": "chat_123",
  "userId": "usr_123",
  "title": "New Chat",
  "createdAt": "2026-07-09T10:00:00Z",
  "updatedAt": "2026-07-09T10:00:00Z"
}
```

#### GET /chats
List all chats for current user (paginated).

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "chat_123",
      "title": "My Chat",
      "createdAt": "2026-07-09T10:00:00Z",
      "updatedAt": "2026-07-09T10:15:00Z",
      "_count": {
        "messages": 10
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "hasNextPage": true
  }
}
```

#### GET /chats/:id
Get specific chat with messages.

**Query Parameters**:
- `messagesLimit` (default: 50)

**Response**:
```json
{
  "id": "chat_123",
  "title": "My Chat",
  "createdAt": "2026-07-09T10:00:00Z",
  "updatedAt": "2026-07-09T10:15:00Z",
  "messages": [
    {
      "id": "msg_123",
      "role": "USER",
      "content": "Explain CAP theorem",
      "createdAt": "2026-07-09T10:00:00Z"
    },
    {
      "id": "msg_456",
      "role": "ASSISTANT",
      "content": "CAP theorem states...",
      "createdAt": "2026-07-09T10:00:05Z"
    }
  ]
}
```

#### PATCH /chats/:id
Update chat (e.g., title).

**Request**:
```json
{
  "title": "Updated Title"
}
```

**Response**: Updated chat object

#### DELETE /chats/:id
Delete chat and all associated messages and documents.

**Response**: 204 No Content

---

### Message Endpoints

#### POST /messages
Send a message to a chat.

**Request**:
```json
{
  "chatId": "chat_123",
  "content": "Explain CAP theorem",
  "documentIds": ["doc_123"] // Optional
}
```

**Response**:
```json
{
  "id": "msg_123",
  "chatId": "chat_123",
  "role": "USER",
  "content": "Explain CAP theorem",
  "createdAt": "2026-07-09T10:00:00Z"
}
```

**Note**: AI response is streamed via WebSocket

---

### Document Endpoints

#### POST /documents
Upload a document.

**Request**: `multipart/form-data`
```
file: <binary>
chatId: chat_123
```

**Response**:
```json
{
  "id": "doc_123",
  "chatId": "chat_123",
  "fileName": "document.pdf",
  "fileUrl": "/uploads/doc_123.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "processingStatus": "PENDING",
  "createdAt": "2026-07-09T10:00:00Z"
}
```

#### GET /documents/:id
Get document details.

**Response**: Document object with extracted text

#### DELETE /documents/:id
Delete document.

**Response**: 204 No Content

---

## WebSocket Design

### Connection

**URL**: `ws://localhost:3000`

**Authentication**:
```typescript
// Client connection with JWT
const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <clerk_jwt_token>'
  }
});
```

---

### Events

#### Client → Server

**`send_message`**
```typescript
{
  chatId: string;
  content: string;
  documentIds?: string[];
}
```

**`typing_start`**
```typescript
{
  chatId: string;
}
```

**`typing_stop`**
```typescript
{
  chatId: string;
}
```

---

#### Server → Client

**`message_start`**
```typescript
{
  chatId: string;
  messageId: string;
  timestamp: string;
}
```

**`message_chunk`**
```typescript
{
  chatId: string;
  messageId: string;
  chunk: string;
  isLastChunk: boolean;
}
```

**`message_complete`**
```typescript
{
  chatId: string;
  messageId: string;
  tokenCount: number;
  timestamp: string;
}
```

**`message_error`**
```typescript
{
  chatId: string;
  error: string;
  errorCode: string;
  retryable: boolean;
}
```

**`document_processed`**
```typescript
{
  documentId: string;
  status: 'COMPLETED' | 'FAILED';
  extractedTextLength?: number;
}
```

---

### Error Codes

- `CHAT_NOT_FOUND`: Chat does not exist
- `UNAUTHORIZED`: User does not own this chat
- `RATE_LIMIT_EXCEEDED`: Too many messages
- `AI_ERROR`: Gemini API error
- `DOCUMENT_PROCESSING_ERROR`: OCR failed

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### 1.1 PostgreSQL + Prisma Setup
- [X] Install PostgreSQL locally
- [x] Install Prisma dependencies
  ```bash
  cd apps/backend
  pnpm add prisma @prisma/client
  pnpm add -D prisma
  ```
- [x] Initialize Prisma
  ```bash
  npx prisma init
  ```
- [x] Configure `.env` with `DATABASE_URL`
- [x] Create complete Prisma schema
- [ ] Generate Prisma client
  ```bash
  npx prisma generate
  ```
- [ ] Create initial migration
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Create Prisma module for NestJS
- [ ] Test database connection

#### 1.2 API Versioning
- [ ] Update `main.ts` to use `/api/v1`
- [ ] Update frontend API client base URL
- [ ] Update CORS configuration
- [ ] Update environment variables

#### 1.3 User Module
- [ ] Create `apps/backend/src/users/` module structure
- [ ] Create User entity
- [ ] Create DTOs (CreateUserDto, UpdateUserDto)
- [ ] Implement UsersService with Prisma
- [ ] Implement UsersController
  - `GET /users/profile`
  - `PATCH /users/profile`
- [ ] Sync user from Clerk to database on first login
- [ ] Add user creation/update logic in auth flow
- [ ] Test user endpoints

#### 1.4 Settings Module
- [ ] Create `apps/backend/src/settings/` module structure
- [ ] Create Settings entity
- [ ] Create DTOs (UpdateSettingsDto)
- [ ] Implement SettingsService with Prisma
- [ ] Implement SettingsController
  - `GET /settings`
  - `PATCH /settings`
- [ ] Auto-create default settings for new users
- [ ] Test settings endpoints

---

### Phase 2: Core Chat Features (Week 3-4)

#### 2.1 Chat Module
- [ ] Create `apps/backend/src/chats/` module structure
- [ ] Create Chat entity
- [ ] Create DTOs (CreateChatDto, UpdateChatDto)
- [ ] Implement ChatsService with Prisma
  - Create chat
  - List chats (with pagination)
  - Get chat by ID (with messages)
  - Update chat
  - Delete chat
- [ ] Implement ChatsController
  - `POST /chats`
  - `GET /chats`
  - `GET /chats/:id`
  - `PATCH /chats/:id`
  - `DELETE /chats/:id`
- [ ] Implement access control (users can only access their chats)
- [ ] Auto-generate chat title from first message
- [ ] Test chat endpoints

#### 2.2 Message Module
- [ ] Create `apps/backend/src/messages/` module structure
- [ ] Create Message entity
- [ ] Create DTOs (CreateMessageDto)
- [ ] Implement MessagesService with Prisma
  - Create message
  - List messages by chat (with pagination)
- [ ] Implement MessagesController
  - `POST /messages`
- [ ] Test message endpoints

#### 2.3 WebSocket Integration
- [ ] Install Socket.io dependencies
  ```bash
  pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
  pnpm add -D @types/socket.io
  ```
- [ ] Create `apps/backend/src/websocket/` module structure
- [ ] Implement WebSocket authentication guard
  - Extract JWT from handshake
  - Validate Clerk JWT
  - Attach user to socket
- [ ] Implement ChatGateway
  - Handle connection/disconnection
  - `send_message` event handler
  - `typing_start` / `typing_stop` events
- [ ] Implement message broadcasting
- [ ] Test WebSocket connection and events

#### 2.4 Gemini AI Integration
- [ ] Install Gemini SDK
  ```bash
  pnpm add @google/generative-ai
  ```
- [ ] Create `apps/backend/src/ai/` module structure
- [ ] Configure Gemini API key
- [ ] Implement AiService
  - Initialize Gemini client
  - Build system prompt from user settings
  - Format chat history for context
  - Stream response generation
  - Handle rate limits and errors
- [ ] Test Gemini integration

#### 2.5 Streaming Response Flow
- [ ] Update ChatGateway to integrate AI service
- [ ] Implement streaming flow:
  1. Validate user owns chat
  2. Save user message to database
  3. Load chat history and user settings
  4. Emit `message_start` event
  5. Stream AI response chunks
  6. Emit `message_chunk` events
  7. Save complete AI message
  8. Emit `message_complete` event
- [ ] Implement error handling
  - Emit `message_error` on failure
  - Distinguish retryable vs non-retryable errors
- [ ] Test end-to-end streaming flow

---

### Phase 3: Document Processing (Week 5-6)

#### 3.1 Storage Module
- [ ] Create `apps/backend/src/storage/` module structure
- [ ] Define StorageService interface
  ```typescript
  interface StorageService {
    upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
    download(fileUrl: string): Promise<Buffer>;
    delete(fileUrl: string): Promise<void>;
  }
  ```
- [ ] Implement LocalStorageService (development)
  - Store in `./uploads/` directory
  - Generate unique filenames
  - Serve static files
- [ ] Implement MinIOStorageService (production)
  - Configure MinIO client
  - Bucket management
  - Upload/download/delete operations
- [ ] Create StorageModule with environment-based provider selection
- [ ] Configure static file serving in NestJS
- [ ] Test storage operations

#### 3.2 Document Module
- [ ] Create `apps/backend/src/documents/` module structure
- [ ] Create Document entity
- [ ] Create DTOs (UploadDocumentDto)
- [ ] Implement DocumentsService with Prisma
  - Create document record
  - Upload file to storage
  - Get document by ID
  - Delete document
- [ ] Implement DocumentsController
  - `POST /documents` (multipart/form-data)
  - `GET /documents/:id`
  - `DELETE /documents/:id`
- [ ] Implement file validation
  - Max file size (10MB)
  - Allowed MIME types (PDF, images, text)
- [ ] Test document upload flow

#### 3.3 OCR Service
- [ ] Create `apps/backend/src/ocr/` module structure
- [ ] Implement OcrService using Gemini Vision
  - Download file from storage
  - Send to Gemini Vision API
  - Extract text from response
  - Handle errors
- [ ] Integrate with document upload flow
  - Update document processing status
  - Store extracted text
- [ ] Implement background processing (optional)
  - Use BullMQ for queue
  - Process documents asynchronously
- [ ] Test OCR extraction

#### 3.4 Document-Chat Integration
- [ ] Update CreateMessageDto to accept `documentIds`
- [ ] Update ChatGateway to handle documents
  - Load document content
  - Include extracted text in AI prompt
- [ ] Update frontend to support document attachment
- [ ] Test document integration with chat

---

### Phase 4: Knowledge Base (Week 7-8)

#### 4.1 Vector Database Setup
- [ ] Install pgvector extension in PostgreSQL
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- [ ] Update Prisma schema with DocumentChunk model
- [ ] Configure pgvector type in Prisma
- [ ] Create database migration
- [ ] Test vector operations

#### 4.2 Document Chunking
- [ ] Create `apps/backend/src/knowledge-base/` module structure
- [ ] Implement ChunkingService
  - Sentence-based chunking
  - Paragraph-based chunking
  - Fixed-size chunking with overlap
- [ ] Test chunking strategies
- [ ] Integrate with document processing
  - Chunk extracted text
  - Store chunks in database

#### 4.3 Embedding Generation
- [ ] Choose embedding model (Gemini text-embedding-004)
- [ ] Implement EmbeddingService
  - Generate embeddings for text chunks
  - Batch processing for efficiency
  - Store embeddings in vector column
- [ ] Integrate with chunking service
- [ ] Test embedding generation

#### 4.4 RAG Implementation
- [ ] Implement KnowledgeBaseService
  - Vector similarity search
  - Hybrid search (optional)
  - Relevance ranking
- [ ] Update AiService to include KB context
  - Search knowledge base for query
  - Add relevant chunks to prompt
  - Balance context window
- [ ] Implement caching for embeddings (optional)
- [ ] Test knowledge base retrieval
- [ ] Evaluate response quality

---

### Phase 5: Polish & Scale (Week 9-10)

#### 5.1 Error Handling & Logging
- [ ] Install logging library
  ```bash
  pnpm add winston nest-winston
  ```
- [ ] Implement global exception filter
- [ ] Configure structured logging
  - Request/response logging
  - Error logging with stack traces
  - Performance metrics
- [ ] Implement user-friendly error messages
- [ ] Add error tracking (Sentry)
- [ ] Test error scenarios

#### 5.2 Rate Limiting
- [ ] Install throttler module
  ```bash
  pnpm add @nestjs/throttler
  ```
- [ ] Configure rate limits
  - Messages: 100/hour/user
  - Documents: 10/day/user
  - Storage: 1GB/user
- [ ] Implement UsageQuota tracking
- [ ] Implement quota exceeded notifications
- [ ] Test rate limiting

#### 5.3 Monitoring & Metrics
- [ ] Implement health check endpoints
  - `GET /health`
  - `GET /health/ready`
  - `GET /health/live`
- [ ] Collect metrics
  - Response times
  - Error rates
  - Token usage
  - Storage usage
- [ ] Set up monitoring dashboard (optional)
- [ ] Configure alerts (optional)

#### 5.4 Performance Optimization
- [ ] Add database indexes
- [ ] Implement caching strategy
  - Cache user settings
  - Cache recent chats
  - Use Redis (optional)
- [ ] Optimize queries
- [ ] Implement connection pooling
- [ ] Load testing
- [ ] Performance profiling

#### 5.5 Security Hardening
- [ ] Install validation dependencies
  ```bash
  pnpm add class-validator class-transformer
  ```
- [ ] Implement input validation on all endpoints
- [ ] Install security middleware
  ```bash
  pnpm add helmet
  ```
- [ ] Configure security headers
- [ ] Implement CORS policy
- [ ] Add file upload security
  - Virus scanning (ClamAV)
  - File type validation
  - Size limits
- [ ] Security audit
- [ ] Penetration testing (optional)

---

## File Structure

### Backend Structure

```
apps/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── clerk-auth.guard.ts
│   │   ├── current-user.decorator.ts
│   │   └── index.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── settings/
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   ├── dto/
│   │   │   └── update-settings.dto.ts
│   │   └── entities/
│   │       └── settings.entity.ts
│   │
│   ├── chats/
│   │   ├── chats.module.ts
│   │   ├── chats.controller.ts
│   │   ├── chats.service.ts
│   │   ├── dto/
│   │   │   ├── create-chat.dto.ts
│   │   │   └── update-chat.dto.ts
│   │   └── entities/
│   │       └── chat.entity.ts
│   │
│   ├── messages/
│   │   ├── messages.module.ts
│   │   ├── messages.controller.ts
│   │   ├── messages.service.ts
│   │   ├── dto/
│   │   │   └── create-message.dto.ts
│   │   └── entities/
│   │       └── message.entity.ts
│   │
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── dto/
│   │   │   └── upload-document.dto.ts
│   │   └── entities/
│   │       └── document.entity.ts
│   │
│   ├── storage/
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts
│   │   ├── local-storage.service.ts
│   │   ├── minio-storage.service.ts
│   │   └── index.ts
│   │
│   ├── ocr/
│   │   ├── ocr.module.ts
│   │   └── ocr.service.ts
│   │
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   └── gemini.config.ts
│   │
│   ├── knowledge-base/
│   │   ├── knowledge-base.module.ts
│   │   ├── chunking.service.ts
│   │   ├── embedding.service.ts
│   │   ├── search.service.ts
│   │   └── dto/
│   │       └── search.dto.ts
│   │
│   ├── websocket/
│   │   ├── websocket.module.ts
│   │   ├── chat.gateway.ts
│   │   ├── websocket-auth.guard.ts
│   │   └── events/
│   │       ├── send-message.event.ts
│   │       └── message-chunk.event.ts
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── interfaces/
│   │       └── response.interface.ts
│   │
│   └── config/
│       ├── app.config.ts
│       ├── database.config.ts
│       ├── storage.config.ts
│       └── index.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── uploads/                    # Local storage directory
│
├── .env                        # Environment variables
├── .env.example                # Example env file
├── docker-compose.yml          # PostgreSQL + MinIO (optional)
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── webpack.config.js
```

---

### Frontend Structure

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with ClerkProvider
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css
│   │   │
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── chat/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Individual chat page
│   │   │
│   │   └── profile/
│   │       └── page.tsx        # User profile page
│   │
│   ├── components/
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── chat/
│   │   │   ├── chat-list.tsx
│   │   │   ├── chat-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   └── streaming-message.tsx
│   │   ├── documents/
│   │   │   ├── document-upload.tsx
│   │   │   └── document-list.tsx
│   │   ├── profile/
│   │   │   └── user-profile.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       └── sidebar.tsx
│   │
│   ├── lib/
│   │   ├── api-client.ts       # REST API client
│   │   ├── socket-client.ts    # WebSocket client
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-chat.ts
│   │   ├── use-websocket.ts
│   │   └── use-documents.ts
│   │
│   ├── types/
│   │   ├── globals.d.ts        # TypeScript custom claims
│   │   ├── chat.ts
│   │   ├── message.ts
│   │   └── document.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   └── favicon.ico
│
├── .env.local
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

---

## Environment Configuration

### Backend `.env`

```env
# Application
NODE_ENV=development
API_PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/docusensei?schema=public"

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxx
FRONTEND_URL=http://localhost:4200

# Gemini AI
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-pro
GEMINI_VISION_MODEL=gemini-pro-vision

# Storage
STORAGE_TYPE=local
# STORAGE_TYPE=minio

# MinIO (production)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=docusensei
MINIO_USE_SSL=false

# Embedding Model
EMBEDDING_MODEL=text-embedding-004

# Rate Limiting
RATE_LIMIT_MESSAGES_PER_HOUR=100
RATE_LIMIT_DOCUMENTS_PER_DAY=10
MAX_STORAGE_BYTES=1073741824

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Frontend `.env.local`

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## Success Criteria

### MVP Completion Checklist

#### Authentication
- [x] Clerk authentication integrated
- [x] Frontend login/signup pages
- [x] Backend JWT validation
- [x] Protected routes
- [ ] User sync to database

#### User Management
- [ ] Profile viewing
- [ ] Profile updating
- [ ] Settings management
- [ ] Global instructions

#### Chat
- [ ] Chat creation
- [ ] Chat listing
- [ ] Chat deletion
- [ ] Message sending
- [ ] Message streaming
- [ ] Chat history persistence
- [ ] Pagination

#### Documents
- [ ] File upload
- [ ] File storage
- [ ] OCR processing
- [ ] Text extraction
- [ ] Document deletion

#### Knowledge Base
- [ ] Document chunking
- [ ] Embedding generation
- [ ] Vector storage
- [ ] Similarity search
- [ ] Context retrieval
- [ ] RAG integration

#### Infrastructure
- [ ] PostgreSQL setup
- [ ] Prisma migrations
- [ ] WebSocket connection
- [ ] Gemini integration
- [ ] Storage service
- [ ] Error handling
- [ ] Rate limiting
- [ ] Monitoring

---

## Testing Strategy

### Unit Tests
- Services: Business logic testing
- Controllers: Request/response testing
- Guards: Authentication/authorization testing
- Utilities: Helper function testing

### Integration Tests
- API endpoints: Full request cycle
- Database operations: Prisma queries
- WebSocket events: Real-time communication
- AI integration: Gemini API mocking

### E2E Tests
- User authentication flow
- Chat creation and messaging
- Document upload and processing
- Knowledge base retrieval

### Performance Tests
- Concurrent connections
- Message streaming under load
- Database query performance
- File upload performance

---

## Deployment Strategy

### Development Environment
- PostgreSQL: Local installation
- Storage: Local filesystem
- Environment: `.env` files

### Staging Environment
- PostgreSQL: Managed instance (Supabase/Railway)
- Storage: MinIO instance
- Environment: Environment variables

### Production Environment
- PostgreSQL: Managed instance with backups
- Storage: MinIO or S3-compatible service
- Monitoring: Prometheus + Grafana
- Logs: Centralized logging (ELK/Loki)
- CDN: Static assets via CDN

---

## Risk Mitigation

### Technical Risks

1. **Gemini API Rate Limits**
   - Risk: Exceeding API quotas
   - Mitigation: Implement request queuing, caching, and user quotas

2. **WebSocket Scalability**
   - Risk: Connection limits with single server
   - Mitigation: Use Redis adapter for multi-instance support

3. **Vector Search Performance**
   - Risk: Slow similarity search with large datasets
   - Mitigation: Indexing, caching, and query optimization

4. **Storage Costs**
   - Risk: High storage costs with document uploads
   - Mitigation: File size limits, compression, and cleanup policies

5. **Database Performance**
   - Risk: Slow queries with growing data
   - Mitigation: Indexing, connection pooling, and query optimization

---

## Future Enhancements (Post-MVP)

### Phase 6: Advanced Features
- Multi-model support (OpenAI, Claude, Gemini)
- Chat search functionality
- Folder organization for chats
- Shared chats with other users
- Team workspaces
- Voice chat
- Speech to text
- Image generation
- Agent workflows
- MCP integrations
- Tool calling

### Phase 7: Enterprise Features
- SSO integration
- Team management
- Audit logs
- Advanced analytics
- Custom branding
- API access
- Webhook integrations

---

## References

- [Clerk Documentation](https://clerk.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Socket.io Documentation](https://socket.io/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

## Change Log

| Version | Date       | Changes                   | Author |
|---------|------------|---------------------------|--------|
| 1.0.0   | 2026-07-09 | Initial plan creation     | AI     |

---

**Document Status**: Ready for Implementation  
**Next Review**: After Phase 1 completion
