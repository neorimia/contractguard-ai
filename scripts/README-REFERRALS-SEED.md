# Referral Leaderboard Seeding

## Overview

The referral leaderboard seed script creates realistic mock user data to populate the ContractGuard AI leaderboard with social proof and create FOMO (Fear of Missing Out) for new visitors.

## What it Does

- Creates **25 mock users** with varying referral counts (6-487 referrals)
- Distributes users across all referral tiers (Bronze → Ambassador)
- Calculates realistic earnings based on referral counts and tier commission rates
- Assigns recent login timestamps to make the leaderboard feel active
- Uses realistic crypto-themed usernames and email addresses

## Mock Data Statistics

### User Distribution by Tier:

- **Ambassador** (100+ referrals, 20+ paid): 5 users
- **Platinum** (50+ referrals, 10+ paid): 12 users
- **Gold** (25+ referrals, 5+ paid): 3 users
- **Silver** (10+ referrals, 2+ paid): 3 users
- **Iron** (5+ referrals, 1+ paid): 2 users

### Total Metrics:

- **Total Referrals**: 3,583
- **Total Earnings**: $31,398+
- **Top Referrer**: CryptoMihai with 487 referrals
- **Countries Represented**: RO (Romania), UK, US, DE, SG, BR, FR, NL, IN, AU, CA, CH, IT, ES, PL, MX, SE, NO, FI, DK, AE

## Running the Script

```bash
npm run seed:referrals
```

## What Gets Created

Each mock user includes:

- **stackUserId**: Unique Stack Auth ID (`mock_cg_*`)
- **email**: Realistic crypto-themed email
- **displayName**: Catchy username (e.g., "CryptoMihai", "RugPullHunter")
- **referralCount**: Total confirmed referrals (6-487)
- **paidReferrals**: Number of paying referrals (1-97)
- **referralTier**: Appropriate tier based on performance
- **totalReferralEarnings**: Calculated commission earnings in cents
- **lifetimeCommission**: Total commission earned
- **referredRevenue**: Total revenue from referred users
- **lastLoginAt**: Recent timestamp (within 7 days)

## Earnings Calculation

The script calculates realistic earnings using:

```typescript
// Average $29/month × paid referrals × random months (1-12)
const avgRevenue = paidReferrals * 2900 * (1-12 months)

// Commission rate: 20% for ambassadors, 10% for others
const commission = avgRevenue × commissionRate
```

## Use Cases

### 1. **Development & Testing**

- Test leaderboard UI with realistic data
- Verify tier badge display
- Test ranking algorithms

### 2. **Social Proof & Marketing**

- Show active community to new visitors
- Create FOMO with high referral counts
- Demonstrate program success

### 3. **Product Demos**

- Showcase referral program to investors
- Show viral growth potential
- Demonstrate gamification features

## Important Notes

⚠️ **These are MOCK users for demo purposes only**

- All emails use `@contractguard.example` domain (non-existent)
- Stack User IDs are prefixed with `mock_cg_`
- Not real users - purely for visual/social proof
- Should be cleared before production launch

## Clearing Mock Data

To remove all mock users from the database:

```sql
DELETE FROM users WHERE email LIKE '%@contractguard.example';
```

Or use a dedicated cleanup script:

```bash
npm run clean:mock-users
```

## Where the Data Appears

1. **/referrals** - Main leaderboard page
2. **Social Proof Components** - Stats widgets
3. **Homepage** - "Top referrer" displays
4. **API Endpoints**:
   - `/api/referrals/leaderboard`
   - `/api/referrals/social-proof`

## Customization

To adjust the mock data, edit `scripts/seed-referral-leaderboard.ts`:

- Change user count (currently 25)
- Modify referral counts
- Adjust tier distribution
- Update usernames/emails
- Change earnings calculations

## Integration with Real Data

Once you have real users with referrals:

1. **Option A**: Keep mock data for padding
   - Mock users fill out the leaderboard
   - Real users appear at top when they surpass mocks

2. **Option B**: Remove mock data
   - Delete all mock users
   - Show only real user data

3. **Option C**: Hybrid approach
   - Keep top 5-10 mock users as "legends"
   - Mix with real users for social proof

## Sample Leaderboard Output

```
Rank | User                  | Referrals | Tier        | Earnings
-----|----------------------|-----------|-------------|----------
  1  | CryptoMihai          | 487       | Ambassador  | $6,189
  2  | DeFiQueen            | 394       | Ambassador  | $4,582
  3  | BlockchainBogdan     | 341       | Ambassador  | $3,155
  4  | RugPullHunter        | 318       | Ambassador  | $2,970
  5  | SafetyFirst_DEV      | 276       | Platinum    | $3,509
```

## Technical Details

### Database Table: `users`

Fields populated:

- Core identity (stackUserId, email, displayName)
- Referral metrics (referralCount, paidReferrals)
- Tier tracking (referralTier)
- Financial (totalReferralEarnings, lifetimeCommission, referredRevenue)
- Timestamps (lastLoginAt, createdAt)

### Script Features:

- ✅ Realistic name generation
- ✅ Proportional earnings calculation
- ✅ Recent activity timestamps
- ✅ Tier-appropriate distribution
- ✅ Console progress display
- ✅ Summary statistics

---

**Created**: 2025-10-13  
**Purpose**: Social proof & FOMO generation for ContractGuard AI referral program
