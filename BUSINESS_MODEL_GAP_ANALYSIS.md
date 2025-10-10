# Business Model Implementation Gap Analysis & Workflow

**Project**: ContractGuard AI
**Analysis Date**: 2025-01-10
**Status**: 7/10 Implementation Complete
**Documents Analyzed**:
- `obsidian-vault/14-Business-Model.md`
- `obsidian-vault/VC-pricing-grade-assessment.md`

---

## Executive Summary

**Current State**: ✅ Strong foundation with hybrid monetization infrastructure in place
**Gap Assessment**: ❌ Missing critical conversion optimization features and revenue tiers
**Priority Action**: Implement progressive signup flow and STARTER tier (Week 1-2)
**Estimated Timeline**: 6 weeks to full alignment
**Revenue Impact**: +20-30% conversion with recommended changes

### Key Findings

| Category | Status | Impact |
|----------|--------|--------|
| Core Infrastructure | ✅ 95% Complete | Foundation solid |
| Revenue Tiers | ⚠️ 60% Complete | Missing STARTER tier |
| Signup Flow | ❌ 0% Complete | Critical gap |
| Referral System | ⚠️ 40% Complete | Basic structure only |
| Anti-Fraud | ⚠️ 20% Complete | High risk |
| Pricing Optimization | ❌ 0% Complete | Revenue opportunity |

---

## Detailed Gap Analysis

### ✅ IMPLEMENTED (What's Working)

#### 1. Core Hybrid Monetization Infrastructure
**Status**: Production Ready
**Files**: `db/schema.ts`, `lib/services/access-validation.service.ts`, `app/api/user/usage/route.ts`

- ✅ Three-tier access system (subscription → instant credits → free)
- ✅ Priority-based access validation with consumeScan logic
- ✅ Instant credits system with purchase tracking
- ✅ Guest user support for anonymous purchases
- ✅ Daily reset mechanism for free tier
- ✅ Usage API with comprehensive access summary
- ✅ Credits API for balance tracking
- ✅ Stripe webhook integration for payments

#### 2. Database Schema
**Status**: Complete
**File**: `db/schema.ts`

- ✅ Users table with tier, credits, referral fields
- ✅ Referrals table with status tracking
- ✅ ReferralEvents table for anti-fraud data capture
- ✅ RewardsLedger for reward tracking
- ✅ Purchases table for transaction history
- ✅ Guest session support (guestSessionId, isGuest)

#### 3. Basic Referral Infrastructure
**Status**: Foundation Ready
**Files**: `lib/services/referral.service.ts`, `db/schema.ts`

- ✅ Referral code generation and storage
- ✅ Referral tracking tables with relationships
- ✅ Event tracking infrastructure
- ✅ Rewards ledger for future distribution

---

### ❌ MISSING FEATURES (Critical Gaps)

#### 1. Progressive Signup Flow ⚡ CRITICAL
**Business Model Requirement**: Anonymous → Soft → Hard signup
**Current State**: All scans require full account creation
**Impact**: 30-50% user drop-off (per VC assessment)
**Priority**: 🔴 Phase 1 - Week 1

**Recommended Flow**:
```
Scan 1: Anonymous (no account) → Full report shown → "Save this scan" CTA
Scan 2-3: Soft signup (email only, magic link)
Scan 4+: Hard signup (full account with password/OAuth) OR paywall
```

**Why This Matters**:
- Captures impulse users who distrust account requirements
- Builds trust before asking for commitment
- Crypto users are privacy-focused and anti-KYC
- Increases top-of-funnel conversions by 40-60%

**Technical Requirements**:
- Cookie-based session tracking for anonymous users
- Soft signup endpoint (email-only registration)
- Migration path from anonymous → soft → hard accounts
- Updated access validation to support anonymous tier

---

#### 2. STARTER Tier (€9/mo for 30 scans) ⚡ HIGH PRIORITY
**Business Model Requirement**: Capture "regular users" (10-20 scans/month)
**Current State**: Only FREE (3/day), PRO (€29 unlimited), TEAM (€99)
**Impact**: Missing 40% of potential paid users
**Priority**: 🔴 Phase 1 - Week 1

**Gap Analysis**:
```
Current Pricing:
- FREE: 3/day → Good for casual users
- PRO: €29/mo unlimited → Only for power users (50+ scans/mo)
- Missing: Regular users who scan 10-30 times/month

Problem:
- User scanning 15x/month pays €29 → €1.93/scan (feels wasteful)
- User buying pay-per-scan 15x → €74.85 → Too expensive
- Result: User churns or stays on frustrating free tier
```

**Recommended Pricing**:
```typescript
starter: {
  price: 9, // €9/month
  scans: 30, // 30 scans per month
  resetInterval: 'monthly',
  perks: [
    '30 scans per month',
    'Detailed risk reports',
    'Scan history',
    'Email alerts',
    'No ads'
  ]
}
```

**Revenue Impact**:
- Captures users who need 10-30 scans/month
- Better unit economics: €9/30 = €0.30/scan vs €4.99 pay-per-scan
- Estimated +40% paid user conversion
- Monthly recurring revenue (MRR) boost

---

#### 3. Gamified Referral System ⚡ HIGH PRIORITY
**Business Model Requirement**: Bronze/Silver/Gold/Platinum/Ambassador tiers
**Current State**: Basic referral code tracking only
**Impact**: Low viral coefficient (current: ~0.5, target: 1.3)
**Priority**: 🟡 Phase 2 - Week 3

**What's Missing**:

**A. Tiered Reward System**:
```typescript
// Current: No gamification
referralCode: string // Just stores code

// Required: Gamified progression
referralTiers = {
  bronze: { referrals: 3, reward: '1 week Pro trial', badge: '🥉' },
  silver: { referrals: 10, reward: '1 month Pro free', badge: '🥈' },
  gold: { referrals: 25, reward: '3 months Pro free', badge: '🥇' },
  platinum: { referrals: 50, reward: 'Lifetime Pro', badge: '💎' },
  ambassador: { referrals: 100, reward: 'Lifetime Pro + 20% commission', badge: '👑' }
}
```

**B. Leaderboard System**:
```typescript
// Missing: Public leaderboard for competition
interface Leaderboard {
  topReferrers: Array<{
    username: string,
    referralCount: number,
    tier: string,
    badge: string
  }>,
  userRank?: number,
  nextTierProgress: number
}
```

