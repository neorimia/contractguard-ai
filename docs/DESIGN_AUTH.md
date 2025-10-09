# Authentication System Design - ContractGuard AI

## Overview

This document outlines the authentication system design for ContractGuard AI using Neon Auth (Stack Auth) integrated with the existing application architecture.

**Design Date**: 2025-10-06
**Status**: Design Complete - Ready for Implementation

---

## Architecture Decision

### Hybrid Authentication + Authorization Model

**Stack Auth (Neon Auth)**: Handles authentication (identity verification)
- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management
- User data in `neon_auth.users_sync` table (auto-managed)

**ContractGuard App**: Handles authorization (access control) and billing
- User tier management (free, pro, enterprise)
- Rate limiting and scan quotas
- Stripe billing integration
- User data in `public.users` table (app-managed)

### Why This Approach?

1. **Separation of Concerns**: Auth provider handles security-critical authentication logic
2. **Flexibility**: Can swap auth providers without changing business logic
3. **Speed to Market**: Stack Auth provides pre-built UI and OAuth in hours, not weeks
4. **Cost Efficiency**: No need to build/maintain auth infrastructure
5. **Security**: Leverage Neon's security expertise and compliance

---

## System Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stack Auth (Neon Auth)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Authentication Methods:                                  │  │
│  │  • Email/Password Signup & Login                         │  │
│  │  • Google OAuth                                          │  │
│  │  • GitHub OAuth                                          │  │
│  │  • Session Management                                    │  │
│  │  • Password Reset                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  neon_auth.users_sync (Auto-Managed)                     │  │
│  │  • stack_user_id (PK)                                    │  │
│  │  • email                                                 │  │
│  │  • email_verified                                        │  │
│  │  • created_at                                            │  │
│  │  • last_sign_in_at                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ User Authenticated
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              ContractGuard User Sync Service                     │
│  (Triggered on first login or via webhook)                      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ Create/Update App User
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│            public.users (App-Managed Business Logic)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • id (PK, serial)                                       │  │
│  │  • stack_user_id (FK to Stack Auth, unique)             │  │
│  │  • email (unique, indexed)                              │  │
│  │  • tier (free|pro|enterprise)                           │  │
│  │  • scans_today (rate limiting)                          │  │
│  │  • scans_reset_at (daily reset)                         │  │
│  │  • stripe_customer_id (billing)                         │  │
│  │  • created_at, updated_at                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ Authorization Checks
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Protected API Routes                          │
│  • Check Stack Auth session (authentication)                    │
│  • Load user from public.users (authorization)                  │
│  • Enforce tier limits and rate limits                          │
│  • Execute business logic                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### Modified `public.users` Table

```typescript
// db/schema.ts - UPDATED
export const users = pgTable('users', {
    id: serial('id').primaryKey(),

    // Stack Auth Integration
    stackUserId: text('stack_user_id').notNull().unique(), // Stack Auth user ID
    email: text('email').notNull().unique(),

    // Profile (optional, can be pulled from Stack Auth)
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),

    // ContractGuard Business Logic
    tier: text('tier').notNull().default('free'), // free, pro, enterprise
    scansToday: integer('scans_today').default(0),
    scansResetAt: timestamp('scans_reset_at').defaultNow(),

    // Billing Integration
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    subscriptionStatus: text('subscription_status'), // active, cancelled, past_due

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Indexes for Performance

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_stack_user_id ON public.users(stack_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
```

### No Changes to Other Tables

- `audits` table remains unchanged
- `api_keys` table remains unchanged (still references `users.id`)

---

## Service Layer Design

### New: `AuthService` (`lib/services/auth.service.ts`)

```typescript
/**
 * AuthService - Handles integration between Stack Auth and ContractGuard
 */
export class AuthService {
    /**
     * Sync Stack Auth user to ContractGuard users table
     * Called on first login or via webhook
     */
    async syncUser(stackUserId: string, email: string, profile?: {
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    }): Promise<User>;

    /**
     * Get user by Stack Auth ID
     */
    async getUserByStackId(stackUserId: string): Promise<User | null>;

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null>;

    /**
     * Update user last login timestamp
     */
    async updateLastLogin(userId: number): Promise<void>;

    /**
     * Check if user has reached scan limit for their tier
     */
    async checkScanLimit(userId: number): Promise<{
        allowed: boolean;
        scansRemaining: number;
        resetAt: Date;
    }>;

    /**
     * Increment scan count for user
     */
    async incrementScanCount(userId: number): Promise<void>;

    /**
     * Reset daily scan count (called by cron job)
     */
    async resetDailyScanCounts(): Promise<void>;
}
```

