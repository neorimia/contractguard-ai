# ✅ Stripe Setup Checklist - Quick Fix Guide

## Current Issues & Solutions

### ❌ Issue 1: "No such price: 'prod_TCM7QoEEKfs765'"

**Problem:** Using Product ID instead of Price ID  
**Status:** Needs your action

### ✅ Issue 2: Profile endpoint 500 error

**Problem:** Wrong authentication method  
**Status:** FIXED ✅

---

## What You Need to Do (5 minutes)

### Step 1: Get the Correct Price IDs

1. **Go to:** https://dashboard.stripe.com/test/products

2. **Click on your "ContractGuard Pro" product**

3. **Scroll down to find the "Pricing" section** - you'll see:

   ```
   ┌──────────────────────────────┐
   │ Pricing                      │
   │                              │
   │ $29.00 USD per month         │
   │ API ID: price_1ABC...        │ ← COPY THIS!
   │                              │
   └──────────────────────────────┘
   ```

4. **Copy the API ID** (starts with `price_`, NOT `prod_`)

5. **Repeat for Enterprise product** if you created one

### Step 2: Update .env.local

Open your `.env.local` file and **update** (or add) these lines:

```env
# Replace these with your ACTUAL Price IDs from Stripe Dashboard
STRIPE_PRO_MONTHLY=price_YOUR_ACTUAL_PRICE_ID_HERE
STRIPE_ENTERPRISE_MONTHLY_=price_YOUR_ACTUAL_PRICE_ID_HERE
```

**Example of what it should look like:**

```env
STRIPE_PRO_MONTHLY=price_1QRST2UVW3XYZ4ABC5DEF6GHI
STRIPE_ENTERPRISE_MONTHLY=price_1JKLMN2OPQ3RST4UVW5XYZ6ABC
```

### Step 3: Restart Dev Server

```bash
# In your terminal, stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Again

1. **Make sure you're logged in:** http://localhost:3000/sign-in
2. **Go to pricing:** http://localhost:3000/pricing
3. **Click "Go Pro"**
4. **Should redirect to Stripe checkout!** ✅

---

## Complete .env.local Example

Here's what your Stripe section should look like:

```env
# Stripe API Keys (from: https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_51ABC123DEF456...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123DEF456...

# Webhook Secret (from: stripe listen command)
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...

# Price IDs (from: https://dashboard.stripe.com/test/products)
# Click on product → Scroll to Pricing → Copy API ID
STRIPE_PRO_MONTHLY=price_1ABC2CD3EF4GH5IJ6KL  # Pro: $29/mo
STRIPE_ENTERPRISE_MONTHLY=price_1MNO2PQ3RS4TU5VW6XY  # Enterprise: $199/mo

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## How to Find the Price ID (Visual Guide)

### ✅ CORRECT Location

```
Stripe Dashboard
  → Products
    → Click "ContractGuard Pro"
      → Scroll down to "Pricing" section
        → See: $29.00 USD per month
          → API ID: price_1ABC...  ← THIS ONE!
```

### ❌ WRONG Location

```
Product details page (top)
  → Product ID: prod_ABC...  ← NOT this one!
```

---

## Testing Checklist

Once you've updated the Price IDs:

- [ ] Price IDs start with `price_` (not `prod_`)
- [ ] Added to `.env.local`
- [ ] Dev server restarted
- [ ] Logged into the app
- [ ] Click "Go Pro" on pricing page
- [ ] Redirected to Stripe checkout page ✅
- [ ] Can complete test payment
- [ ] Redirected back with success message
- [ ] Account page shows "Pro Tier"

---

## Quick Troubleshooting

**Still getting "No such price" error?**
→ Double-check the Price ID is correct in `.env.local`
→ Make sure it starts with `price_` not `prod_`
→ Restart dev server

**Getting "Unauthorized"?**
→ You need to be logged in
→ Go to `/sign-in` first

**Checkout page looks weird?**
→ That's normal for test mode
→ Use test card: `4242 4242 4242 4242`

---

## After It Works

Once checkout works, test:

1. Complete a test payment
2. Check account page shows "Pro"
3. Click "Manage Subscription"
4. Verify portal opens
5. Test cancellation

Then you're ready for production! 🚀

---

**Need help?** Check the detailed guide: `STRIPE_TESTING_GUIDE.md`
