# Stripe Integration - Testing Guide

Complete guide for testing the Stripe payment integration locally and in production.

## Prerequisites

✅ Backend Stripe integration complete  
✅ Frontend integration complete  
✅ Environment variables configured  
✅ Stripe products created

---

## Local Testing Setup

### Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Step 2: Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate with Stripe.

### Step 3: Start Webhook Forwarding

```bash
# In a new terminal window
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Important:** Copy the webhook signing secret (whsec\_...) and add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 4: Start Development Server

```bash
# In your main terminal
npm run dev
```

You should now have:

- ✅ Dev server running on http://localhost:3000
- ✅ Stripe CLI forwarding webhooks
- ✅ Webhook secret configured

---

## Testing Scenarios

### Scenario 1: Free User → Pro Subscription

**Test Flow:**

1. **Sign Up/Login:**

   ```
   Go to: http://localhost:3000/sign-up
   Create account or login
   ```

2. **Navigate to Pricing:**

   ```
   Go to: http://localhost:3000/pricing
   Click "Go Pro" button
   ```

3. **Complete Checkout:**
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
   - Click "Subscribe"

4. **Verify Success:**
   - Should redirect to: `/account?session_id=...&success=true`
   - Success message should appear
   - Plan should show "Pro Tier"
   - "Manage Subscription" button should be visible

5. **Check Webhook Events:**

   ```
   In Stripe CLI terminal, you should see:
   ✓ checkout.session.completed
   ✓ customer.subscription.created
   ✓ invoice.payment_succeeded
   ```

6. **Verify Database:**
   ```bash
   npm run db:studio
   # Check users table:
   # - tier should be "pro"
   # - stripeCustomerId should be set
   # - stripeSubscriptionId should be set
   # - subscriptionStatus should be "active"
   ```

**Expected Result:** ✅ User upgraded to Pro tier successfully

---

### Scenario 2: Subscription Management

**Test Flow:**

1. **Go to Account Page:**

   ```
   http://localhost:3000/account
   Verify "Manage Subscription" button is visible
   ```

2. **Click Manage Subscription:**
   - Should redirect to Stripe Customer Portal
   - Should show subscription details
   - Should show payment method

3. **Test Actions:**
   - Update payment method
   - View invoice history
   - Cancel subscription

4. **Test Cancellation:**
   - Click "Cancel plan"
   - Choose "Cancel at end of period" or "Cancel immediately"
   - Confirm cancellation

5. **Verify Webhook:**

   ```
   Stripe CLI should show:
   ✓ customer.subscription.updated (if cancel at period end)
   ✓ customer.subscription.deleted (if cancel immediately)
   ```

6. **Verify Database:**
   - If canceled immediately: tier should return to "free"
   - If canceled at period end: tier stays "pro" until period ends

**Expected Result:** ✅ Subscription management working correctly

---

### Scenario 3: Failed Payment

**Test Flow:**

1. **Create Subscription with Failing Card:**
   - Use test card: `4000 0000 0000 0341` (requires authentication, fails)
   - Or: `4000 0000 0000 0002` (card declined)

2. **Verify Handling:**
   - Error message should appear
   - User should NOT be upgraded
   - Database tier should remain "free"

**Expected Result:** ✅ Failed payments handled gracefully

---

### Scenario 4: 3D Secure Authentication

**Test Flow:**

1. **Use 3D Secure Card:**
   - Test card: `4000 0025 0000 3155`
   - Complete checkout
   - Should trigger authentication modal
   - Complete authentication

2. **Verify:**
   - Payment should succeed after authentication
   - User should be upgraded
   - All webhooks should fire

**Expected Result:** ✅ 3D Secure authentication working

---

### Scenario 5: Promotional Codes

**Test Flow:**

1. **Create Test Coupon in Stripe Dashboard:**
   - Go to: Products → Coupons
   - Create: 50% off for 3 months
   - Code: `LAUNCH50`

2. **Test Code:**
   - Start checkout flow
   - Enter promotional code
   - Verify discount applied
   - Complete payment

**Expected Result:** ✅ Promotional codes working

---

## Webhook Testing

### Test Individual Webhooks

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted

# Test successful payment
stripe trigger invoice.payment_succeeded

# Test failed payment
stripe trigger invoice.payment_failed
```

### Monitor Webhook Events

```bash
# Watch webhook events in real-time
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-json
```

### Check Webhook Logs

```
In Stripe CLI output, look for:
✓ 200 OK - Event processed successfully
✗ 500 Error - Check server logs
```

---

## Test Cards

| Scenario                 | Card Number           | Expected Result              |
| ------------------------ | --------------------- | ---------------------------- |
| **Success**              | `4242 4242 4242 4242` | Payment succeeds             |
| **Declined**             | `4000 0000 0000 0002` | Card declined                |
| **Insufficient Funds**   | `4000 0000 0000 9995` | Insufficient funds error     |
| **Expired Card**         | `4000 0000 0000 0069` | Expired card error           |
| **Processing Error**     | `4000 0000 0000 0119` | Processing error             |
| **3D Secure**            | `4000 0025 0000 3155` | Requires authentication      |
| **3D Secure (Declined)** | `4000 0000 0000 3220` | Auth required, then declined |

