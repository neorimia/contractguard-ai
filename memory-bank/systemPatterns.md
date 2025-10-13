# System Patterns - ContractGuard AI

## Architecture Overview

### High-Level Architecture

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

## Core System Patterns

### 1. API-First Design

All functionality exposed through RESTful API endpoints that can serve both web UI and future mobile apps.

**Pattern:**

```typescript
// app/api/audit/route.ts
export async function POST(req: NextRequest) {
  // 1. Validate input
  // 2. Check rate limits
  // 3. Check cache
  // 4. Process request
  // 5. Return structured response
}
```

**Benefits:**

- Future-proof for mobile apps
- Enables API monetization
- Clear separation of concerns
- Easy testing and documentation

### 2. Multi-Layer Caching Strategy

Implement aggressive caching to reduce API costs and improve performance.

**Cache Layers:**

1. **Redis (5 minutes)** - Hot cache for recent requests
2. **Database (24 hours)** - Warm cache for analyzed contracts
3. **CDN (1 hour)** - Static assets and share cards

**Pattern:**

```typescript
const cacheKey = `audit:${chain}:${address}`;

// Check Redis first
const cached = await redis.get(cacheKey);
if (cached) return cached;

// Check database second
const dbResult = await db.query.audits.findFirst({
  where: eq(audits.contractAddress, address),
});
if (dbResult && isRecent(dbResult.createdAt)) return dbResult;

// Fetch fresh data
const fresh = await analyzeContract(address);
await redis.set(cacheKey, fresh, { ex: 300 });
await db.insert(audits).values(fresh);
return fresh;
```

### 3. Rate Limiting with Tiers

Implement user-based rate limiting to control costs and enable freemium model.

**Tier Structure:**

```typescript
const RATE_LIMITS = {
  free: { limit: 3, window: 86400 }, // 3/day
  pro: { limit: 1000, window: 86400 }, // 1000/day
  enterprise: { limit: 10000, window: 86400 },
};
```

**Implementation:**

```typescript
// lib/middleware/rate-limit.ts
export async function checkRateLimit(userId: string, tier: string) {
  const limit = RATE_LIMITS[tier];
  const key = `rate_limit:${userId}:${Date.now()}`;

  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, limit.window);

  return current <= limit.limit;
}
```

### 4. AI Analysis Pipeline

Structured pipeline for contract analysis with fallback mechanisms.

**Pipeline Steps:**

1. **Contract Fetching** - Get source code from Etherscan
2. **Preprocessing** - Clean and validate code
3. **AI Analysis** - GPT-4 analysis with structured prompt
4. **Post-processing** - Parse and validate AI response
5. **Enrichment** - Add blockchain data (holders, liquidity)
6. **Caching** - Store results for future requests

**Pattern:**

```typescript
class ContractAnalysisPipeline {
  async analyze(address: string): Promise<AnalysisResult> {
    // 1. Fetch contract
    const contract = await this.contractService.fetch(address);

    // 2. Preprocess
    const cleaned = await this.preprocess(contract);

    // 3. AI analysis
    const aiResult = await this.aiService.analyze(cleaned);

    // 4. Enrichment
    const enriched = await this.enrich(aiResult, address);

    // 5. Cache and return
    await this.cache(enriched);
    return enriched;
  }
}
```

### 5. Error Handling & Resilience

Comprehensive error handling with graceful degradation.

**Error Types:**

- **User Errors:** Invalid addresses, rate limits
- **External Errors:** API failures, network issues
- **System Errors:** Database failures, AI timeouts

**Pattern:**

```typescript
try {
  const result = await analyzeContract(address);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  if (error instanceof ExternalAPIError) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  // Log unexpected errors
  console.error("Unexpected error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### 6. Data Modeling Patterns

Type-safe data models with Drizzle ORM and TypeScript.

**Schema Pattern:**

```typescript
// db/schema.ts
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  riskScore: integer("risk_score"),
  issues: jsonb("issues").$type<Issue[]>(),
  // ... other fields
});

// Type inference
export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
```

**Service Pattern:**

```typescript
// lib/services/contract.service.ts
export class ContractService {
  constructor(private db: Database) {}

  async findByAddress(address: string): Promise<Audit | null> {
    return this.db.query.audits.findFirst({
      where: eq(audits.contractAddress, address),
    });
  }

  async create(data: NewAudit): Promise<Audit> {
    const [result] = await this.db.insert(audits).values(data).returning();
    return result;
  }
}
```

## Component Architecture

### 1. Blockchain Service Architecture (Multi-Chain)

**🆕 Etherscan V2 Migration (Oct 2025)**

Unified blockchain service architecture using Etherscan V2 API for 50+ EVM chains.

**Architecture:**

```typescript
// lib/services/blockchain/chain-config.ts
// Chain ID mappings and utilities
export const CHAIN_IDS = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  // ... 50+ chains
};