### Usage Pattern

```typescript
const authService = new AuthService();

// On user login (from Stack Auth callback)
const stackUser = await getStackAuthUser(); // Stack Auth SDK
const appUser = await authService.syncUser(
    stackUser.id,
    stackUser.email,
    {
        firstName: stackUser.firstName,
        lastName: stackUser.lastName,
        avatarUrl: stackUser.avatarUrl
    }
);

// In protected API routes
const { allowed, scansRemaining } = await authService.checkScanLimit(userId);
if (!allowed) {
    return NextResponse.json(
        { error: 'Scan limit reached', scansRemaining: 0 },
        { status: 429 }
    );
}
```

---

## Middleware Design

### New: Authentication Middleware (`lib/middleware/auth.middleware.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStackAuthUser } from '@stackframe/stack';
import { AuthService } from '@/lib/services/auth.service';

/**
 * Middleware to protect API routes
 * 1. Verify Stack Auth session
 * 2. Sync user if not exists
 * 3. Attach user to request context
 */
export async function authMiddleware(request: NextRequest) {
    try {
        // Check Stack Auth session
        const stackUser = await getStackAuthUser(request);

        if (!stackUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get or create app user
        const authService = new AuthService();
        let appUser = await authService.getUserByStackId(stackUser.id);

        if (!appUser) {
            // First login - create user
            appUser = await authService.syncUser(
                stackUser.id,
                stackUser.email,
                {
                    firstName: stackUser.firstName,
                    lastName: stackUser.lastName,
                    avatarUrl: stackUser.avatarUrl
                }
            );
        }

        // Update last login
        await authService.updateLastLogin(appUser.id);

        // Attach user to request (via headers for Next.js 15)
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', appUser.id.toString());
        requestHeaders.set('x-user-email', appUser.email);
        requestHeaders.set('x-user-tier', appUser.tier);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
        );
    }
}

/**
 * Helper to get user from request headers
 */
export function getUserFromRequest(request: NextRequest): {
    id: number;
    email: string;
    tier: string;
} {
    return {
        id: parseInt(request.headers.get('x-user-id') || '0'),
        email: request.headers.get('x-user-email') || '',
        tier: request.headers.get('x-user-tier') || 'free',
    };
}
```

### Updated: Rate Limit Middleware (`lib/middleware/rate-limit.ts`)

Integrate with AuthService to check tier-based limits:

```typescript
export async function rateLimitMiddleware(request: NextRequest) {
    const user = getUserFromRequest(request);

    if (!user.id) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const authService = new AuthService();
    const { allowed, scansRemaining, resetAt } = await authService.checkScanLimit(user.id);

    if (!allowed) {
        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                scansRemaining: 0,
                resetAt: resetAt.toISOString(),
                upgradeUrl: '/pricing'
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetAt.toISOString(),
                }
            }
        );
    }

    // Increment scan count
    await authService.incrementScanCount(user.id);

    return NextResponse.next();
}
```

---

## API Routes Design

### Stack Auth Routes (Auto-Generated)

The Stack Auth SDK will generate these routes automatically:

- `/api/auth/signin` - Sign in page
- `/api/auth/signup` - Sign up page
- `/api/auth/callback/[provider]` - OAuth callbacks
- `/api/auth/signout` - Sign out
- `/api/auth/session` - Get current session

### Custom App Routes

#### 1. User Profile Route (`app/api/user/profile/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getUserFromRequest } from '@/lib/middleware/auth.middleware';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) return authResult;

    const user = getUserFromRequest(request);

    try {
        const userProfile = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!userProfile[0]) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            data: userProfile[0],
            status: 'success'
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}
```

#### 2. User Sync Webhook (`app/api/webhooks/user-sync/route.ts`)

For production: Webhook from Stack Auth to sync user changes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

export async function POST(request: NextRequest) {
    try {
        // Verify webhook signature (Stack Auth provides this)
        const signature = request.headers.get('x-stack-signature');
        // TODO: Implement signature verification

        const body = await request.json();
        const { event, user } = body;

        const authService = new AuthService();

        switch (event) {
            case 'user.created':
            case 'user.updated':
                await authService.syncUser(
                    user.id,
                    user.email,
                    {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatarUrl: user.avatarUrl
                    }
                );
                break;

            case 'user.deleted':
                // Handle user deletion if needed
                break;
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
```

