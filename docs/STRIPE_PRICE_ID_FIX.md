# 🔧 Stripe Price ID Fix

## The Problem

You're using a **Product ID** instead of a **Price ID**.

**Error:**

```
No such price: 'prod_TCM7QoEEKfs765'
```

**Why it fails:** `prod_TCM7QoEEKfs765` is a Product ID, but Stripe checkout needs a Price ID.

---

## The Solution

### Step-by-Step Fix

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/test/products

2. **Click on "ContractGuard Pro" product**

3. **Find the Pricing section** (scroll down)

4. **Copy the correct ID:**

   You'll see something like this:

   ```
   ┌─────────────────────────────────────┐
   │ Pricing                             │
   ├─────────────────────────────────────┤
   │ $29.00 / month                      │
   │ API ID: price_1ABC2CD3EF4GH5IJ6     │ ← COPY THIS!
   └─────────────────────────────────────┘
   ```

   **NOT** this (at the top of the page):

   ```
   Product ID: prod_TCM7QoEEKfs765  ❌ Wrong!
   ```

5. **Update `.env.local`:**

   ```env
   STRIPE_PRO_MONTHLY_PRICE_ID=price_1ABC2CD3EF4GH5IJ6
   ```

6. **Repeat for Enterprise:**
   - Click on your Enterprise product
   - Copy the **Price ID** (starts with `price_`)
   - Update `.env.local`:
     ```env
     STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID
     ```

7. **Restart dev server:**

   ```bash
   npm run dev
   ```

8. **Test again!**

---

## Visual Guide

### ✅ CORRECT - Price ID

```
In Stripe Dashboard, look for:

Product Details
  └── Pricing section
      └── $29.00 / month
          └── API ID: price_1ABC...  ← Use this!
```

### ❌ WRONG - Product ID

```
Don't use this:

Product Details
  ├── Product ID: prod_ABC...  ← Don't use this!
```

---

## Quick Verification

**Correct Price IDs:**

- Start with: `price_`
- Example: `price_1ABCD2EF3GH4IJ5KL6MN`
- Length: ~30 characters

**Wrong Product IDs:**

- Start with: `prod_`
- Example: `prod_ABC123DEF456`
- This won't work for checkout!

---

## After You Fix It

Your checkout flow should work:

1. Click "Go Pro" → Redirects to Stripe checkout ✅
2. Enter test card → Payment processes ✅
3. Redirect back → Shows success message ✅
4. Account page → Shows "Pro Tier" ✅

---

**Still stuck?** Share your `.env.local` Stripe section (with keys redacted) and I'll help debug!
