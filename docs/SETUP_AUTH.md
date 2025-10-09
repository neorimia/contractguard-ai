# Authentication Setup Guide - ContractGuard AI

## Implementation Status: Phase 1 Complete ✅

This document provides step-by-step instructions to complete the authentication system setup.

---

## What's Been Implemented

### ✅ Backend Infrastructure (Complete)
- [x] Stack Auth SDK installed (`@stackframe/stack`)
- [x] Database schema updated with Stack Auth integration
- [x] `AuthService` for user sync and rate limiting
- [x] Tier limits configuration
- [x] Authentication middleware
- [x] Rate limiting middleware (integrated with tiers)
- [x] User profile API route (`/api/user/profile`)
- [x] Audit API route updated with authentication
- [x] App layout wrapped with `StackProvider`

### 🔄 Frontend Integration (Partial)
- [x] Layout wrapped with StackProvider
- [ ] Signup page needs Stack Auth hooks
- [ ] Login page needs Stack Auth hooks
- [ ] Protected route component needed
- [ ] User profile component needed

---

## Next Steps to Complete Setup

### Step 1: Get Stack Auth Credentials

1. Visit [Stack Auth Dashboard](https://app.stack-auth.com) or create account at https://stack-auth.com
2. Create a new project for ContractGuard AI
3. Navigate to project settings
4. Copy the following credentials:
   - Project ID
   - Publishable Client Key
   - Secret Server Key

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
STACK_SECRET_SERVER_KEY=your_secret_key_here

# Existing variables remain the same
DATABASE_URL=your_neon_connection_string
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
# ... rest of your variables
```

**Important**: Never commit `.env.local` to version control!

### Step 3: Update Database Schema

Run the database migration to add new fields:

```bash
npm run db:push
```

This will add the following fields to the `users` table:
- `stack_user_id` (unique, required)
- `first_name`, `last_name`, `avatar_url` (optional profile fields)
- `stripe_subscription_id`, `subscription_status` (billing fields)
- `updated_at`, `last_login_at` (timestamps)

### Step 4: Run Stack Auth Setup Wizard

```bash
npx @stackframe/init-stack@latest
```

This wizard will:
- Configure Stack Auth routes automatically
- Set up authentication handlers
- Create necessary configuration files

**Note**: Choose these options during setup:
- Framework: Next.js (App Router)
- TypeScript: Yes
- Authentication methods: Email/Password + OAuth (Google, GitHub)

### Step 5: Configure OAuth Providers (Optional but Recommended)

In Stack Auth Dashboard:
1. Navigate to "Authentication" → "OAuth Providers"
2. Enable Google OAuth:
   - Add Google Client ID and Secret
   - Add redirect URL: `https://yourdomain.com/api/auth/callback/google`
3. Enable GitHub OAuth:
   - Add GitHub Client ID and Secret
   - Add redirect URL: `https://yourdomain.com/api/auth/callback/github`

For local development:
- Google redirect: `http://localhost:3000/api/auth/callback/google`
- GitHub redirect: `http://localhost:3000/api/auth/callback/github`

---

## Frontend Integration (Remaining Work)

### Option 1: Use Stack Auth UI Components (Fastest)

Stack Auth provides pre-built UI components. Update your pages to use them:

**app/signup/page.tsx**:
```typescript
"use client";

import { SignUp } from "@stackframe/stack";

export default function SignupPage() {
  return <SignUp />;
}
```

**app/login/page.tsx**:
```typescript
"use client";

import { SignIn } from "@stackframe/stack";

export default function LoginPage() {
  return <SignIn />;
}
```

### Option 2: Keep Custom UI, Integrate Stack Auth Hooks

Update your existing beautiful UI with Stack Auth hooks:

**app/signup/page.tsx** (partial update):
```typescript
"use client";

import { useStackApp } from "@stackframe/stack";
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

  // Your existing UI code...
  // Update button onClick handlers to use the functions above
}
```

### Create Protected Route Component

**components/auth/ProtectedRoute.tsx**:
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

Usage in protected pages:
```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Your dashboard content */}
    </ProtectedRoute>
  );
}
```

### Create User Profile Component

**components/auth/UserProfile.tsx**:
```typescript
"use client";

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function UserProfile() {
  const stackUser = useUser();
  const [appUser, setAppUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stackUser) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setAppUser(data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load profile:', err);
          setLoading(false);
        });
    }
  }, [stackUser]);

  if (loading) return <div>Loading...</div>;
  if (!stackUser || !appUser) return null;

  return (
    <div className="p-4 border rounded-lg">
      {stackUser.profileImageUrl && (
        <img
          src={stackUser.profileImageUrl}
          alt={stackUser.displayName || 'User'}
          className="w-16 h-16 rounded-full"
        />
      )}
      <h3 className="font-semibold mt-2">{stackUser.displayName}</h3>
      <p className="text-sm text-gray-500">{stackUser.primaryEmail}</p>

      <div className="mt-4">
        <p className="font-semibold">
          Tier: <span className="text-blue-600">{appUser.tier.toUpperCase()}</span>
        </p>
        <p className="text-sm">Scans today: {appUser.scansToday}</p>
        {appUser.tier === 'free' && (
          <Button
            onClick={() => window.location.href = '/pricing'}
            className="mt-2"
          >
            Upgrade to Pro
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## Testing the Implementation

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Signup Flow

1. Navigate to `http://localhost:3000/signup`
2. Create an account with email/password OR use OAuth
3. Verify redirect to dashboard/home
4. Check browser console for any errors

### 3. Test Login Flow

1. Navigate to `http://localhost:3000/login`
2. Log in with created credentials
3. Verify successful authentication

### 4. Test Rate Limiting

1. Log in as free tier user
2. Navigate to contract scanner
3. Scan 3 contracts (free tier limit)
4. Attempt 4th scan - should show rate limit error
5. Check error message suggests upgrading to Pro

### 5. Verify Database Sync

```bash
npm run db:studio
```

In Drizzle Studio:
1. Open `users` table
2. Verify new user exists with:
   - `stack_user_id` populated
   - `email` matches Stack Auth user
   - `tier` set to 'free'
   - `scans_today` = 0

---

## Troubleshooting

### Issue: "Module not found: @stackframe/stack"

**Solution**: Ensure package is installed:
```bash
npm install @stackframe/stack
rm -rf .next
npm run dev
```

### Issue: "NEXT_PUBLIC_STACK_PROJECT_ID is not defined"

**Solution**:
1. Check `.env.local` exists and has correct variables
2. Restart dev server after adding env variables
3. Verify variable names match exactly (case-sensitive)

### Issue: Database schema mismatch

**Solution**:
```bash
npm run db:push
```

If issues persist:
```bash
# Generate new migration
npm run db:generate
# Push to database
npm run db:push
```

### Issue: OAuth redirect errors

**Solution**:
1. Verify redirect URLs in OAuth provider settings match Stack Auth configuration
2. For local development, use `http://localhost:3000` not `https://`
3. Check Stack Auth dashboard for correct callback URLs

### Issue: Rate limiting not working

**Solution**:
1. Verify Upstash Redis credentials in `.env.local`
2. Test Redis connection:
   ```typescript
   // In a test API route
   import { Redis } from '@upstash/redis';
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_URL!,
     token: process.env.UPSTASH_REDIS_TOKEN!
   });
   await redis.set('test', 'value');
   ```
3. Check AuthService is incrementing scan count

---

## Production Deployment Checklist

- [ ] Set all environment variables in Vercel/hosting platform
- [ ] Update Stack Auth allowed domains to include production URL
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Run database migrations in production: `npm run db:push`
- [ ] Test signup/login flows in production
- [ ] Test rate limiting in production
- [ ] Set up monitoring for authentication errors
- [ ] Configure Stack Auth webhooks for production (optional)

---

## API Routes Reference

### Authentication
- `POST /api/auth/signup` - Create new account (Stack Auth handled)
- `POST /api/auth/signin` - Sign in (Stack Auth handled)
- `POST /api/auth/signout` - Sign out (Stack Auth handled)
- `GET /api/auth/session` - Get current session (Stack Auth handled)

### User Management
- `GET /api/user/profile` - Get current user profile
- `PATCH /api/user/profile` - Update user profile

### Contract Scanning
- `POST /api/audit` - Scan contract (requires auth, rate limited)
- `GET /api/audit?address=0x...` - Get existing audit

---

## Tier Limits

| Tier | Scans/Day | API Access | Support | Price |
|------|-----------|------------|---------|-------|
| Free | 3 | No | Community | $0 |
| Pro | 100 | Yes | Email | $29/mo |
| Enterprise | Unlimited | Yes | Priority | Custom |

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Stack Auth documentation: https://docs.stack-auth.com
3. Check ContractGuard AI repository issues
4. Contact Stack Auth support: https://discord.gg/stack-auth

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Implementation Status**: Backend Complete, Frontend Partial
**Next Phase**: Frontend UI Integration
