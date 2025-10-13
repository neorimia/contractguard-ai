# Hybrid Usage/Scan Mechanism

Complete guide to how the hybrid business model handles scan access and credit consumption in ContractGuard AI.

## Overview

The system uses a **priority-based access model** that seamlessly integrates three payment/access methods:

1. **Subscription Access** (Pro/Enterprise) - Unlimited scans
2. **Instant Credits** - Pay-per-scan, no expiration
3. **Free Tier** - 3 scans per day

## Priority Logic

When a user requests a scan, the system checks access in this order:

```
┌─────────────────────────────────────┐
│ 1. Has Pro/Enterprise Subscription? │
│    → YES: Allow scan (unlimited)    │
│    → NO: Continue to step 2         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Has Instant Credits Available?   │
│    → YES: Allow scan, deduct 1 credit│
│    → NO: Continue to step 3         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Free Tier Scans Remaining Today? │
│    → YES: Allow scan, increment count│
│    → NO: Deny access (show paywall) │
└─────────────────────────────────────┘
```

## Access Validation Service

Located at: `lib/services/access-validation.service.ts`

### Key Methods

#### `validateAccess(userId: number)`

Checks if user can perform a scan without consuming.

**Returns:**
```typescript
{
  hasAccess: boolean;
  accessType: 'pro' | 'team' | 'instant_credit' | 'free' | 'none';
  scansRemaining: number;  // -1 = unlimited
  instantCredits: number;
  reason?: string;
}
```

#### `consumeScan(userId: number, accessType: AccessType)`

Consumes one scan based on access type:

- **Pro/Enterprise**: No deduction (unlimited)
- **Instant Credit**: Decrements `instantCredits` by 1
- **Free Tier**: Increments `scansToday` by 1

#### `resetDailyScans(userId: number)`

Automatically called at midnight to:
- Reset `scansToday` to 0
- Reset `instantCreditsUsedToday` to 0
- Set `scansResetAt` to tomorrow midnight

### Database Fields Used

```sql
-- User table
instantCredits INTEGER DEFAULT 0          -- Purchased credits balance
instantCreditsUsedToday INTEGER DEFAULT 0 -- Credits used today
scansToday INTEGER DEFAULT 0              -- Free scans used today
scansResetAt TIMESTAMP                    -- When free tier resets
tier TEXT DEFAULT 'free'                  -- 'free' | 'pro' | 'enterprise'
```

## Scan Flow

### 1. User Requests Scan

`POST /api/audit`

### 2. Authentication

- Verify Stack Auth user
- Get or create local database user
- Sync user data

### 3. Access Validation

```typescript
const accessStatus = await accessValidationService.validateAccess(appUser.id);

if (!accessStatus.hasAccess) {
  return 429 // Rate limit exceeded
}
```

### 4. Perform Scan

- Check Redis cache (5 min)
- Check database cache (24 hours)
- Fetch from blockchain if needed
- Run AI analysis
- Store results

### 5. Consume Scan

```typescript
await accessValidationService.consumeScan(
  appUser.id,
  accessStatus.accessType
);
```

### 6. Return Results

Include headers:
- `X-Access-Type`: Current access method
- `X-Scans-Remaining`: Scans left (or -1)
- `X-Instant-Credits`: Credits balance

## Usage API Endpoint

`GET /api/user/usage`

Returns comprehensive usage data:

```json
{
  "status": "success",
  "data": {
    "current": {
      "scansToday": 2,
      "scansThisMonth": 45,
      "limit": 3,
      "resetAt": "2025-01-11T00:00:00.000Z"
    },
    "instantCredits": {
      "balance": 5,
      "usedToday": 0
    },
    "tier": "free",
    "accessSummary": {
      "type": "instant_credits",
      "description": "5 instant reports available"
    },
    "historical": {
      "daily": [...],
      "monthly": [...]
    }
  }
}
```

## Credits API Endpoint

`GET /api/user/credits`

Returns detailed instant credits information:

```json
{
  "status": "success",
  "data": {
    "balance": 5,
    "usedToday": 0,
    "totalPurchased": 10,
    "recentPurchases": [
      {
        "id": "uuid",
        "type": "instant_credits",
        "credits": 5,
        "amount": 1499,
        "status": "completed",
        "createdAt": "2025-01-10T..."
      }
    ]
  }
}
```

## Guest User Flow

Guests (unauthenticated) can also purchase instant credits:

### Purchase Flow

1. User clicks "Buy Now" on pricing page
2. Creates Stripe checkout session
3. `guestSessionId` generated and stored
4. After payment:
   - Create guest user record
   - Set `isGuest = true`
   - Add credits to `instantCredits`
   - Store `guestSessionId` for identification

### Guest Access Validation

```typescript
await accessValidationService.validateGuestAccess(guestSessionId);
```

**Rules for Guests:**
- ✅ Can use instant credits
- ❌ No free tier access
- ❌ Can't subscribe (must create account)
- 💡 Prompted to sign up to preserve credits

## Tier Limits

```typescript
const TIER_LIMITS = {
  free: 3,        // 3 scans per day
  pro: 100,       // Effectively unlimited
  enterprise: 999999  // Truly unlimited
}
```

**Note**: Pro/Enterprise users don't actually count scans since consumption logic skips them.