**C. Social Proof Widgets**:
```typescript
// Missing: Viral sharing incentives
interface SocialProof {
  totalUsersJoined: number,
  totalScamsAvoided: number,
  estimatedSavings: string, // "Users saved $2.5M using ContractGuard"
  friendActivity: string // "Your friend @cryptowhale saved $12,500"
}
```

**D. Recurring Commission System** (10% for Pro upgrades):
```typescript
// Missing: Commission tracking and payout
interface ReferralCommission {
  referrerId: number,
  referredUserId: number,
  subscriptionTier: 'pro' | 'team',
  monthlyCommission: number, // 10% of subscription
  totalEarned: number,
  status: 'active' | 'pending' | 'paid',
  nextPayoutDate: Date
}
```

**Why This Matters**:
- Viral coefficient 1.3 means exponential growth
- Each user brings 1.3 new users → 10 users → 13 → 17 → 22 → 29...
- Gamification drives 3-5x more sharing than simple rewards
- Crypto community has strong referral culture

---

#### 4. Anti-Fraud Mechanisms ⚡ MEDIUM PRIORITY
**Business Model Requirement**: Email verification, IP fingerprinting, behavioral checks
**Current State**: Basic data capture, no validation
**Impact**: 10-15% fraud rate = €12-20K wasted by Month 12
**Priority**: 🔴 Phase 1 - Week 2

**What's Missing**:

**A. Fraud Detection Logic**:
```typescript
// Current: Data captured but not validated
referralEvents table // Has IP, userAgent, fingerprint but no checks

// Required: Active fraud prevention
interface FraudCheck {
  sameIPAsReferrer: boolean,      // Block if true
  sameDeviceAsReferrer: boolean,  // Block if true
  disposableEmail: boolean,       // Block if true
  completedFirstScan: boolean,    // Require true for reward
  signupTooFast: boolean,         // <60 sec = suspicious
  emailVerified: boolean          // Must be true
}
```

**B. Reward Delay Mechanism**:
```typescript
// Missing: Delayed reward activation
rewardActivation: {
  immediate: false, // Don't give rewards immediately
  requirements: [
    'email_verified',
    'first_scan_completed',
    'account_age_7_days',
    'different_ip_from_referrer',
    'different_device_from_referrer'
  ],
  activateAfter: '7 days'
}
```

**C. Email Domain Validation**:
```typescript
// Missing: Disposable email detection
const DISPOSABLE_EMAIL_DOMAINS = [
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'throwaway.email'
  // ... 500+ disposable domains
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}
```

**Cost of Not Implementing**:
- 10% fraud rate on 40,000 referrals = 4,000 fake accounts
- 4,000 × €3 reward cost = €12,000 wasted
- Plus AI analysis costs for fake scans = €6,000
- **Total loss**: €18,000 by Month 12

---

#### 5. Annual Subscription Options ⚠️ MEDIUM IMPACT
**Business Model Requirement**: Annual plans with 28% discount
**Current State**: Monthly only
**Impact**: Missing cash flow optimization and churn reduction
**Priority**: 🟡 Phase 2 - Week 3

**What's Missing**:
```typescript
// Current
pro: { price: 29, interval: 'month' }

// Required
pro: {
  monthly: { price: 29, interval: 'month' },
  annual: {
    price: 249, // €20.75/mo effective (28% discount)
    interval: 'year',
    savings: '€99/year',
    popular: true
  }
}

starter: {
  monthly: { price: 9, interval: 'month' },
  annual: { price: 89, interval: 'year' } // 17% discount
}
```

**Benefits**:
- Upfront cash flow: €249 vs €29/mo
- Reduces monthly churn by 60-70%
- User psychology: "Already paid, might as well use it"
- Better LTV calculation for investor metrics

---

#### 6. Geo-Based Pricing ⚠️ LOW PRIORITY
**Business Model Requirement**: Localized pricing for different regions
**Current State**: Single EUR pricing globally
**Impact**: +20-30% revenue with optimized regional pricing
**Priority**: 🟢 Phase 3 - Week 4

**What's Missing**:
```typescript
// Current: One price for all
pro: { price: 29 } // EUR for everyone

// Required: Regional pricing
const REGIONAL_PRICING = {
  'US': { pro: 39, starter: 12, currency: 'usd' },      // +35%
  'EU_WEST': { pro: 29, starter: 9, currency: 'eur' },  // Baseline
  'EU_EAST': { pro: 19, starter: 6, currency: 'eur' },  // -34%
  'LATAM': { pro: 15, starter: 5, currency: 'usd' },    // -48%
  'ASIA': { pro: 12, starter: 4, currency: 'usd' }      // -60%
};

function getPricing(userIP: string) {
  const country = geolocate(userIP);
  const region = mapCountryToRegion(country);
  return REGIONAL_PRICING[region];
}
```

**Revenue Impact**:
- US users: +35% revenue per user ($39 vs €29)
- Emerging markets: +100-200% user growth with lower prices
- Net effect: +20-30% total revenue

---

#### 7. Contract Monitoring & Alerts (Pro Feature) ⚠️ MEDIUM PRIORITY
**Business Model Requirement**: Listed as Pro tier feature
**Current State**: Not implemented
**Impact**: Differentiation and retention feature
**Priority**: 🟢 Phase 3 - Week 5

**What's Missing**:

**A. Watched Contracts System**:
```typescript
// New table needed
contractWatches = {
  id: uuid,
  userId: number,
  contractAddress: string,
  chain: string,
  alertTriggers: {
    ownershipChange: boolean,
    liquidityDrop: boolean,
    holderCountChange: number, // Alert if drops by X%
    riskScoreIncrease: boolean
  },
  lastChecked: timestamp,
  alertsSent: number,
  isActive: boolean
}
```

**B. Monitoring Service**:
```typescript
// New service: Contract monitoring cron job
class ContractMonitoringService {
  async checkWatchedContracts() {
    // Run every 15 minutes for Pro users
    // Check each watched contract for changes
    // Send email/push notification on trigger
  }
}
```

**C. Alert Delivery**:
- Email notifications
- Optional: SMS alerts (premium)
- Optional: Discord/Telegram webhook

---

#### 8. Saved Scam Tracker (Viral Feature) 🟢 LOW PRIORITY
**Business Model Requirement**: Social sharing widget
**Current State**: Not implemented
**Impact**: Increases viral coefficient through social proof
**Priority**: 🟢 Phase 3 - Week 5