#### 3. Updated Audit Route (`app/api/audit/route.ts`)

Add authentication and rate limiting:

```typescript
import { authMiddleware, getUserFromRequest } from '@/lib/middleware/auth.middleware';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) return authResult;

    // Apply rate limit middleware
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult.status !== 200) return rateLimitResult;

    const user = getUserFromRequest(request);

    // Existing audit logic...
    // Now you have user.id, user.email, user.tier available
}
```

---

## UI Components & User Flows

### 1. Auth Provider Wrapper (`app/layout.tsx`)

```typescript
import { StackProvider, StackTheme } from "@stackframe/stack";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <StackProvider
                    projectId={process.env.NEXT_PUBLIC_STACK_PROJECT_ID!}
                    publishableClientKey={process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!}
                    theme={StackTheme}
                >
                    {children}
                </StackProvider>
            </body>
        </html>
    );
}
```

### 2. Updated Signup Page (`app/signup/page.tsx`)

Replace button handlers with Stack Auth hooks:

```typescript
"use client";

import { useStackApp, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
    const stackApp = useStackApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;

        try {
            await stackApp.signUpWithCredential({
                email,
                password,
                profile: { firstName, lastName }
            });

            // Redirect to dashboard
            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await stackApp.signInWithOAuth('google');
        } catch (err: any) {
            setError(err.message || 'Google signup failed');
        }
    };

    const handleGithubSignup = async () => {
        try {
            await stackApp.signInWithOAuth('github');
        } catch (err: any) {
            setError(err.message || 'GitHub signup failed');
        }
    };

    // Existing UI with updated handlers...
}
```

### 3. Protected Route Component (`components/auth/ProtectedRoute.tsx`)

```typescript
"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const user = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    return <>{children}</>;
}
```

### 4. User Profile Component (`components/auth/UserProfile.tsx`)

```typescript
"use client";

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";

export function UserProfile() {
    const stackUser = useUser();
    const [appUser, setAppUser] = useState<any>(null);

    useEffect(() => {
        if (stackUser) {
            // Fetch app-specific user data
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => setAppUser(data.data));
        }
    }, [stackUser]);

    if (!stackUser || !appUser) return null;

    return (
        <div className="p-4 border rounded-lg">
            <img
                src={stackUser.avatarUrl}
                alt={stackUser.displayName}
                className="w-16 h-16 rounded-full"
            />
            <h3>{stackUser.displayName}</h3>
            <p className="text-sm text-gray-500">{stackUser.email}</p>

            {/* App-specific data */}
            <div className="mt-4">
                <p className="font-semibold">Tier: {appUser.tier.toUpperCase()}</p>
                <p>Scans today: {appUser.scansToday}</p>
                {appUser.tier === 'free' && (
                    <Button onClick={() => router.push('/pricing')}>
                        Upgrade to Pro
                    </Button>
                )}
            </div>
        </div>
    );
}
```

---

## User Flows

### Flow 1: New User Signup (Email/Password)

```
1. User visits /signup
2. User fills form (email, password, name)
3. Click "Create account" button
   ↓
4. Call stackApp.signUpWithCredential()
   ↓
5. Stack Auth creates user in neon_auth.users_sync
   ↓
6. Stack Auth returns session token
   ↓
7. Client redirects to /dashboard
   ↓
8. Dashboard loads, authMiddleware runs:
   - Verifies Stack Auth session ✓
   - Checks if user exists in public.users ✗
   - Calls authService.syncUser() to create user
   - Sets tier = 'free', scansToday = 0
   ↓
9. User sees dashboard with free tier features
10. User can scan contracts (3/day limit)
```

### Flow 2: OAuth Signup (Google/GitHub)

```
1. User visits /signup
2. Click "Sign up with Google" button
   ↓
3. stackApp.signInWithOAuth('google')
   ↓
4. Redirect to Google OAuth consent screen
   ↓
5. User approves, Google redirects back
   ↓
6. Stack Auth creates user with Google data
   ↓
7. Stack Auth sets session
   ↓
8. Redirect to /dashboard
   ↓
9. authMiddleware creates app user record
   ↓
10. User ready to use app
```

### Flow 3: Returning User Login

