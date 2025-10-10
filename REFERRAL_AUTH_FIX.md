# Referral API Authentication Fix

## Problem

The referral stats API endpoint was failing with a console error:

```
Failed to fetch referral stats
at fetchReferralData (components/referrals/ReferralBannerContainer.tsx:27:19)
```

## Root Cause

The API routes were using `getUserFromRequest()` from `lib/middleware/auth.middleware.ts`, which expected authentication headers (`x-user-id`, `x-stack-user-id`, etc.) to be set by a middleware. However:

1. The middleware was never properly configured to set these headers
2. Stack Auth's middleware wasn't integrated into the Next.js middleware chain
3. This caused `getUserFromRequest()` to throw an error when the headers weren't present

## Solution

Updated all affected API routes to use Stack Auth's server-side `stackServerApp.getUser()` method instead, following the same pattern as the working `/api/audit` route.

### Files Fixed

1. **`app/api/referrals/stats/route.ts`**
   - Changed from `getUserFromRequest(request)` to `stackServerApp.getUser()`
   - Added proper user sync logic
   - Added validation for email presence

2. **`app/api/referrals/confirm/route.ts`**
   - Same changes as above
   - Ensures referral confirmation works correctly

3. **`app/api/user/verification-status/route.ts`**
   - Removed dependency on `authMiddleware()`
   - Updated to use `stackServerApp.getUser()`

## Authentication Pattern

### ❌ Old Pattern (Broken)

```typescript
import { getUserFromRequest } from "@/lib/middleware/auth.middleware";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request); // Throws error if headers not set
  // ...
}
```

### ✅ New Pattern (Working)

```typescript
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

export async function GET(request: NextRequest) {
  // Get authenticated user from Stack Auth
  const stackUser = await stackServerApp.getUser();

  if (!stackUser) {
    return NextResponse.json(
      { error: "Unauthorized - You must be logged in" },
      { status: 401 }
    );
  }

  // Validate email
  if (!stackUser.primaryEmail) {
    return NextResponse.json(
      { error: "Invalid user account - Missing email address" },
      { status: 400 }
    );
  }

  // Get or create app user
  const authService = new AuthService();
  let appUser = await authService.getUserByStackId(stackUser.id);

  if (!appUser) {
    appUser = await authService.syncUser(stackUser.id, stackUser.primaryEmail, {
      displayName: stackUser.displayName || undefined,
      avatarUrl: stackUser.profileImageUrl || undefined,
    });
  }

  // Use appUser.id for database operations
  // ...
}
```

## Why This Works

1. **Direct Stack Auth Integration**: `stackServerApp.getUser()` directly queries Stack Auth's session using Next.js cookies
2. **No Middleware Required**: Doesn't depend on middleware setting headers
3. **Automatic User Sync**: Creates app users on first API call if needed
4. **Consistent Pattern**: All API routes now follow the same authentication pattern

## Testing

After this fix, the referral banner should:

1. Load successfully for authenticated users
2. Show the user's referral code
3. Display referral stats (invites, confirmed, scans earned)
4. Not throw console errors

## Future Considerations

The `lib/middleware/auth.middleware.ts` file still exists with `getUserFromRequest()` but is no longer used in the codebase. Consider:

1. **Option 1**: Remove the file entirely if not needed
2. **Option 2**: Keep it for backward compatibility but add deprecation warnings
3. **Option 3**: Refactor it to use Stack Auth internally

For now, it's left as-is since it's not causing any issues.

## Related Files

- `components/referrals/ReferralBannerContainer.tsx` - The component that calls the API
- `stack/server.tsx` - Stack Auth server configuration
- `lib/services/auth.service.ts` - User sync service
- `app/api/audit/route.ts` - Example of correct auth pattern

---

**Fixed**: 2025-10-09
**Status**: ✅ Complete