**What's Missing**:
```typescript
// User dashboard widget
interface ScamTracker {
  totalScansPerformed: number,
  highRiskContractsFound: number,
  estimatedSavings: number, // Sum of liquidity from high-risk contracts
  shareButton: {
    text: "I avoided $8.5K in scams using @ContractGuardAI",
    includesReferralLink: true,
    platforms: ['twitter', 'telegram', 'discord']
  }
}
```

---

## Implementation Roadmap

### Phase 1: Critical Revenue Features (Week 1-2) 🔴
**Goal**: Maximize conversion rate and capture mid-market users
**Estimated Effort**: 60-80 hours
**Revenue Impact**: +25-40% conversion

#### Week 1: Progressive Signup Flow

**Task 1.1: Anonymous Scan Support** (8h)
- Add cookie-based session tracking
- Create anonymous scan API endpoint
- Store results with 24h cookie expiration
- Add "Save this scan" CTA after results

**Task 1.2: Soft Signup Flow** (6h)
- Email-only registration endpoint
- Magic link authentication
- Migrate anonymous scans to soft account
- Update UI with email prompt after 2-3 scans

**Task 1.3: Hard Signup Trigger** (4h)
- Implement scan counter for soft accounts
- Trigger full signup after 3 scans OR paywall
- OAuth integration (Google, wallet)
- Account migration logic

**Task 1.4: Access Validation Updates** (6h)
```typescript
// Update access-validation.service.ts
validateAnonymousAccess(sessionId: string) // New method
validateSoftAccess(email: string) // New method
// Update priority: subscription → instant → soft → anonymous → paywall
```

**Files to Modify**:
- `lib/services/access-validation.service.ts`
- `app/api/audit/route.ts`
- `db/schema.ts` (add anonymousSessionId, softSignupEmail fields)
- `lib/middleware/session-tracking.ts` (new file)

---

#### Week 2: STARTER Tier & Anti-Fraud

**Task 2.1: STARTER Tier Implementation** (8h)

**Database Changes**:
```typescript
// Update db/schema.ts
tier: 'free' | 'starter' | 'pro' | 'enterprise'
monthlyScansLimit: number // For starter tier
monthlyScansUsed: number
monthlyResetAt: timestamp
```

**Pricing Configuration**:
```typescript
// Update lib/config/pricing.ts
starter: {
  id: 'starter_monthly',
  label: 'Starter Plan',
  type: 'subscription',
  price: 9,
  stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  interval: 'month',
  scansPerMonth: 30,
  perks: [
    '30 scans per month',
    'Detailed risk reports',
    'Scan history',
    'Email alerts',
    'Priority support'
  ]
}
```

**Access Validation Update**:
```typescript
// lib/services/access-validation.service.ts
async validateAccess(userId: number) {
  // Priority: pro/enterprise → starter (check monthly limit) → instant → free

  if (user.tier === 'starter') {
    const now = new Date();
    if (now >= user.monthlyResetAt) {
      await this.resetMonthlyScans(userId);
    }

    const scansRemaining = 30 - (user.monthlyScansUsed || 0);
    if (scansRemaining > 0) {
      return { hasAccess: true, accessType: 'starter', scansRemaining };
    }
    // Fall through to instant credits
  }
}
```

**Task 2.2: Anti-Fraud Implementation** (10h)

**Fraud Detection Service**:
```typescript
// lib/services/fraud-detection.service.ts
export class FraudDetectionService {

  async validateReferral(
    referral: NewReferral,
    referrer: User
  ): Promise<{ valid: boolean; reason?: string }> {

    // 1. IP Check
    if (referral.signupIp === referrer.lastLoginIp) {
      return { valid: false, reason: 'Same IP as referrer' };
    }

    // 2. Device Fingerprint Check
    if (referral.fingerprint === referrer.deviceFingerprint) {
      return { valid: false, reason: 'Same device as referrer' };
    }

    // 3. Disposable Email Check
    if (this.isDisposableEmail(referral.email)) {
      return { valid: false, reason: 'Disposable email detected' };
    }

    // 4. Timing Check (signup <60s after referral click)
    const timeDiff = referral.signupAt - referral.clickedAt;
    if (timeDiff < 60000) {
      return { valid: false, reason: 'Signup too fast' };
    }

    // 5. Email Verification Required
    if (!referral.emailVerified) {
      return { valid: false, reason: 'Email not verified' };
    }

    return { valid: true };
  }

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1];
    return DISPOSABLE_DOMAINS.includes(domain);
  }
}
```

**Reward Delay Logic**:
```typescript
// lib/services/referral.service.ts
async confirmReferral(referralId: string) {
  const referral = await getReferral(referralId);
  const referrer = await getUser(referral.referrerId);

  // Fraud check
  const fraudCheck = await fraudDetectionService.validateReferral(
    referral,
    referrer
  );

  if (!fraudCheck.valid) {
    await updateReferral(referralId, {
      status: 'cancelled',
      metadata: { cancelReason: fraudCheck.reason }
    });
    return;
  }

  // Check if referred user completed first scan
  const scans = await getUserScans(referral.referredId);
  if (scans.length === 0) {
    return; // Don't confirm yet, wait for first scan
  }

  // Check 7-day waiting period
  const accountAge = Date.now() - referral.createdAt;
  if (accountAge < 7 * 24 * 60 * 60 * 1000) {
    return; // Wait for 7 days
  }

  // All checks passed - distribute reward
  await updateReferral(referralId, {
    status: 'confirmed',
    confirmedAt: new Date()
  });

  await this.distributeReferralReward(referral);
}
```

**Files to Create/Modify**:
- `lib/services/fraud-detection.service.ts` (new)
- `lib/config/disposable-domains.ts` (new - list of 500+ disposable email domains)
- `lib/services/referral.service.ts` (update confirmation logic)
- `app/api/referrals/confirm/route.ts` (new endpoint)

---

### Phase 2: Referral Gamification (Week 3) 🟡
**Goal**: Increase viral coefficient from 0.5 → 1.2-1.5
**Estimated Effort**: 40 hours
**Growth Impact**: 3-5x referral sharing rate

**Task 3.1: Tiered Referral System** (12h)

