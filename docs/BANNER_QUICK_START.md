# Banner System - Quick Start Guide

## ✅ Implementation Status: COMPLETE

All banner system components have been successfully implemented and deployed to the database!

---

## 🎉 What's Been Completed

### 1. ✅ Database Schema Created
3 new tables successfully migrated:
- `banners` - Banner configuration (24 fields)
- `banner_impressions` - Tracking data (16 fields)
- `banner_analytics` - Aggregated metrics (13 fields)

### 2. ✅ Initial Banners Seeded
5 banners successfully created in database:

1. **power_user_upgrade** (Top Leaderboard)
   - Targets: Free users with 10+ scans
   - Message: "You've scanned over 10 contracts! 🚀"

2. **comparison_chart** (Sidebar Rectangle)
   - Targets: Free users with 3+ scans
   - Message: Free vs Pro comparison

3. **social_proof_stats** (Sidebar Rectangle)
   - Targets: All users
   - Message: Trust signals and stats

4. **limit_warning_mobile** (Bottom Sticky - Mobile)
   - Targets: Free users with 2-3 scans
   - Message: "⚠️ 1 scan left today"

5. **anonymous_signup_education** (Top Leaderboard)
   - Targets: Anonymous users with 1+ scan
   - Message: "🔍 Get 3 free scans daily"

### 3. ✅ Components Integrated
- BannerManager imported into ScanInterface
- 3 placement slots configured:
  - Top Leaderboard (Desktop & Mobile)
  - Sidebar Rectangle (Desktop only)
  - Bottom Sticky (Mobile only)

### 4. ✅ Service Layer Active
- BannerService with intelligent selection
- Redis caching (5-minute TTL)
- Frequency capping enabled
- Viewability tracking (50% visible × 1s)

### 5. ✅ Analytics Ready
PostHog events configured:
- `banner_impression`
- `banner_click`
- `banner_conversion`
- `banner_dismissed`

---

## 🚀 Testing the System

### Start Development Server
```bash
npm run dev
```

### Test Flow
1. Visit http://localhost:3000
2. Perform a contract scan (use any valid Ethereum address)
3. After scan results appear, scroll down
4. You should see a banner appear below the results

### Expected Behavior

**Anonymous User (First Scan):**
- Banner: "🔍 Get 3 free scans daily with a free account"
- Placement: Top Leaderboard
- CTA: "Sign Up Free"

**Free User (3+ Scans):**
- Banner: "Free vs Pro" comparison chart
- Placement: Sidebar Rectangle (desktop) or Top Leaderboard (mobile)
- CTA: "Upgrade Now"

**Free User (10+ Scans):**
- Banner: "You've scanned over 10 contracts! 🚀"
- Placement: Top Leaderboard
- CTA: "Try Pro - €29/mo"

**Free User (2 Scans Remaining):**
- Banner: "⚠️ 1 scan left today"
- Placement: Bottom Sticky (mobile only)
- CTA: "Go Pro"

---

## 📊 Monitoring Analytics

### PostHog Dashboard
View banner events:
```
https://app.posthog.com/events?filter=banner_*
```

### Database Queries

**Check all active banners:**
```sql
SELECT name, type, placement, target_user_type, min_scans, max_scans, is_active
FROM banners
WHERE is_active = true
ORDER BY priority DESC;
```

**View recent impressions:**
```sql
SELECT
  bi.created_at,
  b.name as banner_name,
  bi.placement,
  bi.was_clicked,
  bi.device_type
FROM banner_impressions bi
JOIN banners b ON b.id = bi.banner_id
ORDER BY bi.created_at DESC
LIMIT 20;
```

**Banner performance summary:**
```sql
SELECT
  name,
  impressions,
  clicks,
  conversions,
  ROUND((clicks::float / NULLIF(impressions, 0)) * 100, 2) AS ctr,
  ROUND((conversions::float / NULLIF(clicks, 0)) * 100, 2) AS conversion_rate
FROM banners
WHERE is_active = true
ORDER BY impressions DESC;
```

### Using Drizzle Studio
```bash
npm run db:studio
```
- Open http://localhost:4983
- Navigate to `banners` table
- View/edit banner configurations

---

## 🎨 Customizing Banners

### Edit Existing Banners

