# Starter Plan Setup Guide

## Overview

The Starter Plan has been successfully integrated into ContractGuard AI's pricing structure. This guide covers the setup requirements and configuration needed to activate the new plan.

## New Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Starter Plan Stripe Configuration
STRIPE_STARTER_MONTHLY=price_starter_monthly_xxxxx

# Existing Stripe Configuration (verify these are set)
STRIPE_PRO_MONTHLY=price_pro_monthly_xxxxx
STRIPE_TEAM_MONTHLY=price_team_monthly_xxxxx
STRIPE_ENTERPRISE_MONTHLY=price_enterprise_monthly_xxxxx
```

## Stripe Dashboard Setup

### 1. Create Starter Plan Product

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Configure the product:
   - **Name**: "ContractGuard Starter Plan"
   - **Description**: "30 AI audits per month with overage pricing"
   - **Pricing Model**: Recurring
   - **Price**: $14.00 USD
   - **Billing Period**: Monthly
4. Copy the Price ID and add to `STRIPE_STARTER_MONTHLY_PRICE_ID`

### 2. Verify Existing Products

Ensure these products exist in your Stripe dashboard:

- **Pro Plan**: $29/month
- **Team Plan**: $99/month
- **Enterprise Plan**: Custom pricing

## Configuration Files Updated

### ✅ Pricing Configuration (`lib/config/pricing.ts`)

- Added Starter plan with 30 monthly credits
- Set overage price to $0.30 per extra scan
- Updated type definitions to include starter tier

### ✅ Tier Limits (`lib/config/tier-limits.ts`)

- Added starter tier with monthly credit limits
- Created `getMonthlyTierLimit()` function
- Maintained backward compatibility

### ✅ Stripe Service (`lib/services/stripe.service.ts`)

- Added `STARTER_MONTHLY` to `STRIPE_PRICES`
- Updated price ID mapping

### ✅ Webhook Handler (`app/api/stripe/webhook/route.ts`)

- Updated `determineTierFromSubscription()` to recognize starter tier
- Added proper tier mapping for subscription events

### ✅ Auth Service (`lib/services/auth.service.ts`)

- Updated `checkScanLimit()` to handle monthly limits for subscription plans
- Added `checkMonthlyScanLimit()` method
- Modified `incrementScanCount()` to skip daily tracking for subscriptions

### ✅ Usage Tracking (`lib/usage/checkCredits.ts`)

- Created new usage checking logic for monthly credits
- Added overage pricing support
- Ready for Stripe integration

## Testing the Starter Plan

### 1. Test Subscription Flow

```bash
# Start the development server
npm run dev

# Navigate to pricing page
# Click "Subscribe to Starter" button
# Complete Stripe checkout
# Verify user tier is updated to "starter"
```

### 2. Test Usage Limits

```typescript
// Test monthly credit checking
import { canScan } from "@/lib/usage/checkCredits";

const user = { id: 123, plan: "starter" };
const result = await canScan(user);

console.log(result);
// Expected: { allowed: true, scansRemaining: 30, ... }
```

### 3. Test Overage Pricing

When a user exceeds their monthly limit:

- System should allow additional scans
- Overage price should be $0.30 per scan
- Stripe should be charged for overage (TODO: implement)

## Database Considerations

### Current State

- Usage tracking is simplified (assumes unlimited for subscription users)
- No `user_id` column in `audits` table
- Daily limits still apply to free tier users

### Future Improvements

To implement proper usage tracking, consider:

1. **Add user_id to audits table**:

```sql
ALTER TABLE audits ADD COLUMN user_id INTEGER REFERENCES users(id);
```

2. **Create user_scans table**:

```sql
CREATE TABLE user_scans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  contract_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Pricing Structure Summary

| Plan    | Price | Monthly Credits | Overage Price | Features                   |
| ------- | ----- | --------------- | ------------- | -------------------------- |
| Free    | $0    | 3/day           | N/A           | Basic scans                |
| Starter | $14   | 30              | $0.30         | Full AI audits, PDF export |
| Pro     | $29   | 150             | $0.25         | Advanced analysis, AI chat |
| Team    | $99   | 1000            | $0.10         | API access, multi-user     |

## Next Steps

1. **Set up Stripe products** in dashboard
2. **Add environment variables** to `.env.local`
3. **Test subscription flow** end-to-end
4. **Implement proper usage tracking** (optional)
5. **Set up overage billing** (optional)

## Troubleshooting

### Common Issues

1. **"Subscription not configured" error**
   - Check that `STRIPE_STARTER_MONTHLY_PRICE_ID` is set
   - Verify the price ID exists in Stripe dashboard

2. **User tier not updating**
   - Check webhook endpoint is configured in Stripe
   - Verify webhook events are being received

3. **Usage limits not working**
   - Check that user tier is correctly set to "starter"
   - Verify monthly credit logic is working

### Support

For issues with the Starter plan integration:

1. Check the console logs for errors
2. Verify all environment variables are set
3. Test with Stripe's webhook testing tool
4. Check database for user tier updates

---

**Status**: ✅ Ready for testing
**Last Updated**: December 19, 2024