**Database Schema**:
```typescript
// Add to db/schema.ts - users table
referralTier: text, // 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ambassador'
referralCount: integer, // Cache of confirmed referrals
lifetimeCommissionEarned: integer, // In cents

// New table: referral_commissions
referralCommissions = {
  id: uuid,
  referrerId: integer, // references users.id
  referredUserId: integer,
  subscriptionTier: text, // 'pro' | 'team' | 'starter'
  monthlyAmount: integer, // 10% of subscription in cents
  totalPaid: integer,
  status: text, // 'active' | 'paused' | 'ended'
  startedAt: timestamp,
  endedAt: timestamp,
  nextPayoutDate: timestamp
}
```

**Tier Configuration**:
```typescript
// lib/config/referral-tiers.ts
export const REFERRAL_TIERS = {
  bronze: {
    referralsRequired: 3,
    reward: { type: 'trial', duration: 7, tier: 'pro' },
    badge: '🥉',
    label: 'Bronze Advocate',
    perks: ['1 week Pro trial', '+1 bonus scan per referral']
  },
  silver: {
    referralsRequired: 10,
    reward: { type: 'subscription', duration: 30, tier: 'pro' },
    badge: '🥈',
    label: 'Silver Advocate',
    perks: ['1 month Pro free', '+2 bonus scans per referral']
  },
  gold: {
    referralsRequired: 25,
    reward: { type: 'subscription', duration: 90, tier: 'pro' },
    badge: '🥇',
    label: 'Gold Advocate',
    perks: ['3 months Pro free', 'Featured on homepage']
  },
  platinum: {
    referralsRequired: 50,
    reward: { type: 'lifetime', tier: 'pro' },
    badge: '💎',
    label: 'Platinum Advocate',
    perks: ['Lifetime Pro access', 'Exclusive Discord channel']
  },
  ambassador: {
    referralsRequired: 100,
    reward: { type: 'lifetime_plus_commission', tier: 'pro', commission: 0.2 },
    badge: '👑',
    label: 'ContractGuard Ambassador',
    perks: ['Lifetime Pro', '20% recurring commission', 'Direct support line']
  }
} as const;
```

**Tier Progression Service**:
```typescript
// lib/services/referral-tier.service.ts
export class ReferralTierService {

  async updateUserTier(userId: number) {
    const user = await getUser(userId);
    const confirmedReferrals = await getConfirmedReferralCount(userId);

    let newTier = 'none';
    for (const [tierName, config] of Object.entries(REFERRAL_TIERS)) {
      if (confirmedReferrals >= config.referralsRequired) {
        newTier = tierName;
      }
    }

    if (newTier !== user.referralTier) {
      await this.promoteTier(userId, newTier);
      await this.distributeReward(userId, newTier);
      await this.sendCelebrationEmail(userId, newTier);
    }

    await db.update(users)
      .set({
        referralTier: newTier,
        referralCount: confirmedReferrals
      })
      .where(eq(users.id, userId));
  }

  private async distributeReward(userId: number, tier: string) {
    const config = REFERRAL_TIERS[tier];

    switch (config.reward.type) {
      case 'trial':
        await this.grantProTrial(userId, config.reward.duration);
        break;
      case 'subscription':
        await this.grantProSubscription(userId, config.reward.duration);
        break;
      case 'lifetime':
        await this.grantLifetimePro(userId);
        break;
      case 'lifetime_plus_commission':
        await this.grantLifetimePro(userId);
        await this.enableCommissions(userId, config.reward.commission);
        break;
    }
  }
}
```

**Task 3.2: Leaderboard System** (8h)

**API Endpoint**:
```typescript
// app/api/referrals/leaderboard/route.ts
export async function GET(req: NextRequest) {
  // Get top 100 referrers
  const topReferrers = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      referralCount: users.referralCount,
      tier: users.referralTier,
      badge: sql`CASE
        WHEN referral_tier = 'ambassador' THEN '👑'
        WHEN referral_tier = 'platinum' THEN '💎'
        WHEN referral_tier = 'gold' THEN '🥇'
        WHEN referral_tier = 'silver' THEN '🥈'
        WHEN referral_tier = 'bronze' THEN '🥉'
        ELSE ''
      END`
    })
    .from(users)
    .where(gt(users.referralCount, 0))
    .orderBy(desc(users.referralCount))
    .limit(100);

  // Get current user's rank
  const currentUser = await stackServerApp.getUser();
  if (currentUser) {
    const userRank = await this.getUserRank(currentUser.id);
    return { topReferrers, userRank };
  }

  return { topReferrers };
}
```

**UI Component**:
```tsx
// components/referral/Leaderboard.tsx
export function ReferralLeaderboard() {
  return (
    <div className="space-y-4">
      <h2>Top Referrers This Month 🏆</h2>

      {topReferrers.map((user, index) => (
        <div key={user.userId} className="flex items-center gap-4">
          <span className="text-2xl">#{index + 1}</span>
          <span className="text-3xl">{user.badge}</span>
          <div>
            <p className="font-bold">{user.displayName}</p>
            <p className="text-sm text-gray-600">
              {user.referralCount} referrals · {user.tier}
            </p>
          </div>
        </div>
      ))}

      {userRank && (
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p>Your Rank: #{userRank.position}</p>
          <p>Next tier: {userRank.nextTier} ({userRank.referralsNeeded} more referrals)</p>
        </div>
      )}
    </div>
  );
}
```

**Task 3.3: Commission System** (12h)