1. Open Drizzle Studio: `npm run db:studio`
2. Navigate to `banners` table
3. Click on a banner to edit
4. Modify fields:
   - `headline` - Main message
   - `body` - Supporting text
   - `cta_text` - Button text
   - `cta_url` - Destination URL
   - `background_color` - Banner background (#hex)
   - `text_color` - Text color (#hex)
   - `priority` - Selection priority (1-10)
5. Save changes

### Create New Banner

```typescript
// Use Drizzle Studio or create via script
await db.insert(banners).values({
  name: "my_custom_banner",
  type: "internal_upgrade",
  category: "upgrade",
  placement: "top_leaderboard",
  priority: 8,
  targetUserType: "free",
  minScans: 5,
  targetTier: "free",
  headline: "Custom Headline",
  body: "Custom body text",
  ctaText: "Custom CTA",
  ctaUrl: "/pricing",
  format: "static",
  backgroundColor: "#3B82F6",
  textColor: "#FFFFFF",
  isActive: true,
  metadata: {
    frequencyCap: 3,
    dismissible: true,
  },
});
```

---

## 🐛 Troubleshooting

### Banners Not Showing?

**1. Check banner is active:**
```sql
SELECT name, is_active FROM banners WHERE name = 'power_user_upgrade';
```

**2. Check targeting rules:**
- Anonymous users: `targetUserType = 'anonymous'`
- Free users: `targetUserType = 'free'`
- Scan count matches: `minScans <= your_scans <= maxScans`

**3. Check console for errors:**
- Open browser DevTools (F12)
- Look for errors from `/api/banners/select`
- Check network tab for failed requests

**4. Verify Redis connection:**
```bash
# Check if Redis is running (via Upstash)
# Verify UPSTASH_REDIS_URL in .env.local
```

**5. Clear cache:**
```typescript
// In browser console or create a script
localStorage.removeItem('banner_session_id');
// Reload page
```

### Low Click-Through Rate?

1. **Test different copy**
   - Edit headline to be more compelling
   - Add urgency or social proof
   - Test action-oriented CTAs

2. **Improve targeting**
   - Narrow user type (free vs power_user)
   - Adjust scan count thresholds
   - Test different placements

3. **Design improvements**
   - Update colors for better contrast
   - Add emoji for visual appeal
   - Test mobile vs desktop layouts

### High Dismissal Rate?

1. **Reduce frequency**
   - Lower `frequencyCap` (default: 3-5)
   - Increase `minScans` threshold

2. **Better timing**
   - Show after more scans (increase `minScans`)
   - Target power users instead of new users

3. **Improve value proposition**
   - Clearer benefits in headline
   - More specific messaging
   - Test social proof variations

---

## 📈 Success Metrics

### Week 1 Targets (MVP)
- Banner impressions: 100+
- Average CTR: >0.3%
- User complaints: <5%
- No performance degradation

### Week 2 Targets (Optimized)
- Banner CTR: >0.5%
- Conversion rate: 2-3%
- 10+ A/B test variants launched
- Performance: <100ms load impact

### Week 3 Targets (Scaled)
- Revenue: €200-400/month (at 5K users)
- CTR: >0.5% sustained
- External ads integrated (Cointraffic)
- User satisfaction: >3.5/5

---

## 🔧 Advanced Features (Coming Soon)

### A/B Testing
Create banner variants:
```typescript
// Variant A
await db.insert(banners).values({
  variantGroup: "upgrade_cta_test_1",
  variantName: "variant_a",
  ctaText: "Upgrade to Pro",
  // ... other fields
});

// Variant B
await db.insert(banners).values({
  variantGroup: "upgrade_cta_test_1",
  variantName: "variant_b",
  ctaText: "Try 7 Days Free",
  // ... other fields
});
```

View results:
```bash
curl "http://localhost:3000/api/banners/ab-test?variantGroup=upgrade_cta_test_1"
```

### External Ad Networks
Coming in Week 3:
- Cointraffic integration
- Revenue tracking webhooks
- GDPR compliance
- CPM optimization

### Dynamic Banners
Coming in Week 4:
- Real-time stats ("Caught 47 scams today")
- Geo-targeting (US vs EU offers)
- Behavioral retargeting
- Animated HTML5 banners

---

## 📚 Additional Resources

- **Design Spec:** `docs/BANNER_SYSTEM_DESIGN.md`
- **Integration Guide:** `docs/BANNER_INTEGRATION_GUIDE.md`
- **Implementation Summary:** `docs/BANNER_IMPLEMENTATION_SUMMARY.md`
- **Quick Start:** `docs/BANNER_QUICK_START.md` (this file)

---

## 🎯 Next Steps

1. ✅ Database migrated (`npm run db:push`)
2. ✅ Banners seeded (`npm run seed:banners`)
3. ✅ Components integrated into ScanInterface
4. ⏳ **Start dev server** (`npm run dev`)
5. ⏳ **Test banner display** (perform scans)
6. ⏳ **Monitor analytics** (PostHog dashboard)
7. ⏳ **A/B test variants** (Week 2)
8. ⏳ **Deploy to production** (Week 3)

---

## ✨ System Status

**Infrastructure:** ✅ Complete
**Database:** ✅ Migrated & Seeded
**Components:** ✅ Integrated
**API Routes:** ✅ Active
**Analytics:** ✅ Configured
**Documentation:** ✅ Comprehensive

**Status:** 🚀 Ready for Testing!

---

**Questions or issues?** Check:
1. `docs/BANNER_INTEGRATION_GUIDE.md` - Troubleshooting section
2. Browser console (F12) - Error messages
3. Database logs - `npm run db:studio`
4. PostHog dashboard - Event tracking
