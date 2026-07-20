# DocuSensei
![Project Banner](./Sahil-09-docusensei.svg)

DocuSensei is a full-stack, Multi-Source Knowledge Assistant (MSKA) designed to process user documents, build a vector-based knowledge base, and provide interactive, real-time AI-powered chat with streaming responses.

The project is structured as an Nx monorepo with a Next.js frontend and a NestJS backend.

---

## Key Features

- **Full-Stack Authentication**: Secured by Clerk with custom JWT claims.
- **Real-Time Streaming Chat**: WebSocket communication using Socket.io for streaming AI responses token-by-token.
- **OCR Document Processing**: Extracts text from uploaded files (PDFs, images, etc.) using the Gemini Vision API.
- **Knowledge Base with RAG**: Embeds processed document chunks and stores them in PostgreSQL using the pgvector extension for similarity search and context-rich AI generation.
- **Custom User Profiles & Settings**: Supports light/dark themes and global user instructions (system prompts) to tailor AI responses.

---

## Tech Stack

### Frontend
- **Framework**: Next.js (App Router) + React
- **Styling**: TailwindCSS + Shadcn/UI
- **Authentication**: Clerk React SDK
- **Real-Time**: Socket.io Client
- **API Fetching**: useApi custom hook (SWR / Fetch)

### Backend
- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL (with pgvector extension)
- **Authentication**: Clerk JWT Verification
- **Real-Time Gateway**: Socket.io Server
- **AI Services**: Google Gemini API & Gemini Vision API
- **Storage**: Local storage (development) or S3-compatible storage (production)

---

## Workspace Architecture

DocuSensei uses an Nx monorepo. The codebase is organized as follows:

```text
apps/
├── frontend/     # Next.js Application
└── backend/      # NestJS API Server
```

The package manager used in this monorepo is **pnpm**.

---

## Getting Started

### Prerequisites

1. Install **Node.js** (v18 or higher recommended).
2. Install **pnpm** globally:
   ```bash
   npm install -g pnpm
   ```
3. Set up a **PostgreSQL** instance with the `pgvector` extension enabled.

### Environment Setup

Create the following environment files in their respective project directories:

#### Frontend (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

#### Backend (`apps/backend/.env`):
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

# Embedding Model
EMBEDDING_MODEL=text-embedding-004
```

---

## Run Commands

Run all command prefixes with `pnpm` to avoid executing global CLIs.

### Development

To start both the frontend and backend in parallel:
```bash
pnpm dev
```

To run individual applications:
```bash
# Start Next.js frontend (default: localhost:4200)
pnpm nx dev frontend

# Start NestJS backend (default: localhost:3000)
pnpm nx serve backend
```

### Production Build

To compile the applications for production:
```bash
pnpm nx build frontend
pnpm nx build backend
```

### Testing & Validation

To run tests:
```bash
# Run Frontend E2E tests
pnpm nx e2e frontend-e2e

# Run Backend E2E tests
pnpm nx e2e backend-e2e
```

---

## API & WebSocket Communication

- **Rest API Prefix**: All NestJS endpoints are prefixed with `/api/v1` (e.g., `http://localhost:3000/api/v1/chats`).
- **WebSocket Handshake**: Socket.io client connects using a Clerk JWT token inside the auth handshake.
- **Real-Time Streaming**: Emits `send_message` from client to server and streams chunks back using `message_chunk` and `message_complete`.
