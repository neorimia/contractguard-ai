# Gamified Referral System - Setup Guide

## Quick Start (5 minutes)

### 1. Run Database Migration

```bash
# Generate and push migration
npm run db:push

# Or if using drizzle-kit
npx drizzle-kit push:pg
```

This will create:

- `referral_commissions` table
- `referral_tier_achievements` table
- `social_proof_stats` table
- New columns in `users` table
- Performance indexes

### 2. Verify Migration

Check that all tables and indexes were created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('referral_commissions', 'referral_tier_achievements', 'social_proof_stats');

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('referral_commissions', 'referral_tier_achievements', 'social_proof_stats');
```

### 3. Test API Endpoints

```bash
# Test leaderboard (public)
curl https://your-domain.com/api/referrals/leaderboard

# Test social proof (public)
curl https://your-domain.com/api/referrals/social-proof

# Test dashboard (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.com/api/referrals/dashboard
```

### 4. Add Components to Your Pages

**Referral Dashboard Page** (`app/(app)/referrals/page.tsx`):

```tsx
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";
import { Leaderboard } from "@/components/referrals/Leaderboard";

export default function ReferralsPage() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">My Referrals</h1>
        <ReferralDashboard />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Leaderboard</h2>
        <Leaderboard limit={100} />
      </div>
    </div>
  );
}
```

**Landing Page Social Proof** (`app/(marketing)/page.tsx`):

```tsx
import { SocialProof } from "@/components/referrals/SocialProof";

export default function LandingPage() {
  return (
    <div>
      {/* After hero section */}
      <section className="py-8">
        <SocialProof variant="banner" />
      </section>

      {/* In footer */}
      <footer>
        <SocialProof variant="footer" />
      </footer>
    </div>
  );
}
```

### 5. Test Tier Progression

Create a test script to simulate referrals:

```typescript
// scripts/test-tier-progression.ts
import { ReferralGamificationService } from "@/lib/services/referral-gamification.service";

const gamificationService = new ReferralGamificationService();

// Simulate 3 referrals for a user
const userId = 1; // Your test user ID

const result = await gamificationService.updateUserTier(userId);

console.log("Tier update result:", result);
// Should show: tierChanged: true, newTier: 'bronze'
```

Run it:

```bash
npx tsx scripts/test-tier-progression.ts
```

---

## Configuration Options

### Adjust Tier Requirements

Edit `lib/referrals/gamification-config.ts`:

```typescript
export const REFERRAL_TIERS = {
  bronze: {
    referralsRequired: 5, // Change from 3
    // ...
  },
};
```

### Modify Commission Rates

```typescript
ambassador: {
  commissionRate: 0.25; // Change from 20% to 25%
}
```

### Update Leaderboard Settings

```typescript
export const LEADERBOARD_CONFIG = {
  topCount: 50, // Show top 50 instead of 100
  updateInterval: 1800, // Update every 30min instead of 1hr
  cacheTTL: 600, // Cache for 10min instead of 5min
};
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Viral Coefficient**: Check `/api/referrals/social-proof`
   - Target: 1.3
   - Formula: Total referrals / Total users

2. **Tier Distribution**: Query database

   ```sql
   SELECT referral_tier, COUNT(*)
   FROM users
   GROUP BY referral_tier
   ORDER BY COUNT(*) DESC;
   ```

3. **Commission Costs**: Query commissions table

   ```sql
   SELECT
     SUM(monthly_commission) as monthly_cost,
     SUM(total_earned) as lifetime_cost,
     COUNT(*) as active_commissions
   FROM referral_commissions
   WHERE status = 'active';
   ```

4. **Top Referrers**: Use leaderboard API
   ```bash
   curl https://your-domain.com/api/referrals/leaderboard?limit=10
   ```

### Set Up Alerts

Create monitoring alerts for:

- Commission costs exceeding budget ($500/month threshold)
- Viral coefficient dropping below 1.0
- Leaderboard API response time > 2s
- Tier achievement email failures

---

## Troubleshooting

### Issue: Tiers not updating

**Check:**

1. Is `referralCount` incrementing in users table?
2. Are referrals marked as 'confirmed' or 'rewarded'?
3. Is `updateUserTier()` being called after `confirmReferral()`?

**Fix:**

```typescript
// Manually update a user's tier
const result = await gamificationService.updateUserTier(userId);
console.log(result);
```

