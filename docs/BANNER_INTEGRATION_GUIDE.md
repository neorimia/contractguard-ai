# Banner System Integration Guide

## Quick Start (5 Minutes)

### Step 1: Push Database Schema
```bash
npm run db:push
```

This creates 3 new tables:
- `banners` - Banner configuration
- `banner_impressions` - Tracking data
- `banner_analytics` - Aggregated metrics

### Step 2: Seed Initial Banner Data
```bash
npm run seed:banners
```

This creates 5 initial banners:
1. **Power User Upgrade** (Top Leaderboard) - For users with 10+ scans
2. **Comparison Chart** (Sidebar) - Free vs Pro comparison
3. **Social Proof** (Sidebar) - Trust signals
4. **Limit Warning** (Bottom Sticky Mobile) - When 1 scan left
5. **Anonymous Signup** (Top Leaderboard) - Convert anonymous users

### Step 3: Add Banner to ScanInterface

Open `components/scan/ScanInterface.tsx` and add after line 409 (after results):

```typescript
{/* Banner Integration - Show after scan results */}
{result && (
  <div className="max-w-6xl mx-auto mt-8 space-y-4">
    {/* Top Leaderboard - Desktop & Mobile */}
    <BannerManager
      placement="top_leaderboard"
      scanCount={
        user
          ? 3 - (userAccessStatus?.scansRemaining || 0)
          : anonymousScansPerformed
      }
      contractAddress={address}
    />

    {/* Sidebar Rectangle - Desktop Only */}
    <aside className="hidden lg:block fixed right-8 top-32 w-[300px]">
      <BannerManager
        placement="sidebar_rectangle"
        scanCount={
          user
            ? 3 - (userAccessStatus?.scansRemaining || 0)
            : anonymousScansPerformed
        }
      />
    </aside>

    {/* Bottom Sticky - Mobile Only */}
    <div className="block md:hidden">
      <BannerManager
        placement="bottom_sticky"
        scanCount={
          user
            ? 3 - (userAccessStatus?.scansRemaining || 0)
            : anonymousScansPerformed
        }
      />
    </div>
  </div>
)}
```

Add import at top of file:
```typescript
import { BannerManager } from "@/components/banners/BannerManager";
```

### Step 4: Test
```bash
npm run dev
```

Visit http://localhost:3000 and perform a scan. You should see banners appear after scan results.

---

## Banner Configuration

### Creating New Banners

Use Drizzle Studio to create banners:
```bash
npm run db:studio
```

Or insert via script:
```typescript
await db.insert(banners).values({
  name: "my_custom_banner",
  type: "internal_upgrade",
  category: "upgrade",
  placement: "top_leaderboard",
  priority: 8,
  targetUserType: "free",
  minScans: 5,
  headline: "Upgrade to Pro!",
  body: "Get unlimited scans",
  ctaText: "Upgrade Now",
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

### Targeting Rules

**User Types:**
- `anonymous` - Not signed in
- `soft` - Email-only signup
- `free` - Full account, free tier
- `power_user` - Free tier with 10+ scans
- `churned` - Inactive 7+ days
- `all` - All user types

**Tier Targeting:**
- `free` - Free tier only
- `pro` - Pro tier only
- `enterprise` - Enterprise only
- `all` - All tiers

**Scan Count Targeting:**
- `minScans` - Minimum scans performed (e.g., 3)
- `maxScans` - Maximum scans performed (e.g., 10)

**Priority:**
- Higher priority = more likely to be shown
- Range: 1-10
- Weighted random selection

### Placements

| Placement | Size (Desktop) | Size (Mobile) | Best Use Case |
|-----------|---------------|---------------|---------------|
| `top_leaderboard` | 728×90 | 320×50 | Feature highlights, urgent offers |
| `sidebar_rectangle` | 300×250 | N/A | Comparison charts, social proof |
| `bottom_sticky` | N/A | 320×50 | Limit warnings, quick CTAs |
| `inline_result` | Full width | Full width | Native feel, between results |
| `modal_overlay` | Centered | Centered | Major announcements, paywalls |

### Frequency Capping

Control how often banners are shown:

```typescript
metadata: {
  frequencyCap: 3, // Max 3 impressions per 24 hours
}
```

### Dismissible Banners

Allow users to dismiss:

```typescript
metadata: {
  dismissible: true,
}
```

Dismissed banners won't show for 24 hours.

---

## Analytics

### PostHog Events

4 banner events are tracked automatically:

1. **`banner_impression`** - Banner viewed (50% visible for 1 second)
   - Properties: `bannerId`, `bannerName`, `placement`, `type`, `category`

2. **`banner_click`** - Banner CTA clicked
   - Properties: `bannerId`, `bannerName`, `placement`, `ctaUrl`

3. **`banner_conversion`** - User upgraded after clicking banner
   - Properties: `bannerId`, `bannerName`, `placement`, `revenueGenerated`

4. **`banner_dismissed`** - User dismissed banner
   - Properties: `bannerId`, `bannerName`, `placement`

### View Analytics

**PostHog Dashboard:**
```
https://app.posthog.com/events?filter=banner_*
```

**Database Queries:**

```sql
-- Banner performance summary
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

-- Recent impressions
SELECT
  bi.created_at,
  b.name,
  bi.placement,
  bi.device_type,
  bi.was_clicked,
  bi.converted
