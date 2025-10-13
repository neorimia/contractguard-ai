# Crypto.com Affiliate Banner Setup Guide

## Overview

The Crypto.com affiliate banner has been added to the ScanInterface to show for free and anonymous users **before they perform their first scan**. This creates maximum visibility for the affiliate partnership while maintaining a good user experience.

## Changes Made

### 1. ScanInterface.tsx

- **Location**: `components/scan/ScanInterface.tsx`
- **Change**: Added `BannerManager` component that displays before scanning
- **Conditions**:
  - Only shows when `!result` (before scanning)
  - Only shows for anonymous users `!user` OR free tier users `userAccessStatus?.accessType === "free"`
  - Banner disappears after scan is performed

### 2. Banner Seed Data

- **Location**: `scripts/seed-banners.ts`
- **Change**: Added Crypto.com affiliate banner configuration
- **Banner Details**:
  - **Name**: `crypto_com_affiliate`
  - **Type**: `partner_ad`
  - **Category**: `partnership`
  - **Placement**: `top_leaderboard`
  - **Priority**: 9 (high priority)
  - **Target**: All users (free tier only)
  - **Min Scans**: 0 (shows before scanning)
  - **Max Scans**: 0 (only before first scan)
  - **Frequency Cap**: 2 impressions per day
  - **Dismissible**: Yes

## Setup Instructions

### Step 1: Update Affiliate Link

**IMPORTANT**: Before seeding, update the affiliate link in `scripts/seed-banners.ts`:

```typescript
// Find this line (around line 33):
ctaUrl: "https://crypto.com/app/your-affiliate-link",

// Replace with your actual Crypto.com affiliate link:
ctaUrl: "https://crypto.com/app/actual-affiliate-code-here",
```

### Step 2: Seed the Banner Data

Run the banner seeding script to add the Crypto.com banner to your database:

```bash
npm run seed:banners
```

This will create 6 banners in total:

- ✅ 1 Crypto.com affiliate banner (before scanning)
- ✅ 1 Power user upgrade banner
- ✅ 1 Anonymous signup education banner
- ✅ 2 Sidebar rectangle banners (comparison, social proof)
- ✅ 1 Bottom sticky banner (limit warning)

### Step 3: Test the Banner

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000` in your browser

3. **Testing Scenarios**:
   - **As Anonymous User**: You should see the Crypto.com banner immediately on page load
   - **After Scanning**: The banner should disappear once you perform a scan
   - **Dismiss Test**: Click the X button to dismiss, it should not show again for 24 hours
   - **Frequency Cap**: After 2 impressions in 24 hours, it won't show again until the cap resets

### Step 4: Verify Banner Placement

The banner should appear:

- ✅ In the hero section, **before** the scan input
- ✅ Between the page description and the "Scan Overview" component
- ✅ With Crypto.com branding colors (dark blue `#002D74`)
- ✅ With a clear CTA button "Claim Bonus →"

## Banner Configuration

### Visual Design

- **Background Color**: `#002D74` (Crypto.com dark blue)
- **Text Color**: `#FFFFFF` (white)
- **Format**: Static banner
- **Headline**: "🔒 Secure Your Crypto Assets with Crypto.com"
- **Body**: "Get up to $50 USD in crypto when you sign up. Trusted by millions worldwide."
- **CTA**: "Claim Bonus →"

### Targeting Rules