```
1. User visits /login
2. Enter email/password
3. Click "Sign in"
   ↓
4. stackApp.signInWithCredential()
   ↓
5. Stack Auth verifies credentials
   ↓
6. Session created, redirect to /dashboard
   ↓
7. authMiddleware runs:
   - Verifies session ✓
   - Finds existing user in public.users ✓
   - Updates last_login_at timestamp
   ↓
8. User sees dashboard with their tier/history
```

### Flow 4: Rate-Limited Scan Request

```
1. User clicks "Scan Contract"
   ↓
2. POST /api/audit
   ↓
3. authMiddleware: Verify user ✓
   ↓
4. rateLimitMiddleware:
   - Load user from public.users
   - Check scansToday vs. tier limit
   - Free tier: 3/day, scansToday = 3 ✗
   ↓
5. Return 429 Rate Limit Exceeded
   {
     error: "Scan limit reached",
     scansRemaining: 0,
     resetAt: "2025-10-07T00:00:00Z",
     upgradeUrl: "/pricing"
   }
   ↓
6. UI shows upgrade prompt:
   "You've used all 3 free scans today.
    Upgrade to Pro for unlimited scans!"
   [Upgrade to Pro] button
```

---

## Environment Variables

### New Environment Variables Required

Add to `.env.local`:

```bash
# Stack Auth (Neon Auth) Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key

# Stack Auth Webhook Secret (for production)
STACK_WEBHOOK_SECRET=your_webhook_secret
```

### Existing Variables (Unchanged)

```bash
DATABASE_URL=your_neon_connection_string
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
# ... rest remain the same
```

---

## Tier Limits Configuration

### Scan Limits by Tier

```typescript
// lib/config/tier-limits.ts
export const TIER_LIMITS = {
    free: {
        scansPerDay: 3,
        apiAccess: false,
        support: 'community',
        features: ['basic-scan', 'risk-score', 'issue-detection']
    },
    pro: {
        scansPerDay: 100,
        apiAccess: true,
        support: 'email',
        features: ['basic-scan', 'risk-score', 'issue-detection', 'detailed-analysis', 'export-reports']
    },
    enterprise: {
        scansPerDay: -1, // unlimited
        apiAccess: true,
        support: 'priority',
        features: ['all', 'custom-rules', 'white-label', 'dedicated-support']
    }
} as const;

export function getTierLimit(tier: string): number {
    const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
    return limit?.scansPerDay ?? TIER_LIMITS.free.scansPerDay;
}
```

---

## Security Considerations

### 1. Session Security
- Stack Auth handles session tokens securely (httpOnly cookies)
- Tokens are short-lived with automatic refresh
- CSRF protection built-in

### 2. Database Security
- Never expose Stack Auth credentials
- Use Drizzle ORM to prevent SQL injection
- Validate all user inputs before database operations

### 3. Rate Limiting
- Implement IP-based rate limiting for API routes
- Tier-based scan limits prevent abuse
- Redis for distributed rate limiting

### 4. Data Privacy
- Store minimal user data in app database
- Pull profile data from Stack Auth on demand
- Implement GDPR-compliant data deletion

### 5. Webhook Security
- Verify Stack Auth webhook signatures
- Use HTTPS only for webhooks
- Implement replay attack prevention

---

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Install Stack Auth SDK: `npm install @stackframe/stack`
- [ ] Run Stack Auth setup wizard: `npx @stackframe/init-stack@latest --no-browser`
- [ ] Configure environment variables in `.env.local`
- [ ] Update `db/schema.ts` with new users table schema
- [ ] Run `npm run db:push` to apply schema changes

### Phase 2: Service Layer (Day 2)
- [ ] Create `lib/services/auth.service.ts`
- [ ] Implement user sync methods
- [ ] Implement rate limit check methods
- [ ] Add tier limits configuration
- [ ] Write unit tests for AuthService

### Phase 3: Middleware (Day 2-3)
- [ ] Create `lib/middleware/auth.middleware.ts`
- [ ] Update `lib/middleware/rate-limit.ts`
- [ ] Test middleware with different user tiers
- [ ] Add error handling and logging

### Phase 4: API Routes (Day 3-4)
- [ ] Create `/api/user/profile/route.ts`
- [ ] Create `/api/webhooks/user-sync/route.ts`
- [ ] Update `/api/audit/route.ts` with auth
- [ ] Test all API routes with Postman/Thunder Client

