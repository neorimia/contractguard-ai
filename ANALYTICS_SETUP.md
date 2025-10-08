# Analytics & Monitoring Setup Guide

Complete guide for setting up PostHog analytics and Sentry error monitoring.

---

## 📊 PostHog Analytics Setup

### Step 1: Create PostHog Account

1. Go to: https://app.posthog.com/signup
2. Create account (free tier available)
3. Create a new project: "ContractGuard AI"

### Step 2: Get API Keys

1. After project creation, copy your **Project API Key**
2. It looks like: `phc_abc123def456...`
3. Also note your **API Host**: `https://app.posthog.com` (or EU: `https://eu.posthog.com`)

### Step 3: Add to Environment Variables

Add to `.env.local`:

```env
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

###Step 4: Restart Dev Server

```bash
npm run dev
```

### Step 5: Verify It's Working

1. Open your app: http://localhost:3000
2. Perform some actions (scan a contract, navigate pages)
3. Go to PostHog Dashboard: https://app.posthog.com
4. Check "Events" → You should see events flowing in!

---

## 🎯 Tracked Events

### User Events

- `user_signed_up` - New user registration
- `user_logged_in` - User login
- `user_logged_out` - User logout
- `user_verified_email` - Email verification complete

### Scan Events

- `scan_initiated` - User starts a scan
- `scan_completed` - Scan finishes successfully
- `scan_failed` - Scan fails
- `scan_limit_reached` - User hits scan limit

### Payment Events

- `checkout_initiated` - User clicks upgrade
- `checkout_completed` - Payment successful
- `checkout_canceled` - Checkout canceled
- `subscription_upgraded` - Tier upgraded
- `subscription_canceled` - Subscription canceled
- `portal_opened` - Customer portal accessed

### Engagement Events

- `result_shared` - User shares results on Twitter
- `result_viewed` - Results page viewed
- `pricing_page_viewed` - Pricing page viewed
- `account_page_viewed` - Account page viewed

---

## 📈 Key Metrics to Monitor

### Conversion Funnel

```
1. Page Visit
   ↓
2. Scan Initiated
   ↓
3. Scan Completed
   ↓
4. Limit Reached
   ↓
5. Pricing Viewed
   ↓
6. Checkout Initiated
   ↓
7. Checkout Completed
```

**Target Conversion Rates:**

- Visit → Scan: 30%
- Scan → Upgrade: 5%
- Checkout Start → Complete: 70%

### Engagement Metrics

- Daily Active Users (DAU)
- Scans per user
- Share rate
- Return rate

### Revenue Metrics

- Free → Pro conversion rate (target: 2-5%)
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn rate (target: <5%)

---

## 🚨 Sentry Error Monitoring Setup

### Step 1: Create Sentry Account

1. Go to: https://sentry.io/signup/
2. Create account
3. Create new project:
   - Platform: **Next.js**
   - Project name: **contractguard-ai**

### Step 2: Get DSN

1. After project creation, copy your **DSN**
2. It looks like: `https://abc123@o456.ingest.sentry.io/789`

### Step 3: Add to Environment Variables

Add to `.env.local`:

```env
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your_key@o123.ingest.sentry.io/456
SENTRY_ORG=your-org-name
SENTRY_PROJECT=contractguard-ai
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

### Step 5: Test Error Tracking

```javascript
// Trigger a test error (in browser console)
throw new Error("Test error for Sentry");
```

Check Sentry Dashboard → Issues → You should see the error!

---

## 🔧 Configuration

### PostHog Features Enabled

✅ **Event Tracking** - All user actions tracked  
✅ **Page Views** - Automatic page view tracking  
✅ **User Identification** - Users identified by Stack Auth ID  
✅ **Session Recording** - User session playback (privacy-safe)  
✅ **Funnel Analysis** - Conversion funnel tracking  
✅ **Retention Analysis** - User retention metrics

### Sentry Features Enabled

✅ **Error Tracking** - All errors captured  
✅ **Performance Monitoring** - API response times  
✅ **Session Replay** - Error session playback  
✅ **Release Tracking** - Track errors by version  
✅ **User Context** - Link errors to users  
✅ **Environment Separation** - Dev/staging/prod split

---

## 📊 Dashboard Setup

### PostHog Dashboards to Create

1. **Overview Dashboard:**
   - Total users
   - Daily scans
   - Conversion rate
   - Revenue (from subscriptions)

2. **Funnel Analysis:**
   - Scan → Upgrade funnel
   - Signup → Active user funnel

3. **Retention:**
   - Day 1, 7, 30 retention
   - Cohort analysis

### Sentry Alerts to Set Up

1. **Critical Errors:**
   - Any error in payment flow
   - Database connection failures
   - AI service failures

2. **Performance:**
   - API response time > 30s
   - High error rate (>1%)

---

## 🎯 Success Metrics

### Week 1 Targets

- 1,000+ page views
- 500+ scans
- 5+ Pro signups
- < 1% error rate

### Month 1 Targets

- 10,000+ page views
- 5,000+ scans
- 50+ Pro users ($1,450 MRR)
- 99.9% uptime

---

## 🔒 Privacy & Compliance

### PostHog Configuration

- ✅ Input fields masked in session recordings
- ✅ Sensitive data excluded
- ✅ GDPR compliant
- ✅ Cookie consent ready

### Sentry Configuration

- ✅ Personal data scrubbed from errors
- ✅ IP addresses anonymized
- ✅ Stack traces sanitized

---

## 🐛 Debugging

### View Events in PostHog

```javascript
// In browser console
posthog.debug();
```

### View Errors in Sentry

1. Dashboard → Issues
2. Filter by environment
3. Click on error for full stack trace

### Test Analytics Locally

```javascript
// In browser console
import { trackEvent } from "@/lib/analytics/posthog";
trackEvent("test_event", { test: true });
```

---

## 📝 Environment Variables Summary

```env
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
SENTRY_ORG=your-org
SENTRY_PROJECT=contractguard-ai

# Optional: Sentry Auth Token (for releases)
SENTRY_AUTH_TOKEN=sntrys_...
```

---

## 🚀 Production Checklist

Before deploying:

- [ ] PostHog API key configured
- [ ] Sentry DSN configured
- [ ] Test events appearing in PostHog
- [ ] Test errors appearing in Sentry
- [ ] Privacy settings configured
- [ ] Alerts set up in Sentry
- [ ] Dashboards created in PostHog

---

**Status:** ✅ Analytics and monitoring fully configured and ready for production!
