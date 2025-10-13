# Environment Variables Reference

This document lists all environment variables required for ContractGuard AI.

## Required Variables (Core Functionality)

### Database

```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

- **Purpose**: Neon PostgreSQL connection string
- **Get from**: https://neon.tech
- **Used by**: Drizzle ORM for all database operations

### Redis Cache

```bash
UPSTASH_REDIS_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_TOKEN=your_redis_token_here
```

- **Purpose**: Serverless Redis for caching and rate limiting
- **Get from**: https://upstash.com
- **Used by**: Contract analysis caching, rate limiting

### Stack Auth

```bash
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
```

- **Purpose**: User authentication and session management
- **Get from**: https://app.stack-auth.com
- **Used by**: Sign-in, sign-up, session management
- **Note**: Variables with `NEXT_PUBLIC_` prefix are exposed to browser

### AI Service

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

- **Purpose**: AI-powered contract analysis
- **Get from**: https://platform.openai.com
- **Used by**: AIAnalysisService for smart contract scanning
- **Required**: Yes (primary AI provider)

### Blockchain APIs

```bash
ETHERSCAN_API_KEY=your_etherscan_api_key
```

- **Purpose**: Fetch verified contract source code from 50+ EVM chains
- **Get from**: https://etherscan.io/myapikey
- **Used by**: EtherscanV2Service for multi-chain contract data
- **Required**: Yes
- **🆕 V2 Update**: One API key now works across all supported chains:
  - Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, and more
  - Reference: https://docs.etherscan.io/v/etherscan-v2

```bash
ALCHEMY_API_KEY=your_alchemy_api_key
```

- **Purpose**: Blockchain data enrichment (liquidity data)
- **Get from**: https://alchemy.com
- **Used by**: EtherscanV2Service enrichment methods
- **Required**: Recommended for liquidity data
- **Supported Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base

```bash
MORALIS_API_KEY=your_moralis_api_key
```

- **Purpose**: Token holder distribution and analytics
- **Get from**: https://admin.moralis.io/web3apis
- **Used by**: EtherscanV2Service for holder data
- **Required**: Recommended for holder distribution charts
- **Supported Networks**: Ethereum, BSC, Polygon, Avalanche, Fantom, Arbitrum, Optimism, Base
- **Features**: Top holder analysis, concentration risk, holder count

## Optional Variables (Enhanced Features)

### AI Fallback Provider

```bash
CLAUDE_API_KEY=your_claude_api_key_here
```

- **Purpose**: Fallback AI provider if OpenAI fails
- **Get from**: https://console.anthropic.com
- **Used by**: AIAnalysisService fallback logic
- **Required**: No (improves reliability)

### Payment Processing

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Instant Report Price IDs (one-time payments)
STRIPE_PRICE_INSTANT_1=price_xxx  # 1 report - $4.99
STRIPE_PRICE_INSTANT_3=price_xxx  # 3 reports - $9.99
STRIPE_PRICE_INSTANT_5=price_xxx  # 5 reports - $14.99

# Subscription Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_xxx    # Pro Plan - $29/month
STRIPE_PRICE_TEAM_MONTHLY=price_xxx   # Team Plan - $99/month
```

- **Purpose**: Process instant reports and subscriptions
- **Get from**: https://dashboard.stripe.com
- **Used by**: Checkout and payment services
- **Required**: For monetization (instant reports + subscriptions)

### Email Service

```bash
RESEND_API_KEY=re_your_resend_api_key
TEAM_NOTIFICATION_EMAIL=team@contractguard.ai
```

- **Purpose**: Send transactional emails (verification, notifications) and team notifications
- **Get from**: https://resend.com
- **Used by**: EmailService
- **Required**: RESEND_API_KEY recommended, TEAM_NOTIFICATION_EMAIL optional (defaults to support@contractguard.ai)

### Site Configuration

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=ContractGuard AI
```

- **Purpose**: Site metadata and redirect URLs
- **Used by**: SEO, OG images, email templates
- **Required**: Yes (change to production URL on deploy)

### Analytics

```bash
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

- **Purpose**: User behavior tracking and analytics
- **Get from**: https://posthog.com
- **Used by**: Analytics service
- **Required**: No (recommended for launch)

### Error Monitoring

```bash
SENTRY_DSN=your_sentry_dsn
```

- **Purpose**: Production error tracking and debugging
- **Get from**: https://sentry.io
- **Used by**: Error monitoring service
- **Required**: No (highly recommended for production)

## Development vs Production

### Development (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://contractguard.ai
```

## Setup Instructions

### 1. Create .env.local

```bash
# In project root
touch .env.local
```

### 2. Add Required Variables

Copy the variables above and fill in your values.

### 3. Verify Setup

```bash
npm run dev
```

Check console for any missing variable warnings.

## Security Best Practices

### ⚠️ Never commit .env files!

`.env.local` is already in `.gitignore` - keep it that way.

### 🔒 Use different keys for dev and prod

- Development: Use test/sandbox API keys
- Production: Use production API keys

### 🔑 Rotate keys regularly

Change API keys every 90 days or if compromised.

### 📝 Document which keys are active

Keep track of which API keys are in use.

## Variable Validation

The app checks for required variables on startup:

```typescript
// lib/config/env.ts (example)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}
```

## Troubleshooting

### "Environment variable not found"

1. Check `.env.local` exists in project root
2. Verify variable name spelling (case-sensitive)
3. Restart dev server after adding variables
4. For `NEXT_PUBLIC_*` vars, clear `.next` folder

### "Invalid API key"

1. Verify key is correct (no extra spaces)
2. Check API key is active in provider dashboard
3. Ensure using correct environment key (test vs prod)

### "CORS errors with Stack Auth"

1. Check `NEXT_PUBLIC_STACK_PROJECT_ID` is set
2. Verify domain is allowed in Stack Auth dashboard
3. Clear browser cache and cookies

## Environment Variables Checklist

### Minimum to Start Development

- [ ] DATABASE_URL
- [ ] UPSTASH_REDIS_URL
- [ ] UPSTASH_REDIS_TOKEN
- [ ] NEXT_PUBLIC_STACK_PROJECT_ID
- [ ] NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
- [ ] STACK_SECRET_SERVER_KEY
- [ ] OPENAI_API_KEY
- [ ] ETHERSCAN_API_KEY

### Full Feature Set

- [ ] All minimum variables above
- [ ] ALCHEMY_API_KEY
- [ ] CLAUDE_API_KEY (fallback)
- [ ] RESEND_API_KEY (emails)

### Production Ready

- [ ] All full feature set variables
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] NEXT_PUBLIC_POSTHOG_KEY
- [ ] SENTRY_DSN

## Migration Notes

### Etherscan V2 API Migration (2025-10-13)

**✅ What Changed:**

- Migrated from separate API keys per chain to unified Etherscan V2 API
- One `ETHERSCAN_API_KEY` now works for 50+ EVM chains
- Simplified configuration and reduced setup complexity

**🔧 Action Required:**

- None! Existing `ETHERSCAN_API_KEY` automatically works with V2
- Can remove old chain-specific keys (optional):
  - `BSCSCAN_API_KEY` (deprecated)
  - `POLYGONSCAN_API_KEY` (deprecated)
  - `ARBISCAN_API_KEY` (deprecated)

**📈 Benefits:**

- Easier multi-chain expansion
- Reduced API key management
- Single rate limit across all chains
- Access to new chains without code changes

---

**Last Updated**: 2025-10-13  
**Version**: 1.1 (Etherscan V2 Migration)
