# Tech Stack - Architecture & Tools

Complete technical architecture for ContractGuard AI, optimized for your expertise and rapid development.

---

## 🎯 Stack Overview

```
┌─────────────────────────────────────────┐
│           FRONTEND LAYER                │
├─────────────────────────────────────────┤
│  Next.js 15 (App Router)                │
│  React 18 + TypeScript                  │
│  TailwindCSS + Shadcn UI                │
└─────────────────────────────────────────┘
              ↓ API Routes
┌─────────────────────────────────────────┐
│           BACKEND LAYER                 │
├─────────────────────────────────────────┤
│  Next.js API Routes                     │
│  TypeScript                             │
│  Rate Limiting Middleware               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│           DATA LAYER                    │
├─────────────────────────────────────────┤
│  Neon PostgreSQL (Database)             │
│  Drizzle ORM                            │
│  Upstash Redis (Cache)                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        EXTERNAL SERVICES                │
├─────────────────────────────────────────┤
│  OpenAI GPT-4 / Caffeine.ai (AI)        │
│  Etherscan API (Contracts)              │
│  Alchemy API (Blockchain Data)          │
│  Stripe (Payments)                      │
└─────────────────────────────────────────┘
```

---

## 🎨 Frontend Stack

### Core Framework

**Next.js 15 (App Router)**
- **Why:** Server components, streaming, built-in API routes
- **Version:** `15.0.0+`
- **Features Used:**
    - App Router (file-based routing)
    - Server Components (performance)
    - Route Handlers (API endpoints)
    - Image Optimization
    - SEO optimization

```bash
npx create-next-app@latest contractguard-ai \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir
```

### UI Framework

**React 18 + TypeScript**
- **Why:** Industry standard, type safety, your expertise
- **Version:** `^18.3.1`
- **Patterns:**
    - Functional components
    - Hooks (useState, useEffect)
    - Client/Server component split
    - TypeScript strict mode

**Key Benefits:**
- ✅ Type safety catches bugs early
- ✅ Excellent IDE support
- ✅ Component reusability
- ✅ Rich ecosystem

### Styling

**TailwindCSS**
- **Why:** Utility-first, fast development, small bundle
- **Version:** `^3.4.0`
- **Configuration:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(263 70% 60%)',
          foreground: 'hsl(210 40% 98%)',
        },
      },
    },
  },
  plugins: [],
};
```

**Shadcn UI**
- **Why:** Beautiful components, accessible, customizable
- **Components Used:**
    - Button
    - Card
    - Alert
    - Badge
    - Input
    - Skeleton (loading states)

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card alert badge
```

**Custom Styles:**
```css
/* Dark theme optimized for crypto users */
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 263 70% 60%;
}
```

---

## ⚙️ Backend Stack

### API Layer

**Next.js API Routes (Route Handlers)**
- **Why:** Collocated with frontend, TypeScript, serverless
- **Location:** `app/api/*/route.ts`
- **Pattern:**

```typescript
// app/api/audit/route.ts
export async function POST(req: NextRequest) {
  // Handle request
  return NextResponse.json(data);
}
```

**Advantages:**
- ✅ Same codebase as frontend
- ✅ Automatic TypeScript
- ✅ Built-in middleware support
- ✅ Edge runtime capable
- ✅ Serverless deployment ready

### Middleware

**Rate Limiting**
- **Implementation:** Custom middleware with Upstash Redis
- **Location:** `lib/middleware/rate-limit.ts`
- **Strategy:**
    - IP-based limiting
    - Tiered limits (free/pro/enterprise)
    - Sliding window algorithm

```typescript
// Rate limit tiers
const LIMITS = {
  free: { limit: 3, window: 86400 },      // 3/day
  pro: { limit: 1000, window: 86400 },    // 1000/day
  enterprise: { limit: 10000, window: 86400 }
};
```

---

## 💾 Database Stack

### Primary Database

**Neon PostgreSQL**
- **Why:** Serverless, auto-scaling, free tier, edge-optimized
- **Plan:** Free tier → $19/mo when needed
- **Features:**
    - Branching (like Git for databases)
    - Auto-suspend (cost savings)
    - Point-in-time recovery
    - Global edge network

