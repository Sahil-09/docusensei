# Clerk Authentication Implementation

Full-stack Clerk authentication integrated with Next.js frontend and NestJS backend.

## What's Implemented

### Frontend (Next.js)
- ✅ ClerkProvider wrapper in root layout
- ✅ Middleware for route protection
- ✅ Sign-in and sign-up pages with Clerk UI
- ✅ User profile component with UserButton
- ✅ Protected dashboard page
- ✅ API client with automatic JWT token injection

### Backend (NestJS)
- ✅ Auth module with ClerkAuthGuard
- ✅ JWT token verification
- ✅ CurrentUser decorator for accessing authenticated user
- ✅ CORS configuration for frontend communication
- ✅ Protected API route examples

## Environment Variables

### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Backend (`apps/backend/.env`)
```env
CLERK_SECRET_KEY=sk_test_xxxxx
FRONTEND_URL=http://localhost:4200
API_PORT=3000
```

## Usage

### Starting the Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or run individually
pnpm nx dev frontend
pnpm nx serve backend
```

### Frontend Routes

- `/` - Protected dashboard (requires authentication)
- `/sign-in` - Sign-in page
- `/sign-up` - Sign-up page

### Backend API Endpoints

- `GET /api` - Public endpoint
- `GET /api/protected` - Protected endpoint (requires Bearer token)
- `GET /api/profile` - Returns current user profile (requires Bearer token)

### Using the API Client

```typescript
import { useApi } from '@/lib/api-client';

function MyComponent() {
  const api = useApi();

  const fetchData = async () => {
    const data = await api.get('/protected');
    console.log(data);
  };

  return <button onClick={fetchData}>Fetch Protected Data</button>;
}
```

### Protecting Backend Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, CurrentUser } from '../auth';

@Controller('my-route')
export class MyController {
  @Get()
  @UseGuards(ClerkAuthGuard)
  getData(@CurrentUser() user: any) {
    return { user };
  }
}
```

## Next Steps

1. Configure social login providers in Clerk Dashboard
2. Customize sign-in/sign-up pages appearance
3. Add user roles and permissions
4. Set up webhook endpoints for user events
5. Implement refresh token handling

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk NestJS Guide](https://clerk.com/docs/backend-requests/nestjs)
