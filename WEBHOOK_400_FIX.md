# 🔧 Webhook 400 Error Fix

## Problem

Your Stripe CLI shows all webhooks returning **400 errors**:

```
<-- [400] POST http://localhost:3000/api/stripe/webhook
```

This means the webhook signature verification is **failing**.

---

## Solution: Update Webhook Secret

### Step 1: Get the Correct Webhook Secret

In your Stripe CLI terminal, you should see at the top:

```
> Ready! Your webhook signing secret is whsec_abc123def456ghi789...
```

**Copy that entire `whsec_...` string**

### Step 2: Update .env.local

Open your `.env.local` file and **update or add**:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123def456ghi789...
```

Make sure to use the **exact** secret from the Stripe CLI output.

### Step 3: Restart Dev Server

```bash
# In your dev server terminal
# Press Ctrl+C
# Then restart:
npm run dev
```

### Step 4: Test Webhook

In the Stripe CLI terminal, you should now see:

```
→ checkout.session.completed
<-- [200] POST http://localhost:3000/api/stripe/webhook  ✅
```

**200 = Success!** (not 400)

---

## Quick Test

To verify webhooks work:

```bash
stripe trigger checkout.session.completed
```

Watch the Stripe CLI output - should show `[200]` not `[400]`.

---

## Why This Happens

Stripe signs every webhook with a secret to prevent tampering. Your app verifies this signature using `STRIPE_WEBHOOK_SECRET`.

**If the secret doesn't match:**

- ❌ Signature verification fails
- ❌ Returns 400 error
- ❌ Webhook not processed
- ❌ Database not updated

**When the secret matches:**

- ✅ Signature verified
- ✅ Returns 200 success
- ✅ Webhook processed
- ✅ Database updated

---

## After Fixing

1. ✅ Webhooks will return `200 OK`
2. ✅ Subscription events will process
3. ✅ User tier will upgrade automatically
4. ✅ No manual fixes needed

---

**Then retry your payment and it should work!** 🚀