**Connection:**
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
```

**Why Neon over Alternatives:**

| Feature | Neon | Supabase | PlanetScale |
|---------|------|----------|-------------|
| **Serverless** | ✅ | ✅ | ✅ |
| **Free Tier** | ✅ 512 MB | ✅ 500 MB | ❌ |
| **Auto-pause** | ✅ | ❌ | ❌ |
| **Branching** | ✅ | ❌ | ✅ |
| **Edge** | ✅ | ❌ | ✅ |
| **Price** | $0-19 | $0-25 | $29+ |

### ORM

**Drizzle ORM**
- **Why:** Type-safe, lightweight, best with Neon
- **Version:** `^0.29.0`
- **Features:**
    - Full TypeScript inference
    - SQL-like syntax
    - Migration generation
    - Drizzle Studio (GUI)

```typescript
// Schema definition
export const audits = pgTable('audits', {
  id: serial('id').primaryKey(),
  contractAddress: text('contract_address').notNull(),
  riskScore: integer('risk_score'),
  issues: jsonb('issues').$type<Issue[]>(),
});

// Type inference
type Audit = typeof audits.$inferSelect;
```

**Why Drizzle over Prisma:**

| Feature | Drizzle | Prisma |
|---------|---------|--------|
| **Bundle Size** | 35 KB | 1.2 MB |
| **TypeScript** | Native | Generated |
| **Edge Ready** | ✅ | ❌ |
| **Migration** | SQL-first | Schema-first |
| **Learning Curve** | Low | Medium |
| **Performance** | Faster | Slower |

---

### Cache Layer

**Upstash Redis**
- **Why:** Serverless Redis, edge-optimized, free tier
- **Plan:** Free tier → $10/mo when needed
- **Use Cases:**
    - API response caching (5 min)
    - Rate limiting counters
    - Session storage (future)

**Configuration:**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache pattern
const cacheKey = `audit:${address}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const fresh = await fetchFreshData();
await redis.set(cacheKey, fresh, { ex: 300 }); // 5 min
```

**Cache Strategy:**
```
Request Flow:
1. Check Redis (5 min TTL) → Return if hit
2. Check Database (24 hr TTL) → Return if recent
3. Fetch fresh → Update both caches → Return
```

---

## 🤖 AI Integration

### Primary AI Provider

**OpenAI GPT-4 Turbo**
- **Why:** Best Solidity understanding, fast, reliable
- **Model:** `gpt-4-turbo-preview`
- **Cost:** ~$0.01-0.03 per analysis
- **Usage:**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analysis = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'system', content: SECURITY_PROMPT },
    { role: 'user', content: contractCode }
  ],
  temperature: 0.3,
  response_format: { type: 'json_object' }
});
```

### Backup AI Provider

**Caffeine.ai (Optional)**
- **Why:** Specialized for crypto/code analysis
- **Fallback:** If OpenAI fails or rate limited
- **Cost:** Similar pricing

**Multi-Provider Pattern:**
```typescript
async function analyzeWithFallback(code: string) {
  try {
    return await openai.analyze(code);
  } catch (error) {
    console.log('OpenAI failed, trying Caffeine.ai');
    return await caffeine.analyze(code);
  }
}
```

---

## ⛓️ Blockchain Integration

### Contract Data

**Etherscan API**
- **Why:** Official, verified contract source code
- **Plan:** Free tier (5 calls/second)
- **Endpoints:**
    - `getsourcecode` - Contract code
    - `getabi` - Contract ABI
    - `txlist` - Transaction history

```typescript
const response = await fetch(
  `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${addr}&apikey=${key}`
);
```

**Multi-Chain Support (Future):**
```typescript
const EXPLORERS = {
  ethereum: 'https://api.etherscan.io',
  bsc: 'https://api.bscscan.com',
  polygon: 'https://api.polygonscan.com',
  base: 'https://api.basescan.org',
};
```

### Blockchain RPC

**Alchemy**
- **Why:** Reliable, fast, generous free tier
- **Plan:** Free tier → $49/mo when needed
- **Use Cases:**
    - Token balances
    - Holder counts
    - Transaction data
    - Event logs

```typescript
const response = await fetch(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  }
);
```

---

## 💳 Payment Processing

### Stripe Integration