FROM banner_impressions bi
JOIN banners b ON b.id = bi.banner_id
ORDER BY bi.created_at DESC
LIMIT 100;
```

### Attribution Tracking

Conversions are attributed to banners via 7-day last-click model:
- User clicks banner → session tracked
- User upgrades within 7 days → conversion attributed to banner

**Call after successful purchase:**
```typescript
import { BannerService } from "@/lib/services/banner.service";

await BannerService.trackConversion({
  sessionId: localStorage.getItem("banner_session_id") || "",
  userId: user.id,
  revenueGenerated: 2900, // €29.00 in cents
});
```

---

## A/B Testing

### Creating Test Variants

```typescript
// Variant A
await db.insert(banners).values({
  name: "upgrade_cta_test_a",
  variantGroup: "upgrade_cta_test_1",
  variantName: "variant_a",
  ctaText: "Upgrade to Pro",
  // ... other fields
});

// Variant B
await db.insert(banners).values({
  name: "upgrade_cta_test_b",
  variantGroup: "upgrade_cta_test_1",
  variantName: "variant_b",
  ctaText: "Try 7 Days Free",
  // ... other fields
});
```

### Viewing Test Results

```bash
curl -X GET "http://localhost:3000/api/banners/ab-test?variantGroup=upgrade_cta_test_1"
```

Response:
```json
{
  "variantGroup": "upgrade_cta_test_1",
  "results": [
    {
      "variantName": "variant_a",
      "impressions": 1250,
      "clicks": 38,
      "conversions": 5,
      "ctr": "3.04",
      "conversionRate": "13.16"
    },
    {
      "variantName": "variant_b",
      "impressions": 1180,
      "clicks": 52,
      "conversions": 8,
      "ctr": "4.41",
      "conversionRate": "15.38"
    }
  ],
  "significance": {
    "pValue": 0.032,
    "isSignificant": true,
    "winningVariant": "B"
  }
}
```

---

## Performance Optimization

### Caching

Banners are cached in Redis for 5 minutes:
- Selection results cached per session
- Cache key: `banner:{sessionId}:{placement}`
- Auto-invalidated on banner updates

### Invalidate Cache

```typescript
import { BannerService } from "@/lib/services/banner.service";

// Invalidate all banners
await BannerService.invalidateCache();

// Invalidate specific banner
await BannerService.invalidateCache("banner-id");
```

### Lazy Loading

Banners are lazy-loaded after scan results to prevent blocking:
- Components use dynamic imports
- SSR disabled for banner components
- No impact on initial page load

---

## Troubleshooting

### Banners Not Showing

1. **Check database**: `npm run db:studio`
   - Verify banners exist
   - Check `is_active = true`
   - Verify targeting rules match user

2. **Check console**: Look for errors in browser console
   - API errors from `/api/banners/select`
   - Network failures
   - Component errors

3. **Check Redis**: Verify Redis connection
   - Test with: `await redis.get("test")`
   - Check environment variables

4. **Check targeting**:
   - User type matches `targetUserType`
   - Scan count within `minScans`/`maxScans` range
   - Frequency cap not exceeded

### Low CTR

1. **Improve copy**: Test different headlines and CTAs
2. **Better targeting**: Narrow user type and scan count
3. **A/B test**: Create variants and measure performance
4. **Visual design**: Update colors, add images
5. **Placement**: Try different placements

### High Dismissal Rate

1. **Reduce frequency**: Lower `frequencyCap`
2. **Better timing**: Adjust `minScans` threshold
3. **Improve relevance**: Tighten targeting rules
4. **Value proposition**: Clearer benefits in copy

---

## External Ad Networks (Phase 2)

### Cointraffic Integration

**Step 1:** Sign up at https://cointraffic.io

**Step 2:** Get ad unit ID from dashboard

**Step 3:** Create external banner:
```typescript
await db.insert(banners).values({
  name: "cointraffic_leaderboard",
  type: "partner_ad",
  category: "partnership",
  placement: "top_leaderboard",
  priority: 5,
  targetUserType: "all",
  isExternal: true,
  partnerName: "Cointraffic",
  partnerScriptUrl: "https://cdn.cointraffic.io/js/ct.js",
  partnerAdUnitId: "YOUR_AD_UNIT_ID",
  cpmRate: 250, // $2.50 in cents
  headline: "Partner Advertisement",
  ctaText: "",
  ctaUrl: "",
  isActive: true,
});
```

**Step 4:** Configure webhook in Cointraffic dashboard:
```
Webhook URL: https://yourdomain.com/api/webhooks/cointraffic
```

---

## Next Steps

### Week 1 (MVP)
- [x] Database schema
- [x] Core components
- [x] API routes
- [x] 5 initial banners
- [ ] Integration testing
- [ ] Deploy to staging

### Week 2 (Optimization)
- [ ] A/B test 10 variants
- [ ] Optimize copy and design
- [ ] Add animated banners
- [ ] Performance monitoring

### Week 3 (External Ads)
- [ ] Cointraffic integration
- [ ] Revenue tracking
- [ ] GDPR consent
- [ ] Analytics dashboard

### Week 4 (Advanced)
- [ ] Dynamic banners (real-time stats)
- [ ] Geo-targeting
- [ ] Advanced personalization
- [ ] Documentation & handoff

---

## Support

- **Issues**: https://github.com/neorimia/contractguard-ai/issues
- **Design Spec**: `docs/BANNER_SYSTEM_DESIGN.md`
- **Database Schema**: `db/schema.ts`
- **Service Layer**: `lib/services/banner.service.ts`
