# Authentication Setup - Quick Start Guide

## ✅ What's Already Implemented

### Backend

- ✅ Stack Auth SDK installed and configured
- ✅ Database schema with `users`, `audits`, and `api_keys` tables
- ✅ Authentication service for user management
- ✅ Rate limiting based on user tiers (Free: 3/day, Pro: 100/day)
- ✅ User profile API endpoints (`/api/user/profile`)
- ✅ Protected audit API with authentication

### Frontend

- ✅ Sign-in page (`/sign-in`) with beautiful UI
- ✅ Sign-up page (`/sign-up`) with beautiful UI
- ✅ Stack Auth handler route (`/handler/[...stack]`)
- ✅ Header component with user profile dropdown
- ✅ Authentication state management
- ✅ Mobile-responsive auth UI

### Middleware

- ✅ Next.js middleware for route protection
- ✅ Automatic redirect to sign-in for protected routes
- ✅ User session headers for API routes

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Stack Auth Credentials

1. Visit https://app.stack-auth.com (or create account)
2. Create new project: "ContractGuard AI"
3. Copy these credentials:
   - Project ID
   - Publishable Client Key
   - Secret Server Key

### Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key

# Database (if not already set)
DATABASE_URL=your_neon_connection_string

# Other required variables...
```

### Step 3: Push Database Schema

```bash
npm run db:push
```

That's it! Your authentication is ready. 🎉

## 🧪 Testing the Flow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Sign Up

1. Navigate to http://localhost:3000/sign-up
2. Create account with email/password
3. Should redirect to `/chat` after signup
4. Check database - user should exist in `users` table

### 3. Test Sign In

1. Sign out (user menu in header)
2. Navigate to http://localhost:3000/sign-in
3. Sign in with your credentials
4. Should redirect to `/chat`

### 4. Test Protected Routes

1. Sign out
2. Try to access http://localhost:3000/chat
3. Should redirect to `/sign-in` with redirect parameter

### 5. Test Rate Limiting

As a **Free tier user**:

1. Sign in
2. Navigate to `/chat`
3. Scan 3 contracts (free limit)
4. Try 4th scan - should see rate limit error
5. Error should suggest upgrading to Pro

### 6. Test User Profile

1. Sign in
2. Click user icon in header
3. Should see dropdown with:
   - User name and email
   - Dashboard link
   - Sign out button

## 🎯 User Flows

### New User Flow

```
Landing Page → Sign Up → Email Verification (Stack Auth) → Chat Page → Scan Contract
```

### Returning User Flow

```
Landing Page → Sign In → Chat Page → Continue Scanning
```

### Protected Route Flow

```
User tries /chat → Middleware checks auth → Redirects to /sign-in → After login → Redirects back to /chat
```

## 📊 Tier System

| Tier       | Scans/Day | Features                  | Price  |
| ---------- | --------- | ------------------------- | ------ |
| Free       | 3         | Basic analysis            | $0     |
| Pro        | 100       | All features + API access | $29/mo |
| Enterprise | Unlimited | Custom features           | Custom |

Rate limiting resets at **00:00 UTC** daily.

## 🔒 Security Features

1. **JWT Authentication**: Stack Auth handles secure token management
2. **Route Protection**: Middleware blocks unauthorized access
3. **Rate Limiting**: Per-user scan limits prevent abuse
4. **Secure Sessions**: Cookie-based session storage
5. **API Protection**: All API routes check authentication

## 🐛 Troubleshooting

### Issue: "User not authenticated" error

**Solution**:

1. Clear browser cookies
2. Sign out and sign in again
3. Check Stack Auth credentials in `.env.local`

### Issue: Rate limit not working

**Solution**:

1. Verify Redis connection (UPSTASH_REDIS_URL)
2. Check AuthService implementation
3. Ensure middleware is running

### Issue: Sign-in redirects to wrong page

**Solution**:

1. Check `stack/server.tsx` URL configuration
2. Verify middleware redirect logic
3. Clear browser cache

### Issue: Database errors

**Solution**:

```bash
# Regenerate schema
npm run db:generate

# Push to database
npm run db:push

# Verify in Drizzle Studio
npm run db:studio
```

## 📚 Key Files

```
stack/
├── client.tsx          # Client-side Stack Auth config
└── server.tsx          # Server-side Stack Auth config

app/
├── sign-in/page.tsx    # Sign-in page
├── sign-up/page.tsx    # Sign-up page
└── handler/[...stack]/ # Stack Auth handler

lib/
├── services/
│   └── auth.service.ts # User management
└── middleware/
    └── auth.middleware.ts # API auth middleware

middleware.ts           # Next.js route middleware
components/Header.tsx   # Auth-aware header
```

## 🎨 Customization

### Change Auth UI Theme

The sign-in/sign-up pages use Stack Auth's built-in components with custom styling. The layout is already customized with:

- Beautiful gradient backgrounds
- Custom branding
- Responsive design

### Add OAuth Providers

In Stack Auth dashboard:

1. Navigate to "Authentication" → "OAuth Providers"
2. Enable Google/GitHub/etc.
3. Add OAuth credentials
4. Set redirect URLs

### Modify User Tiers

Edit `lib/config/tier-limits.ts`:

```typescript
export const TIER_LIMITS = {
  free: 3, // Change free tier limit
  pro: 100, // Change pro tier limit
  enterprise: -1, // -1 means unlimited
};
```

## 🚀 Next Steps

1. ✅ Basic auth working
2. ⏭️ Add Stripe integration for Pro tier
3. ⏭️ Implement email notifications
4. ⏭️ Add user dashboard with usage stats
5. ⏭️ Deploy to production

## 📖 Documentation Links

- Stack Auth Docs: https://docs.stack-auth.com
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Drizzle ORM: https://orm.drizzle.team

## ✅ Verification Checklist

- [ ] Stack Auth credentials configured
- [ ] Database schema pushed
- [ ] Sign-up flow works
- [ ] Sign-in flow works
- [ ] Protected routes redirect properly
- [ ] User profile displays in header
- [ ] Rate limiting works
- [ ] Sign-out works
- [ ] Mobile UI responsive

---

**Last Updated**: 2025-10-08  
**Status**: Ready for Testing  
**Version**: 1.0