**Stripe**
- **Why:** Industry standard, best developer experience
- **Plan:** 2.9% + $0.30 per transaction
- **Features:**
    - Subscriptions
    - Customer portal
    - Webhooks
    - Tax handling

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_pro_monthly' }],
});
```

**Product Setup:**
```typescript
const products = {
  pro_monthly: {
    price: 2900, // $29.00
    interval: 'month',
    features: ['unlimited_scans', 'api_access']
  },
  pro_annual: {
    price: 29000, // $290.00
    interval: 'year',
    features: ['unlimited_scans', 'api_access', '17%_discount']
  }
};
```

---

## 🚀 Deployment

### Hosting Platform

**Vercel**
- **Why:** Built for Next.js, zero-config, edge network
- **Plan:** Free tier → $20/mo when needed
- **Features:**
    - Automatic deployments (Git push)
    - Preview deployments (PR)
    - Edge Functions
    - Analytics
    - Web Vitals monitoring

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**
```bash
# Set in Vercel dashboard
DATABASE_URL=
UPSTASH_REDIS_URL=
OPENAI_API_KEY=
ETHERSCAN_API_KEY=
STRIPE_SECRET_KEY=
```

### Domain & DNS

**Domain:** Custom domain (optional)
- Purchase from Namecheap/Cloudflare
- Point to Vercel
- Auto SSL certificates

---

## 📊 Monitoring & Analytics

### Analytics

**Vercel Analytics** (Built-in)
- Real-time traffic
- Web Vitals
- Core Web Vitals score

**PostHog** (Recommended for product analytics)
- User behavior tracking
- Funnel analysis
- Feature flags
- Session recordings

```typescript
// PostHog integration
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com'
});

// Track events
posthog.capture('contract_scanned', {
  riskScore: 85,
  recommendation: 'AVOID'
});
```

---

## 🔧 Development Tools

### Code Quality

**TypeScript**
- Strict mode enabled
- No implicit any
- Full type coverage

**ESLint**
- Next.js config
- TypeScript rules
- Auto-fix on save

**Prettier**
- Code formatting
- Tailwind plugin

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Development Workflow

```bash
# Local development
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Database
npm run db:push        # Push schema
npm run db:studio      # Open GUI

# Build
npm run build
npm run start          # Test production build
```

---

## 💰 Cost Breakdown

### Monthly Costs (Estimated)

**Starting Out (0-1,000 users):**
```
Neon Database:        $0 (Free tier)
Upstash Redis:        $0 (Free tier)
Vercel Hosting:       $0 (Free tier)
Etherscan API:        $0 (Free tier)
Alchemy API:          $0 (Free tier)
OpenAI API:          $50 (1,000 analyses)
Domain:               $1 (annual / 12)
─────────────────────────
Total:              ~$51/month
```

**Growing (1,000-10,000 users):**
```
Neon Database:       $19
Upstash Redis:       $10
Vercel Hosting:      $20
Etherscan API:        $0
Alchemy API:         $49
OpenAI API:         $200 (caching reduces this)
Domain:               $1
─────────────────────────
Total:             ~$299/month
```

**At Scale (10,000+ users):**
```
Neon Database:       $50
Upstash Redis:       $30
Vercel Hosting:      $50
Alchemy API:         $99
OpenAI API:         $500 (heavy caching)
─────────────────────────
Total:             ~$729/month

Revenue at 500 Pro users: $14,500
Profit margin: 95% 🎉
```

---

## 🎯 Why This Stack is Perfect

### 1. Speed to Market
- ✅ All tools you already know
- ✅ Zero config needed
- ✅ 2-week MVP realistic
- ✅ Fast iteration cycles

### 2. Scalability
- ✅ Handles 0-100k users seamlessly
- ✅ Serverless auto-scaling
- ✅ Edge-optimized
- ✅ No infrastructure management

### 3. Cost Efficiency
- ✅ $0-50 to start
- ✅ Pay only for what you use
- ✅ Caching reduces API costs
- ✅ High profit margins

### 4. Developer Experience
- ✅ Type-safe end-to-end
- ✅ Hot reload
- ✅ Excellent tooling
- ✅ Great documentation

### 5. Production Ready
- ✅ Battle-tested stack
- ✅ Enterprise security
- ✅ High availability
- ✅ Monitoring built-in

---

## 🔄 Alternative Stacks (Not Recommended)

### Why Not These?

**Angular + NestJS:**
- ❌ Heavier (slower development)
- ❌ Separate frontend/backend
- ❌ More complex deployment
- ✅ Your expertise (only pro)

**Vue + Supabase:**
- ❌ Less crypto ecosystem integration
- ❌ Supabase costs more at scale
- ❌ Not your primary stack

**ICP (Internet Computer):**
- ❌ 3x longer development time
- ❌ Higher learning curve
- ❌ Reverse gas model risky
- ❌ Less mature ecosystem
- ❌ Overkill for this use case

---

## 📚 Learning Resources

### Official Docs
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Tutorials
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Drizzle with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart)

---

## Related Notes

- [[01-Executive-Summary]] - Project overview
- [[04-Quick-Start]] - Setup guide
- [[05-Database-Schema]] - Database design
- [[06-API-Services]] - Service architecture
- [[ALL-CODE-FILES]] - Complete codebase

---

#tech-stack #architecture #nextjs #typescript #ai