**Commission Calculation Service**:
```typescript
// lib/services/commission.service.ts
export class CommissionService {

  async createCommission(referrerId: number, referredUserId: number) {
    const referredUser = await getUser(referredUserId);

    // Only create commission if user has paid subscription
    if (!['pro', 'team', 'starter'].includes(referredUser.tier)) {
      return;
    }

    // Check if referrer is ambassador (eligible for 20% commission)
    const referrer = await getUser(referrerId);
    if (referrer.referralTier !== 'ambassador') {
      return; // Only ambassadors get recurring commission
    }

    const subscriptionPrice = this.getSubscriptionPrice(referredUser.tier);
    const monthlyCommission = Math.floor(subscriptionPrice * 0.20); // 20%

    await db.insert(referralCommissions).values({
      referrerId,
      referredUserId,
      subscriptionTier: referredUser.tier,
      monthlyAmount: monthlyCommission,
      totalPaid: 0,
      status: 'active',
      startedAt: new Date(),
      nextPayoutDate: this.getNextPayoutDate()
    });
  }

  async processMonthlyPayouts() {
    // Run on 1st of each month
    const dueCommissions = await db
      .select()
      .from(referralCommissions)
      .where(
        and(
          eq(referralCommissions.status, 'active'),
          lte(referralCommissions.nextPayoutDate, new Date())
        )
      );

    for (const commission of dueCommissions) {
      // Verify referred user still has active subscription
      const referredUser = await getUser(commission.referredUserId);
      if (!['pro', 'team', 'starter'].includes(referredUser.tier)) {
        // Subscription cancelled - end commission
        await db.update(referralCommissions)
          .set({ status: 'ended', endedAt: new Date() })
          .where(eq(referralCommissions.id, commission.id));
        continue;
      }

      // Pay commission (add to ambassador's instant credits)
      const creditAmount = Math.floor(commission.monthlyAmount / 499); // Convert cents to credits

      await db.update(users)
        .set({
          instantCredits: sql`${users.instantCredits} + ${creditAmount}`,
          lifetimeCommissionEarned: sql`${users.lifetimeCommissionEarned} + ${commission.monthlyAmount}`
        })
        .where(eq(users.id, commission.referrerId));

      // Update commission record
      await db.update(referralCommissions)
        .set({
          totalPaid: sql`${referralCommissions.totalPaid} + ${commission.monthlyAmount}`,
          nextPayoutDate: this.getNextPayoutDate()
        })
        .where(eq(referralCommissions.id, commission.id));

      // Send payout notification
      await this.sendPayoutEmail(commission.referrerId, commission.monthlyAmount);
    }
  }

  private getSubscriptionPrice(tier: string): number {
    return {
      starter: 900,  // €9 in cents
      pro: 2900,     // €29 in cents
      team: 9900     // €99 in cents
    }[tier] || 0;
  }
}
```

**Cron Job Setup**:
```typescript
// lib/cron/monthly-commissions.ts
// Run via Vercel Cron or external service (Upstash QStash)

export async function processMonthlyCommissions() {
  const commissionService = new CommissionService();

  try {
    await commissionService.processMonthlyPayouts();
    console.log('Monthly commissions processed successfully');
  } catch (error) {
    console.error('Commission processing failed:', error);
    // Alert admin
  }
}

// Vercel cron config (vercel.json)
{
  "crons": [{
    "path": "/api/cron/commissions",
    "schedule": "0 0 1 * *" // 1st of each month at midnight
  }]
}
```

**Task 3.4: Annual Subscription Options** (8h)

**Pricing Updates**:
```typescript
// lib/config/pricing.ts - Add annual options
export const PRICING_CONFIG = {
  // ... existing instant pricing

  starter: {
    monthly: {
      id: 'starter_monthly',
      price: 9,
      stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      interval: 'month'
    },
    annual: {
      id: 'starter_annual',
      price: 89,
      stripePriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
      interval: 'year',
      monthlyEquivalent: 7.42,
      savings: '€19 (17% off)',
      popular: false
    }
  },

  pro: {
    monthly: {
      id: 'pro_monthly',
      price: 29,
      stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
      interval: 'month'
    },
    annual: {
      id: 'pro_annual',
      price: 249,
      stripePriceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
      interval: 'year',
      monthlyEquivalent: 20.75,
      savings: '€99 (28% off)',
      popular: true // Highlight this option
    }
  },

  team: {
    monthly: {
      id: 'team_monthly',
      price: 99,
      stripePriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY,
      interval: 'month'
    },
    annual: {
      id: 'team_annual',
      price: 999,
      stripePriceId: process.env.STRIPE_PRICE_TEAM_ANNUAL,
      interval: 'year',
      monthlyEquivalent: 83.25,
      savings: '€189 (16% off)',
      popular: false
    }
  }
} as const;
```

**UI Updates**:
```tsx
// components/PricingSectionHybrid.tsx - Add toggle
export function PricingSectionHybrid() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      {/* Billing interval toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingInterval('monthly')}
          className={billingInterval === 'monthly' ? 'active' : ''}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval('annual')}
          className={billingInterval === 'annual' ? 'active' : ''}
        >
          Annual
          <span className="ml-2 text-green-600 font-bold">Save 28%</span>
        </button>
      </div>

      {/* Pricing cards */}
      {Object.entries(PRICING_CONFIG).map(([tier, config]) => (
        <PricingCard
          key={tier}
          tier={tier}
          pricing={config[billingInterval]}
          billingInterval={billingInterval}
        />
      ))}
    </div>
  );
}
```

---

### Phase 3: Growth & Optimization (Week 4-5) 🟢
**Goal**: Maximize revenue per user and engagement
**Estimated Effort**: 50 hours
**Revenue Impact**: +20-30% through optimization

**Task 4.1: Geo-Based Pricing** (16h)

**IP Geolocation Service**:
```typescript
// lib/services/geolocation.service.ts
import { ipAddress } from '@vercel/edge';

export class GeolocationService {

  async getPricingRegion(req: NextRequest): Promise<string> {
    const ip = ipAddress(req) || '0.0.0.0';

    // Use Vercel's geo headers (free on Vercel)
    const country = req.geo?.country || 'US';

    return this.mapCountryToRegion(country);
  }

  private mapCountryToRegion(country: string): string {
    const regions = {
      US_HIGH: ['US', 'CA', 'AU', 'CH', 'NO', 'DK', 'SE'],
      EU_WEST: ['GB', 'DE', 'FR', 'NL', 'BE', 'AT', 'IE', 'IT', 'ES', 'PT'],
      EU_EAST: ['PL', 'CZ', 'HU', 'RO', 'BG', 'GR', 'HR', 'SK', 'SI'],
      LATAM: ['BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE'],
      ASIA: ['IN', 'ID', 'PH', 'VN', 'TH', 'MY', 'SG', 'KR', 'JP', 'CN']
    };

    for (const [region, countries] of Object.entries(regions)) {
      if (countries.includes(country)) return region;
    }

    return 'EU_WEST'; // Default
  }
}
```