## Daily Reset Logic

Runs automatically when:
- User's first scan after midnight
- `scansResetAt` is past current time

**Resets:**
- ✅ Free tier scan counter (`scansToday → 0`)
- ✅ Instant credits usage tracker (`instantCreditsUsedToday → 0`)
- ✅ Sets next reset time (`scansResetAt → tomorrow 00:00`)

**Does NOT Reset:**
- ❌ Instant credits balance (never expires)
- ❌ Subscription status
- ❌ Tier level

## Purchase Flow Integration

### Instant Credits Purchase

1. User selects package (1, 3, or 5 reports)
2. Stripe checkout created
3. Webhook receives `checkout.session.completed`
4. Updates purchase record status
5. **Adds credits to user's balance**:

```typescript
await db
  .update(users)
  .set({
    instantCredits: sql`${users.instantCredits} + ${credits}`
  })
  .where(eq(users.id, userId));
```

### Subscription Purchase

1. User subscribes to Pro/Enterprise
2. Stripe checkout created
3. Webhook receives `customer.subscription.created`
4. **Updates user tier**:

```typescript
await db
  .update(users)
  .set({
    tier: 'pro', // or 'enterprise'
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer.id
  })
  .where(eq(users.id, userId));
```

## UI Integration

### Display Current Access

```typescript
const response = await fetch('/api/user/usage');
const { accessSummary, instantCredits, current } = response.data;

// Show in UI:
accessSummary.description
// "Pro Plan - Unlimited scans"
// "5 instant reports available"
// "1 free scan remaining today"
```

### Check Before Scan

```typescript
// Frontend check (informational only)
if (scansRemaining === 0 && instantCredits.balance === 0 && tier === 'free') {
  showPaywall();
}

// Backend enforces actual validation
```

### Show Credits Everywhere

- ✅ Billing page
- ✅ Usage dashboard
- ✅ Navigation/header
- ✅ Scan results page
- ✅ Pricing page

## Error Handling

### No Access Available

```json
{
  "error": "Access limit exceeded",
  "message": "Daily limit reached. Purchase instant reports or upgrade to Pro.",
  "accessType": "none",
  "scansRemaining": 0,
  "upgradeUrl": "/pricing",
  "status": "error"
}
```

**HTTP Status**: `429 Too Many Requests`

### Consumption Failure

If `consumeScan()` fails:
- Transaction rolls back
- User keeps their credits/scans
- Error logged
- Returns 500 error

## Best Practices

### 1. Always Validate Before Consuming

```typescript
// ✅ Good
const access = await validateAccess(userId);
if (access.hasAccess) {
  // ... perform scan ...
  await consumeScan(userId, access.accessType);
}

// ❌ Bad
await consumeScan(userId, 'free'); // No validation!
```

### 2. Handle All Access Types

```typescript
switch (accessType) {
  case 'pro':
  case 'team':
    // Unlimited - show premium features
    break;
  case 'instant_credit':
    // Show remaining credits
    break;
  case 'free':
    // Show daily limit countdown
    break;
  default:
    // Show paywall
}
```

### 3. Graceful Degradation

If validation service fails:
- Log error
- Don't consume scan
- Return user-friendly message
- Allow retry

### 4. Cache Smartly

Cached results still consume scans:
- Users pay for the analysis, not the API call
- Prevents gaming the system
- Fair for all access types

## Analytics & Tracking

Track access patterns:

```typescript
trackEvent('scan_performed', {
  accessType: 'instant_credit',
  creditsRemaining: 4,
  tier: 'free',
  source: 'scan_page'
});
```

**Key Metrics:**
- Scans by access type
- Credit depletion rate
- Conversion from free → paid
- Average credits per user

## Webhooks Integration

### Stripe Checkout Completed

```typescript
// app/api/stripe/webhook/route.ts

case 'checkout.session.completed':
  if (metadata.type === 'instant_credits') {
    // Add credits
    await addCreditsToUser(userId, credits);
  } else {
    // Activate subscription
    await upgradeUserTier(userId, tier);
  }
```

### Subscription Canceled

```typescript
case 'customer.subscription.deleted':
  // Downgrade to free (keep instant credits)
  await db.update(users)
    .set({ tier: 'free' })
    .where(eq(users.stripeSubscriptionId, subscriptionId));
```

## Testing

### Test Scenarios

1. **Free Tier Exhaustion**
   - Use 3 scans
   - 4th scan → denied
   - Wait for midnight reset
   - Can scan again

2. **Instant Credits**
   - Purchase 5 credits
   - Use 5 scans
   - 6th scan → denied or uses free tier
   - Credits persist across days

3. **Subscription Priority**
   - Subscribe to Pro
   - Have instant credits
   - Scan uses subscription (unlimited)
   - Credits remain untouched

4. **Guest Purchase**
   - Buy credits without account
   - Create account with same email
   - Credits transferred

## Future Enhancements

### Potential Features

- [ ] Credit gifting/sharing
- [ ] Bulk discounts (10+ reports)
- [ ] Credit expiration warnings
- [ ] Auto-top-up when balance low
- [ ] Team credit pooling
- [ ] Usage analytics dashboard

---

**Status**: Production Ready ✅  
**Last Updated**: 2025-01-10  
**Version**: 1.0

