# Business Model – Hybrid Monetization Strategy (Account + Referral-Driven)

Complete business model and revenue strategy for **ContractGuard AI**, now optimized for **account-based access** and **referral growth**.

---

## 💡 Overview

ContractGuard AI operates with a **hybrid monetization model** combining:

- ⚡ **Pay-per-Scan (Instant Reports)** for casual users
- 💎 **Freemium → Pro Subscriptions** for recurring users
- 🔗 **API & Team Plans** for B2B clients

All scans now require a **user account** (email, Google, or wallet login) to:

- Track usage & credits
- Enable referrals and rewards
- Sync data across devices
- Improve user retention and upsell targeting

---

## 💰 Revenue Streams

### 1. Freemium SaaS (Core Layer)

**FREE TIER (Requires Account)**

- 3 scans/day
- Basic risk report
- Limited AI summary
- Referral rewards (1 free scan/invite)
- Ads (optional)
- **Price:** €0
- **Target:** Entry users
- **Goal:** Virality + lead generation

**PRO TIER – €29/month**

- Unlimited scans
- Advanced risk & fairness scoring
- Historical analysis + PDF export
- Contract monitoring & alerts
- Ask-AI negotiation assistant
- Referral bonus: +1 report per signup
- No ads + priority queue
- **Target:** Active traders, startups
- **Goal:** Recurring MRR

**TEAM / API PLAN – €99–499/month**

- Everything in Pro
- Multi-user dashboard
- Unlimited API calls
- SLA + dedicated support
- Custom integrations
- White-label access
- **Target:** Funds, DEXs, law firms
- **Goal:** B2B recurring revenue

---

### 2. Instant Reports (Pay-Per-Scan)

**INSTANT REPORTS (Requires Login)**

- Full audit in 60 seconds
- 25% preview → unlock full report
- Buy report credits via Stripe
- Credits stored in user account

**Packages:**

- 1 report = €4.99
- 3 reports = €9.99
- 5 reports = €14.99

**Referral:** Invite a friend → +1 credit  
**Upsell:** "Upgrade to Pro for unlimited"

🧩 **Rationale:**  
Even one-time users must register → enables remarketing, referral tracking, and analytics-based upsells.

---

### 3. Referral & Affiliate System

**Referral Rules:**

- Each verified signup via referral = +1 free scan
- 3 referred users → 1 week of Pro access
- 10 referred users → 1 month of Pro access
- Pro users earn 10% recurring commission

**Affiliate Partners:**

- Influencers & YouTubers: 20% recurring
- B2B Referrals (DEXs, wallets): 15–30% rev share
- Exchanges (Binance, Coinbase): up to 50% of fees

**Goal:** Turn every user into a marketer while maintaining low CAC.

---

### 4. API Licensing (Developer Revenue)

| Tier       | Price  | Volume         | Target                  |
| ---------- | ------ | -------------- | ----------------------- |
| Hobby      | €0     | 100 req/mo     | Builders                |
| Startup    | €99    | 10,000 req/mo  | Telegram bots, trackers |
| Business   | €499   | 100,000 req/mo | Exchanges, dApps        |
| Enterprise | Custom | Unlimited      | White-label partners    |

API tokens are linked to the same **user account** → unified referral + usage analytics.

---

## 🧠 Why Account-Based Access Works

| Benefit           | Description                                   |
| ----------------- | --------------------------------------------- |
| Referral Tracking | Each user has unique code for invite rewards  |
| Data Retention    | Store previous audits for upsells and history |
| Growth Analytics  | Map referral trees and viral loops            |
| Personalized UX   | Smart upsell triggers (“You’re out of scans”) |
| Compliance        | GDPR + secure access control                  |
| Conversion        | Easier email follow-up and remarketing        |

---

## 🧩 Updated Hybrid Revenue Mix

| Stream               | Type         | % of Revenue | Requires Account |
| -------------------- | ------------ | ------------ | ---------------- |
| Instant Reports      | One-time     | 40–50%       | ✅ Yes           |
| Pro Subscriptions    | Recurring    | 25–35%       | ✅ Yes           |
| API/Team Plans       | Recurring    | 10–15%       | ✅ Yes           |
| Referrals/Affiliates | Hybrid       | 5–10%        | ✅ Yes           |
| Premium Research     | Subscription | 2–5%         | ✅ Yes           |

---

## 📊 Unit Economics

**Per Instant Report:**

Revenue: €9.00
Cost: €0.50 (AI + infra)
Referral reward: €0.30
Net profit: €8.20 (91%)

**Per Pro User:**

