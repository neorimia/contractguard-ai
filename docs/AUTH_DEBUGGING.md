# Authentication Debugging Guide

## Issue: 401 Unauthorized on /api/audit

### What Changed

I've fixed the authentication integration with Stack Auth:

1. **Removed custom middleware** - Stack Auth handles authentication via its SDK
2. **Updated `/api/audit` route** - Now uses `stackServerApp.getUser()` directly
3. **Auto-sync users** - First-time users are automatically created in database

### How Stack Auth Works

Stack Auth uses **cookie-based JWT authentication**:

1. When you sign in, Stack Auth sets an HTTP-only cookie
2. The cookie contains a JWT token
3. API routes call `stackServerApp.getUser()` to verify the token
4. If valid, user info is returned; if not, returns `null`

### Debugging Steps

#### Step 1: Verify You're Signed In

1. Open http://localhost:3000
2. Check the header - do you see your profile icon/name?
3. Click the profile icon - do you see your email in the dropdown?

**If NO:** You need to sign in first!

- Go to http://localhost:3000/sign-in
- Sign in with your credentials
- You should be redirected to `/chat`

#### Step 2: Check Browser Cookies

1. Open Chrome DevTools (F12)
2. Go to "Application" tab → "Cookies" → http://localhost:3000
3. Look for a cookie from Stack Auth (usually `stack-session` or similar)

**If NO cookie found:**

- Sign out and sign in again
- Check Stack Auth credentials in `.env.local`
- Verify `NEXT_PUBLIC_STACK_PROJECT_ID` is set correctly

#### Step 3: Test API Directly

Open Chrome DevTools Console and run:

```javascript
// Test if you're authenticated
fetch("/api/audit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contractAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    chain: "ethereum",
  }),
})
  .then((r) => r.json())
  .then((d) => console.log("Response:", d))
  .catch((e) => console.error("Error:", e));
```

**Expected Results:**

- ✅ If signed in: Contract analysis data
- ❌ If not signed in: `{ error: "Unauthorized", message: "You must be logged in..." }`

#### Step 4: Check Server Logs

In your terminal where `npm run dev` is running, look for:

**Good signs:**

```
GET /api/audit 200
```

**Bad signs:**

```
GET /api/audit 401
Error: User not authenticated
```

### Common Issues & Fixes

#### Issue 1: "User not authenticated" even though I'm signed in

**Fix:**

1. Clear browser cookies
2. Sign out completely
3. Close all browser tabs
4. Sign in again
5. Try scanning again

#### Issue 2: Stack Auth not working

**Verify `.env.local` has:**

```bash
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_key
STACK_SECRET_SERVER_KEY=your_secret
```

**Then restart dev server:**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

#### Issue 3: Database errors

**Check database connection:**

```bash
# Open Drizzle Studio
npm run db:studio

# Verify users table exists
# Check if your user is in the database
```

If no users table exists:

```bash
npx drizzle-kit push
```

### Quick Test Flow

1. **Sign In**

   ```
   Visit: http://localhost:3000/sign-in
   Enter: your credentials
   ```

2. **Verify Auth State**

   ```
   Check: Header shows your profile icon
   Click: Profile icon → see dropdown
   ```

3. **Scan Contract**

   ```
   Visit: http://localhost:3000/chat
   Enter: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
   Click: Scan Contract
   ```

4. **Expected Flow**
   ```
   Loading... → Analysis Results
   NOT: 401 Unauthorized error
   ```

### What Happens Behind the Scenes

```
┌─────────────────────────────────────────┐
│  1. User signs in via Stack Auth       │
│  2. Stack Auth sets JWT cookie         │
│  3. Browser sends cookie with requests │
└────────────┬────────────────────────────┘
             │
             ↓ POST /api/audit (with cookie)
┌────────────────────────────────────────────┐
│  4. stackServerApp.getUser() reads cookie │
│  5. Verifies JWT token                    │
│  6. Returns user info or null             │
└────────────┬───────────────────────────────┘
             │
             ↓ if user exists
┌────────────────────────────────────────────┐
│  7. Check if user in our database         │
│  8. If not, create user record            │
│  9. Check rate limit                      │
│ 10. Process scan request                  │
│ 11. Return results                        │
└────────────────────────────────────────────┘
```

### Still Not Working?

1. **Restart dev server:**

   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

2. **Clear browser completely:**
   - Clear all cookies
   - Clear cache
   - Close all tabs
   - Reopen browser

3. **Verify environment variables:**

   ```bash
   # Check .env.local exists
   ls -la .env.local

   # Verify Stack Auth variables are set
   grep STACK .env.local
   ```

4. **Check Stack Auth dashboard:**
   - Visit https://app.stack-auth.com
   - Verify project exists
   - Check that localhost:3000 is in allowed domains

### Success Indicators

✅ Profile icon appears in header after sign-in  
✅ Dropdown shows your email  
✅ Can scan contracts without 401 errors  
✅ User record appears in database  
✅ Rate limiting works (3 scans, then error)

---

**Last Updated:** October 8, 2025  
**Status:** Authentication Fixed - Ready to Test
