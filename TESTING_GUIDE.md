# Authentication Testing Guide

## Overview

This guide will help you test the complete authentication flow for ContractGuard AI.

## Prerequisites

✅ Stack Auth credentials configured in `.env.local`  
✅ Database connection working  
✅ Redis connection working  
✅ Development server running (`npm run dev`)

## Test Suite

### Test 1: Sign Up Flow ✨

**Steps:**

1. Navigate to http://localhost:3000
2. Click "Sign Up" button in header
3. Fill in registration form:
   - Email: test@example.com
   - Password: SecurePass123!
4. Submit form

**Expected Results:**

- ✅ Redirects to `/chat` after successful signup
- ✅ User appears in header with profile icon
- ✅ User dropdown shows email and name
- ✅ New user record created in database with:
  - `stackUserId` populated
  - `tier` set to "free"
  - `scansToday` set to 0
  - `emailVerified` set to false initially

**How to Verify Database:**

```bash
npm run db:studio
# Open users table and check for new user
```

---

### Test 2: Sign In Flow 🔐

**Steps:**

1. Sign out (click user icon → "Sign Out")
2. Navigate to http://localhost:3000/sign-in
3. Enter credentials from Test 1
4. Submit form

**Expected Results:**

- ✅ Successful authentication
- ✅ Redirects to `/chat`
- ✅ User profile appears in header
- ✅ `lastLoginAt` timestamp updated in database

---

### Test 3: Protected Routes 🛡️

**Setup:** Sign out first

**Steps:**

1. Try to access http://localhost:3000/chat directly
2. Observe redirect behavior
3. Complete sign-in
4. Check if redirected back to `/chat`

**Expected Results:**

- ✅ Unauthenticated user redirected to `/sign-in?redirect=/chat`
- ✅ After sign-in, redirected back to `/chat`
- ✅ Can now access protected route

---

### Test 4: Header User Menu 👤

**Steps:**

1. Ensure you're signed in
2. Click user profile icon in header
3. Verify dropdown menu shows:
   - User display name
   - User email
   - "Dashboard" button
   - "Sign Out" button
4. Click outside dropdown
5. Click "Dashboard"
6. Click user icon and then "Sign Out"

**Expected Results:**

- ✅ Dropdown opens on click
- ✅ Shows correct user information
- ✅ Dropdown closes when clicking outside
- ✅ "Dashboard" navigates to `/chat`
- ✅ "Sign Out" signs user out and redirects to `/`
- ✅ Header shows "Login" and "Sign Up" buttons after sign out

---

### Test 5: Mobile Responsive UI 📱

**Steps:**

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone 12 Pro)
4. Test header menu:
   - Click hamburger menu
   - Verify mobile menu appears
   - Test sign in/out on mobile

**Expected Results:**

- ✅ Mobile menu opens smoothly
- ✅ Auth buttons work on mobile
- ✅ User profile displays correctly
- ✅ Touch interactions work

---

### Test 6: Rate Limiting (Free Tier) 🚦

**Setup:** Sign in as free tier user

**Steps:**

1. Navigate to `/chat`
2. Enter contract address: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
3. Click "Scan Contract"
4. Wait for result
5. Repeat 2 more times (total 3 scans)
6. Attempt 4th scan

**Expected Results:**

