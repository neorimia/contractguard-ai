# 🚀 Production Deployment Guide

Complete step-by-step guide for deploying ContractGuard AI to Vercel.

---

## Prerequisites

Before deploying:

- [ ] All features tested locally
- [ ] Stripe working in test mode
- [ ] Analytics configured (PostHog)
- [ ] Error monitoring configured (Sentry)
- [ ] Database migrations applied
- [ ] All tests passing

---

## Step 1: Prepare for Deployment

### A. Switch Stripe to Live Mode

1. Go to: https://dashboard.stripe.com/apikeys
2. **Switch to Live mode** (toggle in top right)
3. Copy live keys:
   - Secret key: `sk_live_...`
   - Publishable key: `pk_live_...`

4. Create live products:
   - Go to: https://dashboard.stripe.com/products
   - Create "ContractGuard Pro" - $29/month
   - Create "ContractGuard Enterprise" - $199/month
   - Copy the **Price IDs** (price\_...)

5. **IMPORTANT:** Keep test keys for staging!

### B. Prepare Environment Variables

Create a checklist of all required environment variables:

```env
# Database
DATABASE_URL=                    # Neon production database
UPSTASH_REDIS_URL=               # Upstash production Redis
UPSTASH_REDIS_TOKEN=             # Upstash token

# AI Services
OPENAI_API_KEY=                  # OpenAI production key
CLAUDE_API_KEY=                  # Claude key (optional fallback)
ETHERSCAN_API_KEY=               # Etherscan API key
ALCHEMY_API_KEY=                 # Alchemy API key

# Authentication (Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=    # Stack Auth project ID
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=  # Stack publishable key
STACK_SECRET_SERVER_KEY=         # Stack secret key

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY=sk_live_...    # Live secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live publishable key
STRIPE_WEBHOOK_SECRET=           # Will get after deployment
STRIPE_PRO_MONTHLY=     # Live price ID
STRIPE_ENTERPRISE_MONTHLY=  # Live enterprise price ID

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=         # PostHog API key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=          # Sentry DSN
SENTRY_ORG=                      # Sentry organization
SENTRY_PROJECT=contractguard-ai  # Sentry project name

# Email (Optional)
RESEND_API_KEY=                  # Resend API key
EMAIL_FROM=noreply@your-domain.com
```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub

1. Push your code to GitHub:

   ```bash
   git push origin feat/stripe
   ```

2. Go to: https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings
6. Click "Deploy"

---

## Step 3: Configure Environment Variables in Vercel

### Via Vercel Dashboard

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add ALL environment variables from Step 1
4. Make sure to select **Production** environment
5. Click "Save"

### Via Vercel CLI

```bash
# Add environment variables one by one
vercel env add DATABASE_URL production
# Paste value when prompted

# Or use a .env.production file
vercel env pull .env.production
```

### Important Notes

- Use **LIVE** Stripe keys for production
- Use production database URL (not development)
- Update `NEXT_PUBLIC_SITE_URL` to your actual domain

---

## Step 4: Configure Stripe Production Webhook

### A. Get Your Production URL

After deployment, your URL will be something like:

- `https://contractguard-ai.vercel.app`
- Or your custom domain: `https://contractguard.ai`

### B. Add Webhook Endpoint in Stripe

1. Go to: https://dashboard.stripe.com/webhooks (LIVE mode)
2. Click "+ Add endpoint"
3. Enter URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing Secret** (whsec\_...)

### C. Add Webhook Secret to Vercel

```bash
# Via CLI
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the whsec_... value

# Or via Dashboard
# Settings → Environment Variables → Add STRIPE_WEBHOOK_SECRET
```

### D. Redeploy

```bash
vercel --prod
```

---

## Step 5: Configure Custom Domain (Optional)

### A. Add Domain in Vercel

1. Project Settings → Domains
2. Add your domain: `contractguard.ai`
3. Follow DNS configuration instructions

### B. Update DNS Records

Add these records to your domain registrar:

**For apex domain (contractguard.ai):**

```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### C. Wait for DNS Propagation

Usually takes 5-60 minutes.

### D. Update Environment Variables

```bash
# Update site URL
vercel env rm NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://contractguard.ai