### Phase 5: UI Integration (Day 4-5)
- [ ] Wrap app with StackProvider in `app/layout.tsx`
- [ ] Update `app/signup/page.tsx` with Stack Auth hooks
- [ ] Update `app/login/page.tsx` with Stack Auth hooks
- [ ] Create `components/auth/ProtectedRoute.tsx`
- [ ] Create `components/auth/UserProfile.tsx`
- [ ] Add logout functionality to Header component

### Phase 6: Testing (Day 5-6)
- [ ] Test email/password signup flow
- [ ] Test Google OAuth signup flow
- [ ] Test GitHub OAuth signup flow
- [ ] Test rate limiting (free tier: 3 scans/day)
- [ ] Test upgrade flow (free → pro)
- [ ] Test protected routes without auth

### Phase 7: Production (Day 7)
- [ ] Enable Neon Auth in production project
- [ ] Configure Stack Auth webhooks
- [ ] Set up monitoring and error tracking
- [ ] Deploy to Vercel
- [ ] Test production authentication end-to-end

---

## Migration Strategy

### For Existing Users (If Any)

If there are existing users in the `public.users` table:

1. **Manual Migration Script**:
   ```typescript
   // scripts/migrate-users-to-stack.ts
   async function migrateUsers() {
       const existingUsers = await db.select().from(users);

       for (const user of existingUsers) {
           // Create Stack Auth account
           const stackUser = await stackApp.createUser({
               email: user.email,
               // Send password reset email
           });

           // Update user record with Stack Auth ID
           await db.update(users)
               .set({ stackUserId: stackUser.id })
               .where(eq(users.id, user.id));
       }
   }
   ```

2. **User Communication**:
   - Email all existing users
   - Inform about new authentication system
   - Provide password reset link

### For New Project

If starting fresh:
- No migration needed
- All new users will be created through Stack Auth
- `public.users` table starts empty

---

## Cost Analysis

### Stack Auth (Neon Auth) Pricing
- **Free Tier**: Up to 1,000 MAUs (Monthly Active Users)
- **Pro Tier**: $99/month for 10,000 MAUs
- **Enterprise**: Custom pricing

### Projected Costs for ContractGuard
- **Month 1-2**: Free tier (< 1,000 users)
- **Month 3**: If hitting $5-10k MRR → ~500-1,000 users → Still free tier
- **Month 6**: If 2,000+ users → $99/month Stack Auth Pro

**Conclusion**: Auth costs will be negligible compared to AI API costs (~$100/month with caching).

---

## Alternative Approaches Considered

### 1. Custom Email/Password Auth
❌ **Rejected**
- Requires 2-3 weeks to build securely
- Liability for security breaches
- No OAuth out of the box
- Maintenance burden

### 2. Auth0 / Clerk
✅ **Viable Alternative**
- Similar features to Stack Auth
- More expensive ($25-50/month minimum)
- Less integrated with Neon

### 3. NextAuth.js (Auth.js)
✅ **Viable Alternative**
- Open source, free
- Requires more setup (OAuth config, JWT handling)
- More flexibility but more complexity
- Good for custom requirements

**Why Stack Auth Wins**: Fastest to implement, Neon-native, perfect for MVP timeline.

---

## Support & Resources

### Documentation
- Stack Auth Docs: https://docs.stack-auth.com
- Neon Auth Quick Start: https://neon.com/docs/neon-auth/quick-start/nextjs
- Stack Auth GitHub: https://github.com/stackframe-projects/stack

### Example Projects
- Stack Auth Next.js Example: https://github.com/stackframe-projects/stack/tree/main/examples/nextjs
- Neon Auth Demo: https://github.com/neondatabase/neon-auth-examples

### Support Channels
- Stack Auth Discord: https://discord.gg/stack-auth
- Neon Discord: https://discord.gg/neon
- GitHub Issues: https://github.com/stackframe-projects/stack/issues

---

## Conclusion

This authentication design provides:

✅ **Fast Implementation**: 5-7 days total vs. 3+ weeks for custom auth
✅ **Security**: Leverages industry-standard OAuth and session management
✅ **Scalability**: Supports free → pro → enterprise tier progression
✅ **Flexibility**: Can swap auth providers without changing business logic
✅ **Cost-Effective**: Free for first 1,000 users, then $99/month
✅ **Developer Experience**: Clean separation of auth and business logic

**Next Steps**: Begin Phase 1 implementation following the checklist above.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Author**: Claude Code Design System
**Status**: ✅ Ready for Implementation