- ✅ First 3 scans succeed
- ✅ 4th scan shows rate limit error
- ✅ Error message: "You've used all your scans for today"
- ✅ Suggests upgrading to Pro
- ✅ Response includes `resetAt` timestamp
- ✅ Response headers include:
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: [timestamp]`

**Verify in Database:**

```bash
npm run db:studio
# Check users table
# scansToday should be 3
```

---

### Test 7: API Authentication 🔌

**Steps:**

1. Sign out
2. Use curl or Postman to call audit API:

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

3. Observe response
4. Sign in via browser
5. Get auth cookie
6. Retry API call with cookie

**Expected Results:**

- ✅ Unauthenticated request returns 401
- ✅ Error message: "You must be logged in to scan contracts"
- ✅ Authenticated request succeeds
- ✅ Returns contract analysis data

---

### Test 8: Redirect After Sign In 🔄

**Steps:**

1. Sign out
2. Navigate directly to http://localhost:3000/chat
3. Note the redirect URL includes `?redirect=/chat`
4. Complete sign-in
5. Observe final URL

**Expected Results:**

- ✅ Redirects to `/sign-in?redirect=/chat`
- ✅ After sign-in, redirects back to `/chat`
- ✅ User can continue with intended action

---

### Test 9: Session Persistence 💾

**Steps:**

1. Sign in
2. Close browser tab
3. Open new tab
4. Navigate to http://localhost:3000
5. Check if still signed in
6. Navigate to `/chat`

**Expected Results:**

- ✅ User remains signed in after closing tab
- ✅ Header shows user profile
- ✅ Can access protected routes
- ✅ No re-authentication required

---

### Test 10: Sign Out Functionality 🚪

**Steps:**

1. Sign in
2. Navigate to `/chat`
3. Click user icon → "Sign Out"
4. Try to access `/chat` again

**Expected Results:**

- ✅ Successfully signs out
- ✅ Redirects to homepage (`/`)
- ✅ Header shows "Login" and "Sign Up" buttons
- ✅ Cannot access protected routes
- ✅ Redirects to `/sign-in` when trying to access `/chat`

---

## Edge Cases & Error Scenarios

### Test 11: Invalid Credentials ❌

**Steps:**

1. Navigate to `/sign-in`
2. Enter incorrect email/password
3. Submit form

**Expected Results:**

- ✅ Shows error message
- ✅ Does not redirect
- ✅ Form remains accessible

---

### Test 12: Already Signed In ✔️

**Steps:**

1. Sign in
2. Navigate to `/sign-in` directly
3. Observe behavior

**Expected Results:**

- ✅ Redirects to `/chat`
- ✅ No need to sign in again

---

### Test 13: Missing Environment Variables ⚠️

**Steps:**

1. Remove `NEXT_PUBLIC_STACK_PROJECT_ID` from `.env.local`
2. Restart dev server
3. Navigate to `/sign-in`

**Expected Results:**

- ✅ Console warning about missing credentials
- ✅ Auth provider shows warning or fails gracefully
- ✅ No app crash

---

### Test 14: Database Connection Failure 🔌

**Steps:**

1. Stop database (or use invalid DATABASE_URL)
2. Try to sign in
3. Observe error handling

**Expected Results:**

- ✅ Shows user-friendly error
- ✅ Logs error to console
- ✅ Returns 500 status code
- ✅ Does not expose sensitive information

---

## Performance Testing

### Test 15: Auth Performance ⚡

**Steps:**

1. Open browser DevTools → Network tab
2. Sign out
3. Sign in and measure:
   - Time to redirect
   - API call durations
   - Time to load protected route

**Expected Results:**

- ✅ Sign-in completes in < 2 seconds
- ✅ Protected route loads in < 1 second
- ✅ No unnecessary API calls

---

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Test Results Template

```
# Test Results - [Date]

## Environment
- Node.js: [version]
- Next.js: 15.5.4
- Browser: [browser + version]

## Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Sign Up Flow | ✅ Pass | |
| 2 | Sign In Flow | ✅ Pass | |
| 3 | Protected Routes | ✅ Pass | |
| 4 | Header User Menu | ✅ Pass | |
| 5 | Mobile UI | ✅ Pass | |
| 6 | Rate Limiting | ✅ Pass | |
| 7 | API Auth | ✅ Pass | |
| 8 | Redirect | ✅ Pass | |
| 9 | Session Persistence | ✅ Pass | |
| 10 | Sign Out | ✅ Pass | |
| 11 | Invalid Credentials | ✅ Pass | |
| 12 | Already Signed In | ✅ Pass | |
| 13 | Missing Env Vars | ✅ Pass | |
| 14 | DB Connection Fail | ✅ Pass | |
| 15 | Auth Performance | ✅ Pass | |

## Issues Found
- None

## Recommendations
- None
```

---

## Automated Testing (Future)

For automated testing, consider:

```typescript
// __tests__/auth.test.ts
describe("Authentication Flow", () => {
  it("should redirect unauthenticated users to sign-in", async () => {
    // Test implementation
  });

  it("should allow authenticated users to access protected routes", async () => {
    // Test implementation
  });

  it("should enforce rate limits", async () => {
    // Test implementation
  });
});
```

---

## Quick Smoke Test (5 minutes)

Minimal test to verify auth is working:

1. ✅ Sign up with new account
2. ✅ Verify user appears in header
3. ✅ Sign out
4. ✅ Sign in with same account
5. ✅ Access `/chat` page
6. ✅ Scan a contract
7. ✅ Sign out

If all steps pass, authentication is working! 🎉

---

**Last Updated**: 2025-10-08  
**Version**: 1.0  
**Status**: Ready for Testing
