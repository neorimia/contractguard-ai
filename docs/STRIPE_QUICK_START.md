# 🚀 Stripe Quick Start - Get Running in 5 Minutes

## What You Need to Do Right Now

### 1. Get Stripe Test Keys (2 minutes)

1. **Go to:** https://dashboard.stripe.com/register (create account if needed)
2. **Login** to Stripe Dashboard
3. **Switch to Test Mode** (toggle in top right corner)
4. **Go to:** https://dashboard.stripe.com/test/apikeys
5. **Copy these keys:**
   ```
   Secret key: sk_test_... (click "Reveal test key")
   Publishable key: pk_test_...
   ```

### 2. Create Stripe Products (2 minutes)

1. **Go to:** https://dashboard.stripe.com/test/products
2. **Click:** "+ Create product"

**Pro Product:**

- Name: `ContractGuard Pro`
- Description: `Unlimited scans with advanced features`
- Pricing model: `Recurring`
- Price: `$29.00 USD`
- Billing period: `Monthly`
- **Click "Save"**
- **COPY THE PRICE ID** (it looks like: `price_1ABC123...`)

**Enterprise Product:**

- Name: `ContractGuard Enterprise`
- Description: `Enterprise features`
- Pricing model: `Recurring`
- Price: `$199.00 USD`
- Billing period: `Monthly`
- **Click "Save"**
- **COPY THE PRICE ID**

### 3. Add to .env.local (1 minute)

Open `.env.local` and add these lines:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_TEMPORARY  # We'll update this in step 4

# Stripe Price IDs (paste your copied price IDs)
STRIPE_PRO_MONTHLY=price_YOUR_PRO_PRICE_ID_HERE
STRIPE_ENTERPRISE_MONTHLY=price_YOUR_ENTERPRISE_PRICE_ID_HERE

# Site URL (already should be there, but verify)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set Up Webhook Forwarding

**Open a new terminal** and run:

```bash
# Login to Stripe (first time only)
stripe login

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output something like:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Copy that secret** and update `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...  # Replace with your actual secret
```

### 5. Restart Your Dev Server

```bash
# In your main terminal (where dev server is running)
# Press Ctrl+C to stop
# Then start again:
npm run dev
```

---

## ✅ Now Test It!

1. **Make sure you're logged in:**
   - Go to http://localhost:3000/sign-in
   - Login or create account

2. **Go to pricing:**
   - http://localhost:3000/pricing
   - Click "Go Pro" button

3. **Should redirect to Stripe checkout!**

4. **Use test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)

5. **Complete payment**
   - Click "Subscribe"
   - Should redirect back to /account with success message
   - Check that your plan shows "Pro Tier"

6. **Check webhooks:**
   - In the terminal running Stripe CLI
   - You should see events like:
     ```
     checkout.session.completed
     customer.subscription.created
     invoice.payment_succeeded
     ```

---

## 🐛 Troubleshooting

### "Unauthorized" Error

**Solution:** You're not logged in. Go to `/sign-in` first.

### "Invalid URL" Error

**Solution:** Make sure `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`

### "No such price" Error

**Solution:** Double-check your price IDs match what's in Stripe Dashboard

### Webhooks not received

**Solution:** Make sure `stripe listen` command is running in a separate terminal

### "STRIPE_SECRET_KEY is not configured"

**Solution:** Add your Stripe secret key to `.env.local` and restart dev server

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] Stripe account created
- [ ] Test mode enabled
- [ ] Secret key added to `.env.local`
- [ ] Publishable key added to `.env.local`
- [ ] Pro product created in Stripe
- [ ] Pro price ID added to `.env.local`
- [ ] `stripe listen` running in separate terminal
- [ ] Webhook secret added to `.env.local`
- [ ] Dev server restarted
- [ ] You're logged into the app

---

## 🎉 That's It!

Once you've completed these steps, the Stripe integration should work perfectly!

**Total time:** ~5 minutes  
**Difficulty:** Easy  
**Cost:** $0 (using test mode)

---

## Next Steps After Testing

1. Test subscription management in `/account`
2. Test cancellation flow
3. Deploy to production
4. Switch to live Stripe keys
5. Start accepting real payments! 💰

---

**Need Help?** See `STRIPE_TESTING_GUIDE.md` for detailed testing scenarios.
