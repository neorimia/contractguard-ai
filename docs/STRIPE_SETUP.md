# Stripe Integration Setup Guide

Complete guide for setting up Stripe payment integration in ContractGuard AI.

## Prerequisites

- Stripe account ([create one here](https://dashboard.stripe.com/register))
- Access to Stripe Dashboard
- ContractGuard AI running locally or deployed

## Step 1: Create Stripe Products

### A. In Stripe Dashboard

1. Go to [Products](https://dashboard.stripe.com/products)
2. Click **"+ Create product"**

### Pro Monthly Product

- **Name:** ContractGuard Pro
- **Description:** Unlimited scans with advanced features
- **Pricing:**
  - Model: Recurring
  - Price: $29.00 USD
  - Billing period: Monthly
  - Currency: USD
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_...`)

### Enterprise Monthly Product

- **Name:** ContractGuard Enterprise
- **Description:** Unlimited scans, API access, and white-label options
- **Pricing:**
  - Model: Recurring
  - Price: $199.00 USD
  - Billing period: Monthly
  - Currency: USD
- Click **"Save product"**
- **Copy the Price ID** (starts with `price_...`)

## Step 2: Get API Keys

### Test Mode Keys (for development)

1. Go to [API Keys](https://dashboard.stripe.com/test/apikeys)
2. Ensure you're in **Test mode** (toggle in top right)
3. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### Live Mode Keys (for production)

1. Switch to **Live mode**
2. Go to [API Keys](https://dashboard.stripe.com/apikeys)
3. Copy:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

## Step 3: Configure Webhooks

Webhooks are critical for handling subscription events.

### Development (Local)

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Login to Stripe
stripe login

# Forward webhook events to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will output a webhook signing secret (whsec_...)
# Copy it for your .env.local
```

### Production

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the Signing secret** (starts with `whsec_...`)

## Step 4: Environment Variables

Add these to your `.env.local` (development) and production environment:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...

# Site URL (for redirect URLs)
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # or your production URL
```

## Step 5: Test the Integration

### 1. Test Checkout Flow

```bash
# Start your development server
npm run dev

# In another terminal, start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

1. Navigate to `http://localhost:3000/pricing`
2. Click "Upgrade to Pro"
3. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. Complete checkout
5. Verify:
   - User tier upgraded to "pro" in database
   - Webhook events received
   - Subscription active in Stripe Dashboard

### 2. Test Subscription Management

1. Go to `http://localhost:3000/account`
2. Click "Manage Subscription"
3. Verify you can:
   - Update payment method
   - View invoices
   - Cancel subscription

### 3. Test Webhook Events

Monitor webhook events in real-time:

```bash
# In Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
```

## Step 6: Production Deployment

### Checklist

- [ ] Switch to Live mode in Stripe Dashboard
- [ ] Update environment variables with live keys
- [ ] Configure production webhook endpoint
- [ ] Test live payment flow with real card
- [ ] Set up email notifications for failed payments
- [ ] Configure tax rates (if applicable)
- [ ] Enable customer portal in Stripe settings

### Important Notes

1. **Never commit Stripe keys** to version control
2. **Use test mode** during development
3. **Monitor webhooks** in production for failures
4. **Set up alerts** for failed payments
5. **Keep webhook signing secret** secure

## Stripe Test Cards

For testing different scenarios:

| Scenario           | Card Number           | Description             |
| ------------------ | --------------------- | ----------------------- |
| Success            | `4242 4242 4242 4242` | Payment succeeds        |
| Decline            | `4000 0000 0000 0002` | Card declined           |
| Insufficient funds | `4000 0000 0000 9995` | Insufficient funds      |
| 3D Secure          | `4000 0025 0000 3155` | Requires authentication |

## Common Issues

### Webhook signature verification fails

**Problem:** `Webhook signature verification failed`

**Solution:**

- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
- Use `stripe listen` for local development
- Check webhook endpoint URL is correct

### Payment succeeds but user not upgraded

**Problem:** Subscription created but tier not updated

**Solution:**

- Check webhook events are being received
- Verify `handleSubscriptionCreated` is working
- Check database for subscription ID
- Review webhook logs in Stripe Dashboard

### Customer portal not working

**Problem:** Portal session creation fails

**Solution:**

- Ensure user has `stripeCustomerId` in database
- Check customer exists in Stripe
- Verify `STRIPE_SECRET_KEY` is correct

## Monitoring

### Stripe Dashboard

Monitor key metrics:

1. [Payments](https://dashboard.stripe.com/payments)
2. [Subscriptions](https://dashboard.stripe.com/subscriptions)
3. [Customers](https://dashboard.stripe.com/customers)
4. [Webhooks](https://dashboard.stripe.com/webhooks)

### Application Logs

Monitor these logs:

- Checkout session creation
- Webhook event processing
- Subscription updates
- Failed payments

## Security Best Practices

1. **Validate webhook signatures** - Always verify webhook events
2. **Use environment variables** - Never hardcode API keys
3. **Implement rate limiting** - Protect checkout endpoints
4. **Log webhook events** - For debugging and audit trails
5. **Handle idempotency** - Stripe webhooks may retry

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhook Events](https://stripe.com/docs/webhooks)

## Next Steps

After Stripe is working:

1. Set up email notifications for payment events
2. Implement invoice PDF generation
3. Add usage-based billing (optional)
4. Configure tax calculation
5. Set up Stripe Radar for fraud prevention

---

**Last Updated:** 2025-01-08  
**Stripe API Version:** 2024-12-18.acacia