// lib/services/blockchain/etherscan-v2.service.ts
// Unified service for all EVM chains
export class EtherscanV2Service extends BaseBlockchainService {
  constructor(chain: string) {
    const chainId = getChainId(chain);
    super(apiKey, "https://api.etherscan.io/v2", 5);
  }

  async fetchContractSource(address: string) {
    // Uses chainid parameter: ?chainid=1&module=contract&...
  }
}

// lib/services/blockchain/factory.ts
// Factory pattern for service instantiation
export class BlockchainServiceFactory {
  static getService(chain: string): BaseBlockchainService {
    // EVM chains → EtherscanV2Service
    // Solana → SolanaService
  }
}
```

**Benefits:**

- ✅ Single API key for 50+ chains
- ✅ Reduced code duplication (90% less)
- ✅ Easy multi-chain expansion
- ✅ Backward compatible with V1
- ✅ Feature flag for rollback

**Usage:**

```typescript
// Factory automatically uses V2 for EVM chains
const ethService = BlockchainServiceFactory.getService("ethereum");
const bscService = BlockchainServiceFactory.getService("bsc");
const baseService = BlockchainServiceFactory.getService("base"); // New chain!

// All services have identical interface
const source = await ethService.fetchContractSource(address);
const metadata = await ethService.fetchContractMetadata(address);
const holders = await ethService.fetchHolderDistribution(address);
const liquidity = await ethService.fetchLiquidityData(address);
```

### 2. Service Layer Pattern

Business logic separated into service classes.

**Services:**

- `EtherscanV2Service` - Multi-chain contract fetching (NEW)
- `SolanaService` - Solana blockchain integration
- `AIAnalysisService` - AI analysis and prompt management
- `AuthService` - Stack Auth integration
- `EmailService` - Resend email service
- `StripeService` - Payment processing
- `ReferralService` - Referral rewards
- `AnalyticsService` - Business metrics
- `AccessValidationService` - Scan access control

**Pattern:**

```typescript
// lib/services/base.service.ts
export abstract class BaseService {
  protected db: Database;
  protected redis: Redis;

  constructor(db: Database, redis: Redis) {
    this.db = db;
    this.redis = redis;
  }
}

// lib/services/contract.service.ts
export class ContractService extends BaseService {
  async fetchContract(address: string): Promise<ContractData> {
    // Implementation
  }
}
```

### 2. Repository Pattern

Data access layer abstraction.

**Pattern:**

```typescript
// lib/repositories/audit.repository.ts
export class AuditRepository {
  constructor(private db: Database) {}

  async findById(id: number): Promise<Audit | null> {
    return this.db.query.audits.findFirst({
      where: eq(audits.id, id),
    });
  }

  async findByAddress(address: string): Promise<Audit | null> {
    return this.db.query.audits.findFirst({
      where: eq(audits.contractAddress, address),
    });
  }

  async create(data: NewAudit): Promise<Audit> {
    const [result] = await this.db.insert(audits).values(data).returning();
    return result;
  }
}
```

### 3. Middleware Pattern

Cross-cutting concerns handled by middleware.

**Middleware Stack:**

```typescript
// lib/middleware/index.ts
export const middleware = [
  corsMiddleware,
  rateLimitMiddleware,
  authMiddleware,
  errorHandlerMiddleware,
];

// Applied in API routes
export async function POST(req: NextRequest) {
  return await withMiddleware(middleware, async (req) => {
    // Route handler logic
  })(req);
}
```

## Frontend Patterns

### 1. Component Composition

Reusable UI components with clear interfaces.

**Pattern:**

```typescript
// components/ui/analysis-result.tsx
interface AnalysisResultProps {
  result: AnalysisResult;
  onShare?: () => void;
  onUpgrade?: () => void;
}

export function AnalysisResult({ result, onShare, onUpgrade }: AnalysisResultProps) {
  return (
    <Card>
      <RiskScore score={result.riskScore} />
      <IssuesList issues={result.issues} />
      <Recommendation recommendation={result.recommendation} />
      <ActionButtons onShare={onShare} onUpgrade={onUpgrade} />
    </Card>
  );
}
```

### 2. State Management

Local state with React hooks, global state with Zustand (if needed).

**Pattern:**

```typescript
// hooks/use-analysis.ts
export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (address: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        body: JSON.stringify({ address }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, analyze };
}
```

### 3. Loading States

Comprehensive loading states for better UX.

**Pattern:**

```typescript
// components/ui/loading-states.tsx
export function AnalysisLoading() {
  return (
    <Card>
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </Card>
  );
}
```

## Security Patterns

### 1. Input Validation

Comprehensive input validation and sanitization.

**Pattern:**

```typescript
// lib/validation/contract.ts
import { z } from "zod";