Revenue: €29/month
AI/Infra cost: €8
Support + rewards: €4
Referral cost: €2 (avg)
Net profit: €15 → 52% margin

**Referral ROI:**

- Avg referral CAC: €3–5 (via free scan reward)
- Avg LTV per referred user: €120
- LTV/CAC ratio: 24x ✅

---

## 📈 12-Month Projection (Hybrid + Account Model)

| Month | Users   | Referrals | Paid  | Revenue  | MRR     |
| ----- | ------- | --------- | ----- | -------- | ------- |
| 1     | 5,000   | 500       | 100   | €5,500   | €2,900  |
| 3     | 20,000  | 3,000     | 600   | €20,000  | €11,600 |
| 6     | 75,000  | 15,000    | 2,000 | €55,000  | €29,000 |
| 12    | 200,000 | 40,000    | 5,000 | €150,000 | €65,000 |

**Referral-driven viral growth → CAC neutral by Month 3.**

---

## 💳 Stripe + Account Integration

```ts
// products/pricing.ts
{
  instant_1: { price: 499, type: 'one_time' },
  instant_3: { price: 999, type: 'one_time' },
  instant_5: { price: 1499, type: 'one_time' },
  pro_monthly: { price: 2900, interval: 'month' },
  pro_annual: { price: 29000, interval: 'year' },
  team_monthly: { price: 9900, interval: 'month' },
}

```

**Database Schema (Neon + Stack Auth):**

```sql
users {
  id uuid primary key,
  email text,
  referral_code text unique,
  referred_by text,
  credits int default 0,
  plan text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now()
}
```

---

## 🧩 Referral Logic

| Event                    | Reward                    | Condition      |
| ------------------------ | ------------------------- | -------------- |
| New signup via referral  | +1 credit to both         | Email verified |
| Referral upgrades to Pro | +10% commission recurring | Pro active     |
| 3 signups                | 7 days Pro bonus          | Any plan       |
| 10 signups               | 1 month Pro bonus         | Any plan       |

---

## 🧮 Funnel with Account Login

```
Landing Page
  ↓
Sign Up (email)
  ↓
Free Scan (3/day)
  ↓
Preview Report (locked sections)
  ↓
Unlock Full Report (€4.99)
  ↓
Upgrade to Pro (€29/mo)
  ↓
Invite friends → Earn credits
```

**Key Insight:** Account login enables re-engagement via email, Discord, or notifications, turning a single scan into a relationship.

---

## 📊 Financial Snapshot

| Metric               | Value     |
| -------------------- | --------- |
| Monthly Active Users | 200,000   |
| Paid Conversion      | 2–4%      |
| Avg Revenue/User     | €3.50     |
| CAC                  | €6 avg    |
| LTV                  | €120 avg  |
| LTV:CAC              | 20x       |
| Gross Margin         | 80–85%    |
| Break-even           | <2 months |

---

## 🎯 Growth Flywheel

1. User signs up → free scans
2. Refers friends → earns credits
3. Uses credits → hits limit → buys Instant Report
4. Unlocks → upgrades to Pro
5. Repeats & brings more referrals

**Each referral generates 1.3 new users on average — compounding network effects.**

---

## ⚙️ Key Metrics to Track

| Category     | KPI                               |
| ------------ | --------------------------------- |
| Acquisition  | Referral signups, CAC             |
| Activation   | Scans/user, first scan time       |
| Revenue      | ARPU, conversion rate             |
| Retention    | Monthly churn, repeat scans       |
| Referral     | Viral coefficient, earned credits |
| Monetization | Avg credit spend per user         |

---

## 🚨 Risks & Mitigations

| Risk                              | Likelihood | Mitigation                            |
| --------------------------------- | ---------- | ------------------------------------- |
| Spam signups for referral credits | Medium     | Email verification + anti-abuse logic |
| Referral fraud (multi-account)    | Medium     | IP & wallet fingerprinting            |
| Lower free → paid conversion      | Low        | Gamified upsells, limited previews    |
| High support load                 | Medium     | Self-service + AI chatbot             |
| Regulatory (crypto region bans)   | Low        | Geofencing + disclaimers              |

---

## 📘 Summary

**Core Model:**  
All users must sign up → every interaction tracked → every action incentivized.

**Hybrid Monetization:**  
Pay-per-scan + subscriptions = balanced cash flow.

**Referral Engine:**  
Turns users into promoters → reduces CAC → compounds growth.

**Strategic Outcome:**  
Self-reinforcing, viral, high-margin SaaS for crypto safety with strong user lock-in.

> "Every scan grows the network. Every invite fuels the business."

---

**Tags:** #business #monetization #referral #hybrid #saas #contractguard
