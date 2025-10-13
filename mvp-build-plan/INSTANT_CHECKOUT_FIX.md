# Instant Checkout Fix - Missing Stripe Price IDs

## Problem

The instant checkout is failing with "Checkout failed" error because the Stripe Price IDs for instant report packages are not configured in environment variables.

## Solution

Follow these steps to create the Stripe products and configure environment variables:

### Step 1: Create Stripe Products (Test Mode)

1. Go to https://dashboard.stripe.com/products
2. Make sure you're in **Test mode** (toggle in top-right)
3. Create 3 products for instant reports:

#### Product 1: 1 Report - $4.99

- Click **"+ Create product"**
- Name: `ContractGuard - 1 Report`
- Description: `One-time instant contract audit report`
- Pricing:
  - **One-time** (not recurring)
  - Price: `$4.99 USD`
- Save product
- **Copy the Price ID** (starts with `price_`)

#### Product 2: 3 Reports - $9.99

- Click **"+ Create product"**
- Name: `ContractGuard - 3 Reports`
- Description: `Three instant contract audit reports (33% off)`
- Pricing:
  - **One-time**
  - Price: `$9.99 USD`
- Save product
- **Copy the Price ID**

#### Product 3: 5 Reports - $14.99

- Click **"+ Create product"**
- Name: `ContractGuard - 5 Reports`
- Description: `Five instant contract audit reports (40% off)`
- Pricing:
  - **One-time**
  - Price: `$14.99 USD`
- Save product
- **Copy the Price ID**

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Instant Report Price IDs (REQUIRED for instant checkout)
STRIPE_PRICE_INSTANT_1=price_xxxxxxxxxxxxx  # Replace with actual price ID for 1 report
STRIPE_PRICE_INSTANT_3=price_xxxxxxxxxxxxx  # Replace with actual price ID for 3 reports
STRIPE_PRICE_INSTANT_5=price_xxxxxxxxxxxxx  # Replace with actual price ID for 5 reports
```

### Step 3: Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the Instant Checkout

1. Go to http://localhost:3000/pricing
2. Switch to "Instant Reports" tab
3. Click "Buy Now" on any package
4. You should be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete the payment

## Quick Copy Template

After creating your Stripe products, copy this template and fill in your price IDs:

```bash
# Add to .env.local
STRIPE_PRICE_INSTANT_1=price_
STRIPE_PRICE_INSTANT_3=price_
STRIPE_PRICE_INSTANT_5=price_
```

## Verification

To verify the fix worked:

1. Open browser console (F12)
2. Try instant checkout again
3. You should see checkout redirect instead of error
4. Check Network tab for `/api/checkout/instant` - should return status 200

## For Subscriptions

If you also need to set up subscriptions (Pro and Team plans), create these additional products:

```bash
STRIPE_PRICE_PRO_MONTHLY=price_xxx   # $29/month recurring
STRIPE_PRICE_TEAM_MONTHLY=price_xxx  # $99/month recurring
```

See `docs/STRIPE_SETUP.md` for complete subscription setup instructions.

## Troubleshooting

### Still getting "Checkout failed"?

1. Check the browser console for detailed error message
2. Verify the price IDs are correct (start with `price_`)
3. Make sure you restarted the dev server after adding env vars
4. Check that Stripe is in Test mode
5. Verify `STRIPE_SECRET_KEY` is also set in `.env.local`

### Price IDs not working?

- Make sure products are **One-time** payments, not recurring
- Verify the currency is USD
- Check products are active in Stripe Dashboard
- Copy the **Price ID** not the Product ID

## Next Steps

Once instant checkout works:

1. Set up webhook handling for payment confirmations
2. Create live mode products for production
3. Test the full purchase → credit delivery flow

---

**Related Docs:**

- Full Stripe setup: `docs/STRIPE_SETUP.md`
- Environment variables: `docs/ENV_VARIABLES.md`