### Issue: Commissions not created

**Check:**

1. Is Stripe webhook receiving `customer.subscription.created`?
2. Does the user have a referral record?
3. Is subscription amount > 0?

**Debug:**

```typescript
// Check referral exists
const [referral] = await db
  .select()
  .from(referrals)
  .where(eq(referrals.referredId, userId))
  .limit(1);

console.log("Referral:", referral);

// Check subscription data
console.log(
  "Subscription amount:",
  subscription.items.data[0]?.price.unit_amount
);
```

### Issue: Leaderboard empty

**Check:**

1. Do users have `referralCount > 0`?
2. Is the database query working?

**Fix:**

```sql
-- Update referral counts for existing users
UPDATE users u
SET referral_count = (
  SELECT COUNT(*)
  FROM referrals r
  WHERE r.referrer_id = u.id
  AND r.status IN ('confirmed', 'rewarded')
);
```

### Issue: Social proof shows zeros

**Check:**

1. Do you have audits in the database?
2. Are users being counted correctly?

**Populate test data:**

```sql
-- Create test social proof stats
INSERT INTO social_proof_stats (
  date, period, total_users_joined, total_scams_avoided,
  estimated_savings_usd, total_referrals
) VALUES (
  NOW(), 'all_time', 1000, 50, 250000, 300
);
```

---

## Performance Optimization

### Cache Leaderboard

Add Redis caching to leaderboard API:

```typescript
// app/api/referrals/leaderboard/route.ts
import { redis } from "@/lib/redis";

const cacheKey = `leaderboard:${limit}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return NextResponse.json(JSON.parse(cached));
}

const leaderboard = await gamificationService.getLeaderboard(limit);

await redis.setex(cacheKey, 300, JSON.stringify(leaderboard)); // 5min cache

return NextResponse.json(leaderboard);
```

### Index Optimization

Ensure these indexes exist:

```sql
CREATE INDEX IF NOT EXISTS idx_users_referral_count
  ON users(referral_count DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_commissions_status
  ON referral_commissions(status);
```

---

## Security Considerations

### Prevent Abuse

1. **Rate Limiting**: Add rate limits to leaderboard API

   ```typescript
   // Max 10 requests per minute per IP
   ```

2. **Referral Validation**: Already implemented in `AntiFraudService`
   - Same IP check
   - Disposable email check
   - Account age verification

3. **Commission Caps**: Set maximum commission per user
   ```typescript
   const MAX_MONTHLY_COMMISSION = 50000; // $500 max per month
   ```

### Data Privacy

- Leaderboard anonymizes users with < 10 referrals
- Social proof aggregates data without exposing individuals
- Commission amounts are private (not shown publicly)

---

## Marketing Launch

### Announcement Email

Send to existing users:

```
Subject: 🎉 Introducing: ContractGuard Referral Tiers!

Body:
We've just launched our new tiered referral program!

Refer friends and unlock exclusive rewards:
🥉 Bronze (3 referrals): 1 week Pro trial
🥈 Silver (10 referrals): 1 month Pro free
🥇 Gold (25 referrals): 3 months Pro free
💎 Platinum (50 referrals): Lifetime Pro access
👑 Ambassador (100 referrals): Lifetime Pro + 20% commission

View your dashboard: [CTA Button]
```

### Social Media Posts

**Twitter:**

```
🚀 New Feature: Referral Tiers!

Refer crypto friends to ContractGuard AI and unlock:
🥉 Bronze → Free trial
🥈 Silver → Pro month
🥇 Gold → 3 months free
💎 Platinum → Lifetime Pro
👑 Ambassador → 20% commission

Ready to climb the leaderboard? 👇
[Link]
```

### Landing Page Updates

Add these sections:

1. Hero banner with "Join 1,000+ users protected"
2. Referral tier showcase
3. Leaderboard preview (top 10)
4. Testimonials from top referrers

---

## Next Steps

1. **Week 1**: Deploy and monitor metrics
2. **Week 2**: A/B test tier thresholds
3. **Week 3**: Launch first referral contest
4. **Month 2**: Analyze ROI and optimize

---

## Support

Questions or issues?

- Email: support@contractguard.ai
- Slack: #referral-system
- Docs: /docs/referrals

---

**Last Updated**: October 11, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
