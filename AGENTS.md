# DocuSensei - AI Agent Guidelines

## Workspace Architecture

**Nx monorepo** with 2 main applications:
- `apps/frontend` - Next.js 16.1.6 (App Router) + React 19
- `apps/backend` - NestJS API server

**Package manager**: `pnpm` (prefix all nx commands with `pnpm`)

## Critical Commands

```bash
# Start both frontend and backend in parallel
pnpm dev

# Run individual apps
pnpm nx dev frontend      # Next.js dev server (default: localhost:4200)
pnpm nx serve backend     # NestJS API (default: localhost:3000)

# Build
pnpm nx build frontend
pnpm nx build backend

# E2E tests
pnpm nx e2e frontend-e2e
pnpm nx e2e backend-e2e
```

## Environment Setup (Required)

Both apps require environment variables before running:

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Backend** (`apps/backend/.env`):
```env
CLERK_SECRET_KEY=sk_test_xxxxx
FRONTEND_URL=http://localhost:4200  # Must match frontend dev server
API_PORT=3000
```

## Authentication Architecture

**Clerk full-stack authentication** with custom JWT claims:

### Frontend
- `ClerkProvider` wraps app in `apps/frontend/src/app/layout.tsx`
- Middleware at `apps/frontend/src/middleware.ts` protects all routes except `/sign-in`, `/sign-up`
- Use `useApi()` hook from `apps/frontend/src/lib/api-client.ts` for authenticated API calls - automatically injects JWT token
- Custom claims available in `sessionClaims` from `useAuth()` hook

### Backend
- Auth module at `apps/backend/src/auth/`
- `ClerkAuthGuard` validates JWT tokens from Authorization header
- `CurrentUser()` decorator extracts user from request in protected routes
- Usage:
  ```typescript
  @UseGuards(ClerkAuthGuard)
  getData(@CurrentUser() user: any) { ... }
  ```

### Custom JWT Claims
Configured in Clerk Dashboard → Sessions → Customize session token:
```json
{
  "user_id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "first_name": "{{user.first_name}}",
  "last_name": "{{user.last_name}}",
  "full_name": "{{user.full_name}}",
  "avatar_url": "{{user.image_url}}"
}
```

## Common Pitfalls

### CORS Configuration
Backend CORS **must match frontend dev server URL**:
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,  // Required for auth cookies
});
```

If you see CORS errors, check:
1. `FRONTEND_URL` env var matches actual frontend URL
2. `credentials: true` is set (required for Clerk session cookies)
3. No duplicate `enableCors()` calls (will override previous config)

### JWT Token Not Refreshing
After adding custom claims in Clerk Dashboard:
1. **Sign out and sign back in** to get new token with updated claims
2. Or clear browser cookies/localStorage
3. JWTs are cached - `getToken()` won't automatically fetch new claims

### TypeScript Custom Claims
Add global type for autocomplete:
```typescript
// apps/frontend/types/globals.d.ts
declare global {
  interface CustomJwtSessionClaims {
    user_id?: string
    email?: string
    // ... other custom claims
  }
}
```

## Code Conventions

**Prettier**: `{ "singleQuote": true }`

**TypeScript**: Strict mode enabled, decorators require `experimentalDecorators: true`

**Frontend**: App Router (not Pages Router), use `'use client'` directive for client components

**Backend**: NestJS with dependency injection, all routes under `/api` prefix

## API Client Usage

```typescript
import { useApi } from '@/lib/api-client';

const api = useApi();
await api.get('/protected');        // GET
await api.post('/items', data);     // POST
await api.put('/items/1', data);    // PUT
await api.delete('/items/1');       // DELETE
```

All methods automatically:
- Include `Authorization: Bearer <token>` header
- Fetch fresh JWT from Clerk
- Set `Content-Type: application/json`

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
