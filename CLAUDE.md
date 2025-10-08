# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContractGuard AI is an AI-powered smart contract security scanner that detects scams, honeypots, and rug pulls. Built for the crypto bull market window (3-6 months) with a 14-day MVP timeline targeting $5-10k MRR.

**Tech Stack**: Next.js 15 (App Router), TypeScript, Drizzle ORM + Neon PostgreSQL, Upstash Redis, OpenAI API, shadcn/ui components, TailwindCSS v4

## Development Commands

### Core Workflow

```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run lint             # ESLint checks
```

### Database Operations

```bash
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migrations
npm run db:studio        # Open Drizzle Studio (database GUI)
```

**Important**: After modifying `db/schema.ts`, always run `npm run db:push` to sync changes.

## Architecture Patterns

### Service Layer Pattern

All external integrations use service classes in `lib/services/`:

- **ContractService** (`lib/services/contract.service.ts`): Etherscan/Alchemy blockchain data fetching
- **AIAnalysisService** (`lib/services/ai.service.ts`): OpenAI/Caffeine.ai contract analysis
- **BaseService pattern**: Extend for common functionality, implement clear interfaces

Service methods follow this structure:

```typescript
async methodName(params: Params): Promise<Result> {
  try {
    // Implementation
    return result;
  } catch (error) {
    console.error('Service error:', error);
    throw new Error('User-friendly message');
  }
}
```

### Multi-Layer Caching Strategy

Critical for cost control (targeting 80% cache hit rate):

1. **Redis** (5-minute TTL): Hot cache in `lib/redis.ts`
2. **Database** (24-hour TTL): Warm cache in `audits` table
3. **Cache key format**: `audit:${chain}:${address}`

Always check cache before expensive API calls (OpenAI, Etherscan).

### API Route Design

Located in `app/api/*/route.ts` using Next.js 15 App Router conventions:

- Always validate HTTP method and inputs
- Return consistent response format:
  - Success: `{ data: T, status: 'success' }`
  - Error: `{ error: string, details?: string, status: 'error' }`
- Comprehensive try-catch blocks with structured error responses
- Log all errors with context for debugging

### Database Schema (`db/schema.ts`)

Three main tables using Drizzle ORM:

**audits**: Contract analysis results

- Unique key: `contractAddress` (indexed)
- Analysis: `riskScore`, `summary`, `issues` (jsonb), `recommendation`
- Enrichment: `holderCount`, `liquidity`, `ownerBalance`
- Metadata: `views`, `shares`, timestamps

**users**: User accounts and tier management

- Unique key: `email`
- Tier system: `free`, `pro`, `enterprise`
- Rate limiting: `scansToday`, `scansResetAt`

**apiKeys**: API key management for users

- Foreign key: `userId` references `users.id`
- Tracking: `requestsCount`, `lastUsedAt`, `isActive`

**Type inference**: Always use Drizzle's `$inferSelect` and `$inferInsert` types instead of manual interfaces.

## AI Analysis Flow

Critical path for the application:

1. Validate contract address format (`ContractService.validateAddress()`)
2. Check Redis cache → Database cache
3. Fetch contract from Etherscan API (`ContractService.fetchContract()`)
4. Verify contract is verified (source code available)
5. Get enrichment data: holders, liquidity, owner balance
6. Send to AI service with structured prompt (`AIAnalysisService.analyze()`)
7. Parse JSON response and validate structure
8. Apply pattern-based detection as backup/validation
9. Cache results in Redis (5min) + Database (24hr)
10. Return structured response with risk score and issues

## Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL=              # Neon PostgreSQL
UPSTASH_REDIS_URL=        # Redis cache
UPSTASH_REDIS_TOKEN=      # Redis auth
OPENAI_API_KEY=           # Primary AI provider
ETHERSCAN_API_KEY=        # Contract source code
ALCHEMY_API_KEY=          # Blockchain data
NEXT_PUBLIC_SITE_URL=     # For SEO/sharing
```

Optional:

```bash
CLAUDE_API_KEY=           # Alternative AI provider (Anthropic Claude)
STRIPE_SECRET_KEY=        # Payment processing
```

## Component Structure

**shadcn/ui components** in `components/ui/`: Built on Radix UI primitives with Tailwind styling

- `button.tsx`, `input.tsx`, `label.tsx`: Form elements
- `card.tsx`: Container component
- `chart.tsx`: Recharts wrapper

**Feature components** in `components/`: Landing page sections

- `Header.tsx`: Navigation with responsive menu
- `HeroSection.tsx`: Main CTA and value proposition
- `FAQSection.tsx`, `PricingSection.tsx`, `Feature.tsx`

**SEO components** in `components/seo/`:

- `json-ld.tsx`: Structured data for Google

## Error Handling Philosophy

Status code guidelines:

- **400**: User input errors (invalid address, missing params)
- **429**: Rate limit exceeded (include retry-after)
- **503**: External API failures (Etherscan, OpenAI down)
- **500**: Internal server errors

Always log errors with `console.error()` including context for debugging.

## Performance Considerations

**AI API Cost Control**: Single biggest cost factor

- Aggressive caching (5min Redis + 24hr DB) targets 80% reduction
- Fallback to pattern-based detection on AI failure
- Consider rate limiting per user tier

**Database Queries**: Add indexes for common lookups

- `contractAddress` already unique indexed
- Consider index on `createdAt` for analytics

**Frontend**: Lazy load components, optimize images with Next.js Image

## Current Development Priorities

**Critical** (Active Development):

1. AI service error handling improvements
2. Contract enrichment (holder count, liquidity APIs)
3. Rate limiting implementation
4. User authentication system

**High Priority** (This Week):

1. Stripe integration for monetization
2. Analytics integration (PostHog)
3. Error monitoring (Sentry)
4. Production deployment to Vercel

## Business Context

- **Target users**: Crypto traders who can't read Solidity
- **Revenue model**: Freemium with $29/month Pro tier
- **Timeline**: 14-day MVP, 3-6 month bull market window
- **Success metric**: $5-10k MRR in 3 months

This context drives architectural decisions prioritizing speed-to-market and cost efficiency over premature optimization.