**Regional Pricing Configuration**:
```typescript
// lib/config/regional-pricing.ts
export const REGIONAL_PRICING = {
  US_HIGH: {
    currency: 'usd',
    symbol: '$',
    starter: { monthly: 12, annual: 119 },
    pro: { monthly: 39, annual: 349 },
    team: { monthly: 129, annual: 1199 },
    instant: [
      { credits: 1, price: 6.99 },
      { credits: 3, price: 13.99 },
      { credits: 5, price: 19.99 }
    ]
  },

  EU_WEST: {
    currency: 'eur',
    symbol: '€',
    starter: { monthly: 9, annual: 89 },
    pro: { monthly: 29, annual: 249 },
    team: { monthly: 99, annual: 999 },
    instant: [
      { credits: 1, price: 4.99 },
      { credits: 3, price: 9.99 },
      { credits: 5, price: 14.99 }
    ]
  },

  EU_EAST: {
    currency: 'eur',
    symbol: '€',
    starter: { monthly: 6, annual: 59 },
    pro: { monthly: 19, annual: 179 },
    team: { monthly: 69, annual: 679 },
    instant: [
      { credits: 1, price: 3.99 },
      { credits: 3, price: 6.99 },
      { credits: 5, price: 9.99 }
    ]
  },

  LATAM: {
    currency: 'usd',
    symbol: '$',
    starter: { monthly: 5, annual: 49 },
    pro: { monthly: 15, annual: 149 },
    team: { monthly: 49, annual: 479 },
    instant: [
      { credits: 1, price: 2.99 },
      { credits: 3, price: 5.99 },
      { credits: 5, price: 8.99 }
    ]
  },

  ASIA: {
    currency: 'usd',
    symbol: '$',
    starter: { monthly: 4, annual: 39 },
    pro: { monthly: 12, annual: 119 },
    team: { monthly: 39, annual: 379 },
    instant: [
      { credits: 1, price: 2.49 },
      { credits: 3, price: 4.99 },
      { credits: 5, price: 7.49 }
    ]
  }
} as const;
```

**Dynamic Pricing API**:
```typescript
// app/api/pricing/route.ts
import { GeolocationService } from '@/lib/services/geolocation.service';

export async function GET(req: NextRequest) {
  const geoService = new GeolocationService();
  const region = await geoService.getPricingRegion(req);

  const pricing = REGIONAL_PRICING[region];

  return NextResponse.json({
    status: 'success',
    data: {
      region,
      currency: pricing.currency,
      symbol: pricing.symbol,
      tiers: {
        starter: pricing.starter,
        pro: pricing.pro,
        team: pricing.team
      },
      instant: pricing.instant
    }
  });
}
```

**Task 4.2: Contract Monitoring & Alerts** (20h)

**Database Schema**:
```typescript
// Add to db/schema.ts
export const contractWatches = pgTable('contract_watches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  contractAddress: text('contract_address').notNull(),
  chain: text('chain').notNull().default('ethereum'),

  // Alert triggers
  alertOnOwnershipChange: boolean('alert_on_ownership_change').default(true),
  alertOnLiquidityDrop: boolean('alert_on_liquidity_drop').default(true),
  liquidityDropThreshold: integer('liquidity_drop_threshold').default(20), // %
  alertOnRiskIncrease: boolean('alert_on_risk_increase').default(true),

  // Cached data for comparison
  lastOwnerAddress: text('last_owner_address'),
  lastLiquidity: text('last_liquidity'),
  lastRiskScore: integer('last_risk_score'),
  lastHolderCount: integer('last_holder_count'),

  // Monitoring status
  isActive: boolean('is_active').default(true),
  lastCheckedAt: timestamp('last_checked_at'),
  alertsSent: integer('alerts_sent').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Monitoring Service**:
```typescript
// lib/services/contract-monitoring.service.ts
export class ContractMonitoringService {

  async checkAllWatches() {
    // Get all active watches for Pro/Team users
    const activeWatches = await db
      .select({
        watch: contractWatches,
        user: users
      })
      .from(contractWatches)
      .innerJoin(users, eq(users.id, contractWatches.userId))
      .where(
        and(
          eq(contractWatches.isActive, true),
          or(
            eq(users.tier, 'pro'),
            eq(users.tier, 'team'),
            eq(users.tier, 'enterprise')
          )
        )
      );

    for (const { watch, user } of activeWatches) {
      await this.checkContract(watch, user);
    }
  }

