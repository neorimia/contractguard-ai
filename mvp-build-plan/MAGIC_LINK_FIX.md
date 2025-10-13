# Magic Link Verification Bug Fix

**Issue**: Magic link verification was failing with error:

```
SyntaxError: "[object Object]" is not valid JSON
```

## Root Cause

The Upstash Redis client automatically serializes and deserializes JSON data. The code had two issues:

1. **In `soft-signup` route**: Data was manually `JSON.stringify()`'d before storing in Redis
2. **In `verify-magic-link` route**: Retrieved data was being `JSON.parse()`'d again

This caused a double-encoding/decoding issue:

- Store: `redis.set(key, JSON.stringify(object))` → stores JSON string
- Retrieve: `redis.get(key)` → automatically parses to object
- Bug: `JSON.parse(object)` → tries to parse an object, fails

## Solution

### Fixed in `app/api/auth/soft-signup/route.ts`:

```typescript
// BEFORE (incorrect)
await redis.set(
  tokenKey,
  JSON.stringify({
    email: normalizedEmail,
    anonymousSessionId,
    expiresAt: expiresAt.toISOString(),
  }),
  { ex: 3600 }
);

// AFTER (correct)
await redis.set(
  tokenKey,
  {
    email: normalizedEmail,
    anonymousSessionId,
    expiresAt: expiresAt.toISOString(),
  },
  { ex: 3600 } // Upstash Redis auto-serializes
);
```

### Fixed in `app/api/auth/verify-magic-link/route.ts`:

```typescript
// BEFORE (incorrect)
const tokenDataStr = await redis.get(tokenKey);
const tokenData = JSON.parse(tokenDataStr as string);

// AFTER (correct)
const tokenData = await redis.get<MagicTokenData>(tokenKey);
// Upstash Redis auto-deserializes, no need to JSON.parse()
```

## Additional Improvements

1. **Added TypeScript interface** for type safety:

```typescript
interface MagicTokenData {
  email: string;
  anonymousSessionId?: string;
  expiresAt: string;
}
```

2. **Added comments** explaining Upstash Redis auto-serialization behavior

## Testing

The magic link flow should now work correctly:

1. User enters email for soft signup
2. System sends magic link email
3. User clicks link
4. Token is verified and user redirects to Stack Auth signup
5. Account is created with email pre-filled

## Related Files

- `app/api/auth/soft-signup/route.ts` (fixed)
- `app/api/auth/verify-magic-link/route.ts` (fixed)

---

**Status**: ✅ Fixed  
**Date**: October 11, 2025