# Redeploy
vercel --prod
```

---

## Step 6: Post-Deployment Verification

### A. Test Core Features

- [ ] Homepage loads correctly
- [ ] Sign up / Login works
- [ ] Contract scanning works
- [ ] Results display correctly
- [ ] Caching is working

### B. Test Payment Flow

- [ ] Pricing page loads
- [ ] Click "Go Pro" redirects to Stripe
- [ ] Complete payment with **REAL CARD** (will be charged!)
- [ ] Verify redirect back to account
- [ ] Check tier upgraded to "pro"
- [ ] Verify unlimited scans work

**IMPORTANT:** Use your own card and immediately cancel if just testing!

### C. Test Subscription Management

- [ ] Go to account page
- [ ] Click "Manage Subscription"
- [ ] Verify Stripe portal opens
- [ ] Test updating payment method
- [ ] Test canceling subscription
- [ ] Verify tier downgrades to "free"

### D. Monitor Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your production webhook
3. View "Events" tab
4. Verify events are being delivered (200 status)
5. Check for any failed events

### E. Verify Analytics

1. **PostHog:** https://app.posthog.com
   - Check events are coming in
   - Verify user identification working
   - Monitor real-time traffic

2. **Sentry:** https://sentry.io
   - Check for any errors
   - Verify error tracking working
   - Set up alerts if needed

---

## Step 7: Enable Production Features

### A. Configure Vercel Settings

1. **Environment:**

   ```env
   NODE_ENV=production
   ```

2. **Performance:**
   - Enable Edge Runtime (if applicable)
   - Configure caching headers
   - Enable compression

3. **Security:**
   - Enable HTTPS only
   - Configure CORS
   - Set security headers

### B. Database Optimization

```bash
# Add indexes for production performance
# Run this on your Neon database

CREATE INDEX IF NOT EXISTS idx_audits_contract_address ON audits(contract_address);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stack_user_id ON users(stack_user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
```

---

## Step 8: Monitoring & Alerts

### Set Up Vercel Monitoring

1. Project → Analytics
2. Enable Web Analytics
3. Monitor:
   - Page views
   - Response times
   - Error rates

### Set Up Sentry Alerts

1. Sentry → Alerts
2. Create alert rules:
   - Error rate > 1%
   - New issue in production
   - Performance degradation

### Set Up PostHog Alerts

1. PostHog → Insights
2. Create alerts:
   - Conversion rate drops
   - Traffic spikes
   - Payment failures

---

## Step 9: Final Checks

### Before Announcing Launch

- [ ] All pages load correctly
- [ ] SSL certificate active (https://)
- [ ] Payment flow tested with real card
- [ ] Webhooks delivering successfully
- [ ] Analytics tracking working
- [ ] Error monitoring active
- [ ] Custom domain working (if configured)
- [ ] Email notifications working (if configured)
- [ ] Rate limiting active
- [ ] All tests passing

### Performance Check

- [ ] Homepage loads < 2s
- [ ] Scan completes < 15s
- [ ] Cached results < 1s
- [ ] No console errors
- [ ] Mobile responsive

---

## Deployment Commands Reference

```bash
# Production deployment
vercel --prod

# Check deployment status
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>

# Rollback if needed
vercel rollback

# List deployments
vercel ls

# Environment variables
vercel env ls                    # List variables
vercel env add VAR_NAME prod     # Add variable
vercel env rm VAR_NAME prod      # Remove variable
```

---

## Troubleshooting

### Deployment fails

**Check:**

- Build logs in Vercel dashboard
- Environment variables are set
- Dependencies installed correctly

### Webhooks not working

**Check:**

- Webhook URL is correct
- Webhook secret matches production
- Events are selected in Stripe
- Check webhook logs in Stripe Dashboard

### Database connection fails

**Check:**

- DATABASE_URL is correct for production
- Neon database is accessible
- Connection pooling configured

### Analytics not tracking

**Check:**

- PostHog API key is correct
- Environment variable is `NEXT_PUBLIC_POSTHOG_KEY`
- PostHog initialized in browser console

---

## Post-Launch Monitoring

### First 24 Hours

Monitor:

- Error rate in Sentry
- Traffic in PostHog
- Conversions
- Webhook delivery rate
- Database performance
- API response times

### First Week

Track:

- Daily active users
- Scans per user
- Free → Pro conversion rate
- Churn rate
- Support tickets

---

## Rollback Plan

If critical issues occur:

```bash
# Quick rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-url>
```

---

## Success Criteria

### Technical

- ✅ Uptime > 99%
- ✅ API response < 15s
- ✅ Error rate < 1%
- ✅ Webhook delivery > 99%

### Business

- ✅ First payment within 24 hours
- ✅ 10+ signups Day 1
- ✅ 100+ scans Day 1
- ✅ $1,000+ MRR Month 1

---

**Ready to deploy!** Follow these steps and you'll have a production-ready SaaS live in under an hour! 🚀

**Need help?** Check Vercel docs: https://vercel.com/docs