  private async checkContract(
    watch: ContractWatch,
    user: User
  ) {
    try {
      // Fetch current contract data
      const contractService = new ContractService();
      const currentData = await contractService.fetchContract(
        watch.contractAddress,
        watch.chain
      );

      const alerts: string[] = [];

      // Check ownership change
      if (watch.alertOnOwnershipChange &&
          currentData.ownerAddress !== watch.lastOwnerAddress) {
        alerts.push(`Ownership changed from ${watch.lastOwnerAddress} to ${currentData.ownerAddress}`);
      }

      // Check liquidity drop
      if (watch.alertOnLiquidityDrop) {
        const oldLiq = parseFloat(watch.lastLiquidity || '0');
        const newLiq = parseFloat(currentData.liquidity || '0');
        const dropPercent = ((oldLiq - newLiq) / oldLiq) * 100;

        if (dropPercent >= watch.liquidityDropThreshold) {
          alerts.push(`Liquidity dropped ${dropPercent.toFixed(1)}% (${oldLiq} → ${newLiq})`);
        }
      }

      // Check risk score increase
      if (watch.alertOnRiskIncrease &&
          currentData.riskScore > (watch.lastRiskScore || 0)) {
        alerts.push(`Risk score increased from ${watch.lastRiskScore} to ${currentData.riskScore}`);
      }

      // Send alerts if any triggered
      if (alerts.length > 0) {
        await this.sendAlert(user, watch, alerts);

        await db.update(contractWatches)
          .set({ alertsSent: sql`${contractWatches.alertsSent} + 1` })
          .where(eq(contractWatches.id, watch.id));
      }

      // Update cached data
      await db.update(contractWatches)
        .set({
          lastOwnerAddress: currentData.ownerAddress,
          lastLiquidity: currentData.liquidity,
          lastRiskScore: currentData.riskScore,
          lastHolderCount: currentData.holderCount,
          lastCheckedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(contractWatches.id, watch.id));

    } catch (error) {
      console.error(`Failed to check watch ${watch.id}:`, error);
    }
  }

  private async sendAlert(
    user: User,
    watch: ContractWatch,
    alerts: string[]
  ) {
    const emailService = new EmailService();

    await emailService.send({
      to: user.email,
      subject: `🚨 Alert: ${watch.contractAddress} Changed`,
      template: 'contract-alert',
      data: {
        contractAddress: watch.contractAddress,
        chain: watch.chain,
        alerts,
        viewUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/audit/${watch.chain}/${watch.contractAddress}`
      }
    });
  }
}
```

**Cron Job**:
```typescript
// app/api/cron/contract-monitoring/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const monitoringService = new ContractMonitoringService();

  try {
    await monitoringService.checkAllWatches();

    return NextResponse.json({
      status: 'success',
      message: 'Contract monitoring completed'
    });
  } catch (error) {
    console.error('Contract monitoring failed:', error);
    return NextResponse.json(
      { status: 'error', error: 'Monitoring failed' },
      { status: 500 }
    );
  }
}

// Run every 15 minutes
// vercel.json cron: "*/15 * * * *"
```

**User API Endpoints**:
```typescript
// app/api/user/watches/route.ts

// GET - List user's watched contracts
export async function GET(req: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return unauthorized();

  const watches = await db
    .select()
    .from(contractWatches)
    .where(eq(contractWatches.userId, user.id))
    .orderBy(desc(contractWatches.createdAt));

  return NextResponse.json({ status: 'success', data: watches });
}

// POST - Add contract to watch list
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return unauthorized();

  const appUser = await authService.getUserByStackUserId(user.id);

  // Only Pro/Team users can watch contracts
  if (!['pro', 'team', 'enterprise'].includes(appUser.tier)) {
    return NextResponse.json(
      { error: 'Pro subscription required for contract monitoring' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { contractAddress, chain, triggers } = body;

  // Check watch limit (max 10 contracts for Pro, 50 for Team)
  const existingWatches = await db
    .select({ count: sql`count(*)` })
    .from(contractWatches)
    .where(eq(contractWatches.userId, appUser.id));

  const limit = appUser.tier === 'pro' ? 10 : 50;
  if (existingWatches[0].count >= limit) {
    return NextResponse.json(
      { error: `Watch limit reached (${limit} contracts)` },
      { status: 429 }
    );
  }

  // Create watch
  const [newWatch] = await db.insert(contractWatches)
    .values({
      userId: appUser.id,
      contractAddress,
      chain,
      alertOnOwnershipChange: triggers?.ownershipChange ?? true,
      alertOnLiquidityDrop: triggers?.liquidityDrop ?? true,
      alertOnRiskIncrease: triggers?.riskIncrease ?? true
    })
    .returning();

  return NextResponse.json({ status: 'success', data: newWatch });
}

// DELETE - Remove watch
export async function DELETE(req: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const watchId = searchParams.get('id');

  await db.delete(contractWatches)
    .where(
      and(
        eq(contractWatches.id, watchId),
        eq(contractWatches.userId, user.id)
      )
    );

  return NextResponse.json({ status: 'success' });
}
```

**Task 4.3: Saved Scam Tracker Widget** (14h)

**Database Query**:
```typescript
// lib/services/scam-tracker.service.ts
export class ScamTrackerService {

  async getUserScamStats(userId: number) {
    // Get all user's scans
    const userScans = await db
      .select()
      .from(audits)
      .where(eq(audits.userId, userId));

    // Calculate stats
    const totalScans = userScans.length;
    const highRiskContracts = userScans.filter(a => a.riskScore >= 70);

    // Estimate savings (sum of liquidity from high-risk contracts)
    const estimatedSavings = highRiskContracts.reduce((sum, audit) => {
      const liquidity = parseFloat(audit.liquidity || '0');
      return sum + liquidity;
    }, 0);

    return {
      totalScans,
      highRiskFound: highRiskContracts.length,
      estimatedSavings: Math.floor(estimatedSavings),
      scamsAvoided: highRiskContracts.filter(a => a.recommendation === 'AVOID').length
    };
  }
}
```

**UI Component**:
```tsx
// components/dashboard/ScamTracker.tsx
export function ScamTracker() {
  const { data } = useSWR('/api/user/scam-stats', fetcher);

  if (!data) return <Skeleton />;

  const { totalScans, highRiskFound, estimatedSavings, scamsAvoided } = data;

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Your Protection Stats 🛡️</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Contracts Scanned"
          value={totalScans}
          icon="📊"
        />
        <StatCard
          label="High-Risk Found"
          value={highRiskFound}
          icon="🚨"
        />
        <StatCard
          label="Scams Avoided"
          value={scamsAvoided}
          icon="✅"
        />
        <StatCard
          label="Estimated Savings"
          value={`$${(estimatedSavings / 1000).toFixed(1)}K`}
          icon="💰"
        />
      </div>

      <ShareButton
        text={`I avoided $${(estimatedSavings / 1000).toFixed(1)}K in scams using @ContractGuardAI 🛡️`}
        url={`${SITE_URL}?ref=${user.referralCode}`}
      />
    </Card>
  );
}
```

**Social Share Component**:
```tsx
// components/referral/ShareButton.tsx
export function ShareButton({ text, url }: { text: string; url: string }) {
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    copy: url
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => window.open(shareLinks.twitter, '_blank')}
      >
        <TwitterIcon /> Share on Twitter
      </Button>

      <Button
        variant="outline"
        onClick={() => window.open(shareLinks.telegram, '_blank')}
      >
        <TelegramIcon /> Share on Telegram
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(shareLinks.copy);
          toast.success('Referral link copied!');
        }}
      >
        <CopyIcon /> Copy Link
      </Button>
    </div>
  );
}
```

---

### Phase 4: Analytics & Optimization (Week 6+) 🔵
**Goal**: Improve decision-making and prepare for scale
**Estimated Effort**: 30 hours
**Impact**: Long-term sustainability

**Task 5.1: Enhanced Analytics Dashboard** (12h)
- User cohort analysis
- Conversion funnel tracking
- Revenue attribution by source
- Referral performance metrics
- Churn prediction

**Task 5.2: Bear Market Contingency Features** (8h)
- API-first pricing tiers
- Developer-focused documentation
- B2B sales tools
- Enterprise security features

**Task 5.3: Advanced Anti-Fraud** (10h)
- Machine learning fraud detection
- Behavioral analysis patterns
- Real-time risk scoring
- Automated account suspension

---

## Technical Implementation Details

### Database Migrations

Run these migrations in sequence:

```sql
-- Migration 1: Add STARTER tier and anonymous support
ALTER TABLE users
  ALTER COLUMN tier TYPE TEXT,
  ADD COLUMN anonymous_session_id UUID UNIQUE,
  ADD COLUMN soft_signup_email TEXT,
  ADD COLUMN monthly_scans_limit INTEGER DEFAULT 0,
  ADD COLUMN monthly_scans_used INTEGER DEFAULT 0,
  ADD COLUMN monthly_reset_at TIMESTAMP;

-- Update tier constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));

-- Migration 2: Add referral tiers and commission tracking
ALTER TABLE users
  ADD COLUMN referral_tier TEXT DEFAULT 'none',
  ADD COLUMN referral_count INTEGER DEFAULT 0,
  ADD COLUMN lifetime_commission_earned INTEGER DEFAULT 0,
  ADD COLUMN device_fingerprint TEXT;

-- Create referral_commissions table
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  subscription_tier TEXT NOT NULL,
  monthly_amount INTEGER NOT NULL,
  total_paid INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  next_payout_date TIMESTAMP,

  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('starter', 'pro', 'team')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'ended'))
);

CREATE INDEX idx_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX idx_commissions_payout ON referral_commissions(next_payout_date)
  WHERE status = 'active';

-- Migration 3: Add contract watches table
CREATE TABLE contract_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',

  alert_on_ownership_change BOOLEAN DEFAULT TRUE,
  alert_on_liquidity_drop BOOLEAN DEFAULT TRUE,
  liquidity_drop_threshold INTEGER DEFAULT 20,
  alert_on_risk_increase BOOLEAN DEFAULT TRUE,

  last_owner_address TEXT,
  last_liquidity TEXT,
  last_risk_score INTEGER,
  last_holder_count INTEGER,

  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP,
  alerts_sent INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_watches_user ON contract_watches(user_id);
CREATE INDEX idx_watches_active ON contract_watches(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_watches_contract ON contract_watches(contract_address, chain);

-- After migrations, run:
-- npm run db:push
```

### Environment Variables to Add

```bash
# .env.local

# Stripe Price IDs for new tiers
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_TEAM_ANNUAL=price_xxx

# Cron job security
CRON_SECRET=your_secure_random_string

# Anti-fraud services (optional)
FINGERPRINT_API_KEY=xxx  # Fingerprint.js for device fingerprinting
SIFT_API_KEY=xxx         # Sift for fraud detection

# Email service (for alerts)
RESEND_API_KEY=xxx       # Or SendGrid, Postmark, etc.
```

### Stripe Product Setup

Create new products in Stripe Dashboard:

1. **STARTER Monthly**: €9/month recurring
2. **STARTER Annual**: €89/year recurring
3. **PRO Annual**: €249/year recurring
4. **TEAM Annual**: €999/year recurring

Add price IDs to environment variables.

---

## Success Metrics

### Phase 1 Targets (Week 2)
- ✅ Anonymous scan conversion: >60% create account after 1st scan
- ✅ STARTER tier adoption: 30-40% of new paid users
- ✅ Fraud rate: <5% of referrals flagged

### Phase 2 Targets (Week 3)
- ✅ Viral coefficient: 0.8 → 1.2+
- ✅ Referral sharing rate: 3x increase
- ✅ Ambassador signups: 10+ users by Month 3

### Phase 3 Targets (Week 5)
- ✅ Regional conversion: +15% in EU_EAST, +25% in LATAM/ASIA
- ✅ Contract monitoring: 20%+ of Pro users enable alerts
- ✅ Social shares: 500+ referral shares per month

### Overall Business Impact (3 Months)
- **Conversion Rate**: 2-4% → 5-7% (progressive signup + STARTER tier)
- **Viral Coefficient**: 0.5 → 1.2-1.5 (gamification + commission)
- **ARPU**: €3.50 → €5.20 (geo-pricing + tier optimization)
- **LTV**: €120 → €180 (annual plans + reduced churn)
- **CAC**: €6 → €3-4 (referral virality)
- **Revenue**: €150K (Month 12) → €220K+ (with optimizations)

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Anonymous session abuse | Medium | Medium | IP rate limiting, cookie fingerprinting |
| Referral fraud at scale | High | High | Multi-layered validation, delayed rewards |
| Monitoring service downtime | Low | Medium | Redundant cron jobs, alert escalation |
| Database performance | Medium | High | Proper indexing, query optimization |
| Stripe webhook failures | Low | High | Idempotent handlers, manual reconciliation |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| STARTER tier cannibalization | Medium | Medium | Monitor PRO churn, adjust pricing/perks |
| Referral gamification gaming | Medium | High | Robust anti-fraud, behavioral analysis |
| Bear market revenue drop | High | Critical | B2B pivot ready, API-first features |
| Geo-pricing backlash | Low | Low | Clear communication, VPN detection |

---

## Next Steps & Prioritization

### Immediate Actions (This Week)
1. ✅ Review this gap analysis with team
2. ✅ Prioritize Phase 1 tasks (progressive signup + STARTER tier)
3. ✅ Set up Stripe products for new tiers
4. ✅ Create project board for tracking

### Week 1 Focus
- 🔴 Progressive signup flow (critical for conversion)
- 🔴 Anti-fraud foundation (protect margins)
- 🟡 STARTER tier implementation (revenue opportunity)

### Week 2-3 Focus
- 🟡 Gamified referral system (growth engine)
- 🟡 Annual subscription options (cash flow)
- 🟡 Commission tracking (ambassador program)

### Week 4+ Focus
- 🟢 Geo-based pricing (optimization)
- 🟢 Contract monitoring (Pro feature)
- 🟢 Analytics enhancements (insights)

---

## Conclusion

**Current Implementation Score**: 7/10 - Strong foundation
**Target Score After Implementation**: 9.5/10 - Market-leading

**Critical Path**:
1. Progressive signup (Week 1) → Unlock 40% more conversions
2. STARTER tier (Week 1) → Capture mid-market (40% of paid users)
3. Referral gamification (Week 3) → Achieve viral coefficient 1.2+

**Estimated Timeline**: 6 weeks to full alignment
**Estimated Investment**: 200-250 developer hours
**Expected ROI**: 2-3x revenue increase by Month 6

**Recommendation**: Proceed with Phase 1 immediately to capitalize on bull market window. Progressive signup and STARTER tier are critical for competitive positioning.

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-01-10
**Next Review**: After Phase 1 completion