- **User Types**: All (anonymous, soft, free, power_user)
- **Tier**: Free only (Pro users won't see it)
- **Scan Count**: 0 (only shows before scanning)
- **Placement**: Top leaderboard (desktop and mobile)

### User Experience

- **Frequency Cap**: Maximum 2 impressions per user per day
- **Dismissible**: Yes (24-hour cooldown)
- **External Link**: Opens in new tab
- **Analytics**: Fully tracked (impressions, clicks, conversions)

## Analytics & Tracking

### PostHog Events

The banner automatically tracks:

- `banner_impression` - When banner becomes visible (50% visible for 1 second)
- `banner_click` - When user clicks the CTA button
- `banner_dismissed` - When user dismisses the banner

### Database Tracking

All events are also stored in the database:

- **Table**: `banner_impressions`
- **Metrics**: CTR, conversion rate, revenue attribution
- **Segmentation**: By user type, device type, scan count

### Viewing Analytics

1. **PostHog Dashboard**:

   ```
   https://app.posthog.com/events?filter=banner_*
   ```

2. **Internal API**:

   ```
   GET /api/banners/analytics?bannerId=crypto_com_affiliate
   ```

3. **Admin Dashboard** (coming soon):
   - Real-time banner performance
   - CTR and conversion metrics
   - A/B testing results

## Revenue Tracking

### Commission Structure

Update the banner metadata with your commission details:

```typescript
metadata: {
  frequencyCap: 2,
  dismissible: true,
  notes: "Show to free/anonymous users before scanning",
  commissionRate: 25, // % commission per signup
  expectedCPA: 50, // Expected cost per acquisition in USD
}
```

### Conversion Attribution

- **Attribution Window**: 7 days (last-click)
- **Tracking**: Via sessionId and userId
- **Revenue Updates**: Manual or via Crypto.com webhook

## Customization Options

### Banner Content

To update the banner copy, edit `scripts/seed-banners.ts` and re-run the seed script, or update directly in the database:

```typescript
headline: "Your custom headline",
body: "Your custom body text",
ctaText: "Your CTA",
ctaUrl: "https://your-affiliate-link",
```

### Visual Design

Customize colors to match your branding:

```typescript
backgroundColor: "#002D74", // Dark blue
textColor: "#FFFFFF", // White
```

### Targeting

Adjust who sees the banner:

```typescript
targetUserType: "all", // anonymous, soft, free, power_user, all
targetTier: "free", // free, pro, enterprise, all
minScans: 0, // Minimum scans performed
maxScans: 0, // Maximum scans (0 = before first scan)
```

### Priority

Control banner selection priority (1-10):

```typescript
priority: 9, // Higher = more likely to show
```

## Troubleshooting

### Banner Not Showing

**Check 1**: Is the banner active?

```typescript
isActive: true, // Must be true in database
```

**Check 2**: Are you in the target audience?

- Must be free tier or anonymous user
- Must not have scanned yet (scanCount = 0)
- Must not have dismissed in last 24 hours

**Check 3**: Browser console errors?

```bash
# Check browser console for errors
# Common issue: Banner fetch failed
```

**Check 4**: Database connection

```bash
# Verify banner exists in database
SELECT * FROM banners WHERE name = 'crypto_com_affiliate';
```

### Banner Shows After Scanning

**Issue**: Banner should only show before scanning
**Fix**: Check the condition in `ScanInterface.tsx`:

```typescript
{!result && (!user || userAccessStatus?.accessType === "free") && (
  <BannerManager placement="top_leaderboard" ... />
)}
```

### Frequency Cap Not Working

**Issue**: Banner shows more than 2 times per day
**Fix**: Check `banner_impressions` table for duplicate entries

```sql
SELECT COUNT(*)
FROM banner_impressions
WHERE banner_id = 'crypto_com_affiliate'
AND session_id = 'your-session-id'
AND created_at > NOW() - INTERVAL '24 hours';
```

## Best Practices

### 1. Update Affiliate Link

- ✅ Use UTM parameters for tracking: `?utm_source=contractguard&utm_medium=banner`
- ✅ Test the link before going live
- ✅ Ensure it opens in new tab

### 2. Monitor Performance

- ✅ Check CTR weekly (target: >0.3%)
- ✅ Track conversions (if Crypto.com provides data)
- ✅ A/B test different copy and designs

### 3. User Experience

- ✅ Keep frequency cap at 2-3 per day
- ✅ Always make banner dismissible
- ✅ Don't show after users perform a scan
- ✅ Respect user preferences

### 4. Compliance

- ✅ Disclose affiliate relationship
- ✅ Follow FTC guidelines
- ✅ Include affiliate disclosure in footer/terms
- ✅ Respect GDPR/CCPA requirements

## Next Steps

1. ✅ Update affiliate link in seed script
2. ✅ Run `npm run seed:banners`
3. ✅ Test banner visibility and functionality
4. ✅ Monitor analytics for first week
5. ✅ Optimize based on CTR and conversion data
6. ✅ Consider A/B testing different variants

## Support

For issues or questions:

- Check `docs/BANNER_SYSTEM_DESIGN.md` for full technical documentation
- Review `components/banners/` for banner components
- Check PostHog for analytics and user behavior

---

**Last Updated**: 2024-12-19
**Version**: 1.0
**Status**: Ready for Testing
