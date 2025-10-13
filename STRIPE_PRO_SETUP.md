# Quick Fix: Create Pro Subscription in Stripe

## Problem

Your Pro subscription checkout is failing because `STRIPE_PRICE_PRO_MONTHLY` is not set to a real Stripe Price ID.

## Solution (5 minutes)

### Step 1: Create Pro Subscription Product

1. **Go to Stripe Dashboard** → [Products](https://dashboard.stripe.com/test/products)
2. **Click "Add product"**
3. **Fill in the details**:

   ```
   Name: ContractGuard Pro Monthly
   Description: Unlimited scans with advanced AI features

   Pricing:
   - Price: $29.00 USD
   - Billing period: Monthly
   - Payment type: Recurring
   ```

4. **Click "Add product"**

### Step 2: Copy the Price ID

After creating the product, you'll see a **Price ID** that looks like:

```
price_1ABcdEFghIJklMNopQRsTUvw
```

### Step 3: Update .env.local

Replace the placeholder in your `.env.local` file:

```bash
# Before (broken):
STRIPE_PRICE_PRO_MONTHLY=price_YOUR_PRO_PRICE_ID_HERE

# After (working):
STRIPE_PRICE_PRO_MONTHLY=price_1ABcdEFghIJklMNopQRsTUvw
```

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

### Step 5: Test Pro Subscription

1. Go to http://localhost:3000/pricing
2. Click "Get Started" on Pro plan
3. You should see the Stripe checkout page (no error!)

## Alternative: Use Team Price for Testing

If you don't want to create a new product right now, you can temporarily use the Team price for both:

```bash
# Temporary workaround:
STRIPE_PRICE_PRO_MONTHLY=price_1SFxRqJoEQJBiTnnjcBovcY0  # Same as Team
```

This will let you test the flow, but both Pro and Team will be $99/month.

## Verify Configuration

Run this command to check all Stripe prices:

```bash
npx tsx scripts/check-stripe-config.ts
```

## What This Fixes

- ✅ Pro subscription checkout works
- ✅ Users can subscribe to $29/month plan
- ✅ No more "empty string for price" errors
- ✅ Webhook handling for Pro subscriptions

## Production Note

Remember to create the **production** product in Stripe and update your production environment variables before launching!

---

**Need Help?** Check `docs/STRIPE_SETUP.md` for full Stripe configuration guide.