export const ContractAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export function validateContractAddress(input: unknown): string {
  return ContractAddressSchema.parse(input);
}
```

### 2. API Security

Rate limiting, CORS, and authentication.

**Pattern:**

```typescript
// lib/middleware/security.ts
export function withSecurity(handler: NextRequestHandler) {
  return async (req: NextRequest) => {
    // CORS headers
    const response = await handler(req);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    return response;
  };
}
```

### 3. Data Privacy

Minimal data collection and proper handling.

**Pattern:**

```typescript
// Only collect necessary data
interface UserData {
  email: string; // Required for account
  tier: "free" | "pro"; // Required for rate limiting
  // No personal information beyond email
}
```

## Performance Patterns

### 1. Database Optimization

Proper indexing and query optimization.

**Indexes:**

```sql
-- Common query patterns
CREATE INDEX idx_audits_address ON audits(contract_address);
CREATE INDEX idx_audits_created ON audits(created_at DESC);
CREATE INDEX idx_audits_chain ON audits(chain);
```

### 2. Caching Strategy

Multi-level caching for optimal performance.

**Cache Keys:**

```typescript
const CACHE_KEYS = {
  audit: (chain: string, address: string) => `audit:${chain}:${address}`,
  user: (userId: string) => `user:${userId}`,
  rateLimit: (userId: string) => `rate_limit:${userId}`,
};
```

### 3. Code Splitting

Lazy loading for better performance.

**Pattern:**

```typescript
// components/analysis-result.tsx
const ShareCard = lazy(() => import('./share-card'));

export function AnalysisResult() {
  const [showShare, setShowShare] = useState(false);

  return (
    <div>
      <button onClick={() => setShowShare(true)}>Share</button>
      {showShare && (
        <Suspense fallback={<div>Loading...</div>}>
          <ShareCard />
        </Suspense>
      )}
    </div>
  );
}
```

## Deployment Patterns

### 1. Environment Configuration

Environment-specific configuration management.

**Pattern:**

```typescript
// lib/config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  },
  ai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
  },
  blockchain: {
    etherscan: process.env.ETHERSCAN_API_KEY!,
    alchemy: process.env.ALCHEMY_API_KEY!,
  },
} as const;
```

### 2. Health Checks

Comprehensive health monitoring.

**Pattern:**

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]);

  const healthy = checks.every((check) => check.status === "fulfilled");

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks: checks.map((check, i) => ({
        service: ["database", "redis", "external"][i],
        status: check.status,
        error: check.status === "rejected" ? check.reason.message : null,
      })),
    },
    { status: healthy ? 200 : 503 }
  );
}
```

## Testing Patterns

### 1. Unit Testing

Service and utility function testing.

**Pattern:**

```typescript
// __tests__/services/contract.service.test.ts
describe("ContractService", () => {
  let service: ContractService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new ContractService(mockDb);
  });

  it("should fetch contract by address", async () => {
    const address = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
    const expected = { address, sourceCode: "contract Test {}" };

    mockDb.query.audits.findFirst.mockResolvedValue(expected);

    const result = await service.findByAddress(address);
    expect(result).toEqual(expected);
  });
});
```

### 2. Integration Testing

API endpoint testing.

**Pattern:**

```typescript
// __tests__/api/audit.test.ts
describe("/api/audit", () => {
  it("should analyze contract", async () => {
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      }),
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty("riskScore");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("recommendation");
  });
});
```

---

## Recent Architecture Updates

### Etherscan V2 Migration (October 13, 2025)

**What Changed:**

Migrated from individual blockchain services to unified Etherscan V2 API architecture.

**Key Files:**

- `lib/services/blockchain/chain-config.ts` - Chain mappings
- `lib/services/blockchain/etherscan-v2.service.ts` - Unified service
- `lib/services/blockchain/factory.ts` - Updated factory with V2
- `scripts/test-etherscan-v2-migration.ts` - Migration tests

**Impact:**

- ✅ Single API key for all EVM chains
- ✅ 90% reduction in blockchain service code
- ✅ Instant support for new EVM chains
- ✅ Simplified configuration and testing

**Documentation:**

See `docs/ETHERSCAN_V2_MIGRATION.md` for complete migration details.

---

**Created:** 2024-12-19  
**Last Updated:** 2025-10-13 (Etherscan V2 Migration)  
**Status:** System patterns and architecture defined  
**Next:** Technical context and development setup