---

## Debugging

### Check Application Logs

```bash
# In your dev server terminal, look for:
✓ Checkout session created: cs_...
✓ Customer created: cus_...
✓ Webhook received: checkout.session.completed
✓ User upgraded to pro: user ID 123
```

### Check Stripe Dashboard

1. **Payments:**
   - https://dashboard.stripe.com/test/payments
   - Verify payment status

2. **Customers:**
   - https://dashboard.stripe.com/test/customers
   - Verify customer created
   - Check email matches user

3. **Subscriptions:**
   - https://dashboard.stripe.com/test/subscriptions
   - Verify subscription active
   - Check billing cycle

4. **Webhooks:**
   - https://dashboard.stripe.com/test/webhooks
   - Click your webhook endpoint
   - View event delivery logs
   - Check for failed events

### Check Database

```bash
npm run db:studio
```

Verify in `users` table:

- `stripeCustomerId` is set (cus\_...)
- `stripeSubscriptionId` is set (sub\_...)
- `tier` is "pro"
- `subscriptionStatus` is "active"

---

## Common Issues & Solutions

### Issue: Webhook signature verification fails

**Symptoms:**

```
Error: Webhook signature verification failed
```

**Solution:**

1. Check `STRIPE_WEBHOOK_SECRET` in `.env.local`
2. Restart Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Update webhook secret with new value
4. Restart dev server

### Issue: Checkout session not creating

**Symptoms:**

```
Failed to create checkout session
```

**Solution:**

1. Check `STRIPE_SECRET_KEY` is set correctly
2. Verify Price IDs are correct
3. Check console logs for specific error
4. Verify user is authenticated

### Issue: User not upgraded after payment

**Symptoms:**

- Payment succeeds
- Tier remains "free"

**Solution:**

1. Check Stripe CLI is running (webhooks must be received)
2. Verify webhook events in terminal
3. Check server logs for webhook processing errors
4. Manually check database for `stripeSubscriptionId`

### Issue: Portal session not opening

**Symptoms:**

```
Failed to create portal session
```

**Solution:**

1. Verify user has `stripeCustomerId` in database
2. Check customer exists in Stripe Dashboard
3. Ensure portal is enabled in Stripe settings:
   - Dashboard → Settings → Customer portal
   - Toggle "Enable customer portal"

---

## Manual Verification Checklist

After completing a test transaction:

- [ ] User upgraded to correct tier in database
- [ ] `stripeCustomerId` populated
- [ ] `stripeSubscriptionId` populated
- [ ] `subscriptionStatus` is "active"
- [ ] Subscription visible in Stripe Dashboard
- [ ] Customer visible in Stripe Dashboard
- [ ] Payment recorded in Stripe Dashboard
- [ ] Webhook events received (3-4 events)
- [ ] Success message displayed to user
- [ ] Manage subscription button works
- [ ] Customer portal opens correctly

---

## Production Testing

### Before Going Live

1. **Switch to Live Mode:**

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Create Live Webhook:**
   - Dashboard → Webhooks
   - Add endpoint: https://your-domain.com/api/stripe/webhook
   - Copy signing secret
   - Update `STRIPE_WEBHOOK_SECRET`

3. **Test with Real Card:**
   - Use your own card (will be charged!)
   - Complete checkout
   - Verify subscription created
   - Immediately cancel to avoid ongoing charges

4. **Monitor Webhooks:**
   - Dashboard → Webhooks → Your endpoint
   - Check delivery status
   - View event logs

---

## Test Script

For automated testing, run:

```bash
# Start dev server
npm run dev &

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook &

# Run integration tests
# TODO: Create automated test script
```

---

## Performance Benchmarks

Expected timings:

- Checkout session creation: < 1s
- Stripe checkout page load: < 2s
- Webhook processing: < 500ms
- Portal session creation: < 1s
- Database update: < 200ms

---

## Security Checklist

- [ ] Webhook signatures verified
- [ ] HTTPS in production
- [ ] API keys in environment variables (not hardcoded)
- [ ] User authentication on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive data

---

## Support Resources

- **Stripe Testing:** https://stripe.com/docs/testing
- **Test Cards:** https://stripe.com/docs/testing#cards
- **Webhooks:** https://stripe.com/docs/webhooks/test
- **Customer Portal:** https://stripe.com/docs/billing/subscriptions/integrating-customer-portal
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark integration as complete
2. Deploy to staging environment
3. Test with real payment (and cancel)
4. Deploy to production
5. Monitor for 24 hours
6. Announce payment availability to users

---

**Last Updated:** January 8, 2025  
**Status:** Ready for Testing  
**Estimated Testing Time:** 2-3 hours
