# 🔧 Webhook Troubleshooting Guide

## Problem: Subscription Created But User Not Upgraded

**Symptoms:**

- Payment completed successfully
- `stripeCustomerId` is set in database
- BUT: `stripeSubscriptionId` is null
- AND: `tier` is still "free"

**Root Cause:** Webhooks were not received by your application

---

## Solution: Start Stripe CLI

### Step 1: Open a NEW Terminal Window

Don't close your dev server - open a **separate terminal**.

### Step 2: Start Webhook Forwarding

```bash
cd /Users/kaapo-studio/Documents/Projects/contractguard-ai

# Login (if you haven't already)
stripe login

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**You should see:**

```
> Ready! Your webhook signing secret is whsec_abc123...
```

### Step 3: Update .env.local

Copy the webhook secret and add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### Step 4: Restart Dev Server

In your **original terminal** (where dev server is running):

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### Step 5: Try Payment Again

Now when you complete a payment, you should see webhook events in the Stripe CLI terminal:

```
→ checkout.session.completed
→ customer.subscription.created
→ invoice.payment_succeeded
```

And your user should be upgraded to Pro! ✅

---

## Quick Fix for Current Subscription

If you already paid and want to activate your Pro subscription immediately:

### Option 1: Use Fix Script (Recommended)

1. **Get your Subscription ID from Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/subscriptions
   - Find your subscription
   - Copy the ID (starts with `sub_...`)

2. **Run the fix script:**

   ```bash
   npx tsx scripts/fix-subscription.ts 1 sub_YOUR_SUBSCRIPTION_ID pro
   ```

   This will immediately upgrade you to Pro!

### Option 2: Manual Database Update

1. **Open Drizzle Studio:**

   ```bash
   npm run db:studio
   ```

2. **Find your user** (ID: 1, email: neorimia@gmail.com)

3. **Update these fields:**
   - `tier`: Change from "free" to "pro"
   - `stripeSubscriptionId`: Add your `sub_...` ID from Stripe
   - `subscriptionStatus`: Set to "active"

4. **Save changes**

5. **Refresh your account page** - should show Pro tier!

---

## Prevent This in the Future

**Always have Stripe CLI running when testing payments:**

```bash
Terminal 1: npm run dev              # Dev server
Terminal 2: stripe listen --forward  # Webhook forwarding
```

Both need to be running simultaneously!

---

## Verification Checklist

After fixing, verify:

- [ ] Stripe CLI shows: `> Ready! Listening...`
- [ ] Dev server is running
- [ ] Complete a new test payment
- [ ] See webhook events in Stripe CLI
- [ ] User tier updates to "pro" automatically
- [ ] Account page shows Pro tier
- [ ] Unlimited scans available

---

## Common Webhook Issues

### Issue: "Webhook signature verification failed"

**Solution:**

- Get new secret from `stripe listen` output
- Update `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Restart dev server

### Issue: "No webhook events showing"

**Solution:**

- Verify `stripe listen` is running
- Check the URL: `localhost:3000/api/stripe/webhook`
- Restart both dev server and Stripe CLI

### Issue: Events received but tier not updating

**Solution:**

- Check server console logs for errors
- Verify webhook handler code is correct
- Check database connection

---

## Quick Test

To test if webhooks are working **without** making a payment:

```bash
# In terminal (with Stripe CLI running)
stripe trigger customer.subscription.created
```

Check your server logs - should see the webhook being processed!

---

**Need immediate help?** Run the fix script to manually upgrade your account!
