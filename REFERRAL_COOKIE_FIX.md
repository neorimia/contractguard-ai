# Referral Cookie Setting Fix

## Problem

Getting a runtime error in Next.js 15:

```
Cookies can only be modified in a Server Action or Route Handler.
```

The error occurred in `app/ref/[code]/page.tsx` when trying to set cookies directly in the page component.

## Root Cause

In Next.js 15, you **cannot set cookies directly in page components** (Server Components). Cookies can only be set in:

1. Middleware
2. Server Actions
3. Route Handlers

## Solution

### What Was Changed

**File: `app/ref/[code]/page.tsx`**

❌ **Removed:**

- Import of `setReferralCookie`
- Cookie setting logic in the page component

✅ **Updated:**

- Changed `params` to be a Promise (Next.js 15 requirement)
- Added comment noting that middleware handles cookie setting
- Removed redundant cookie setting attempt

### How It Works Now

1. **User visits**: `/ref/CG-ABC123`

2. **Middleware runs** (`middleware.ts`):
   - Validates referral code format
   - Sets referral cookie with 7-day expiration
   - Logs cookie setting

3. **Page renders** (`app/ref/[code]/page.tsx`):
   - Validates referral code (database check)
   - Shows landing page with referrer info
   - Cookie is already set by middleware

### Code Changes

```typescript
// Before
export default async function ReferralLandingPage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;

  const validation = await referralService.validateReferralCode(code);

  // ❌ This causes an error in Next.js 15
  if (validation.valid) {
    await setReferralCookie(code);
  }
}

// After
export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>; // ✅ Promise in Next.js 15
}) {
  const { code } = await params; // ✅ Await the params

  // ✅ Cookie is already set by middleware
  const validation = await referralService.validateReferralCode(code);
}
```

## Why This Works

### Middleware Pattern (Current)

✅ **Runs before page renders**  
✅ **Can modify cookies**  
✅ **Handles all `/ref/*` routes**  
✅ **No extra API calls needed**

### Benefits

- **Faster**: Cookie set immediately in middleware
- **Simpler**: No server action needed
- **Reliable**: Middleware runs on every referral link visit
- **Compliant**: Follows Next.js 15 rules

## Testing

To verify the fix:

1. Visit a referral link: `http://localhost:3000/ref/CG-ABC123`
2. Check browser DevTools → Application → Cookies
3. Verify `contractguard_referral` cookie is set
4. Check server console for: `Referral cookie set for code: CG-ABC123`

## Related Files

- `middleware.ts` - Sets the referral cookie
- `app/ref/[code]/page.tsx` - Displays landing page (fixed)
- `lib/utils/referral-cookies.ts` - Cookie utility functions (server/client)
- `lib/referrals/config.ts` - Cookie configuration

## Next.js 15 Changes

This fix also addresses Next.js 15 requirements:

- ✅ `params` as Promise
- ✅ Cookie modification in middleware only
- ✅ Proper async/await for params

---

**Fixed**: 2025-10-09  
**Status**: ✅ Resolved  
**Next.js Version**: 15.5.4
