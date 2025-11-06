# Token Search Feature - Design Specification

## Executive Summary

Implementation of token name search functionality to reduce user friction by 40% and increase scan volume by 25%. Users can search by token name ("PEPE") instead of needing contract addresses.

**Timeline**: 2-3 days
**Priority**: High (direct revenue impact)
**Complexity**: Medium

---

## 1. System Architecture

### 1.1 Component Reuse Strategy

**Existing Components to Reuse**:
- ✅ `Input` (`components/ui/input.tsx`) - Base input component
- ✅ `DropdownMenu` (`components/ui/dropdown-menu.tsx`) - Dropdown primitive
- ✅ `Card` (`components/ui/card.tsx`) - Result cards
- ✅ `Badge` (`components/ui/badge.tsx`) - Chain indicators
- ✅ `ChainSelector` (`components/crypto/ChainSelector.tsx`) - Chain selection logic
- ✅ `ContractService` (`lib/services/contract.service.ts`) - Address validation

**New shadcn Components Required**:
```bash
pnpm dlx shadcn@latest add command --yes
pnpm dlx shadcn@latest add popover --yes
pnpm dlx shadcn@latest add skeleton --yes
```

**New Service Layer** (extends BaseService pattern):
- `TokenSearchService` - API integration and caching

---

## 2. API Integration Layer

### 2.1 Service Architecture

**File**: `lib/services/token-search.service.ts`

```typescript
interface TokenSearchResult {
  name: string;           // "Pepe"
  symbol: string;         // "PEPE"
  address: string;        // "0x..."
  chain: string;          // "ethereum"
  logoUrl?: string;
  marketCap?: number;
  liquidity?: string;
  verified: boolean;
}

interface TokenSearchResponse {
  tokens: TokenSearchResult[];
  source: 'coingecko' | 'moralis' | 'cache';
  cached: boolean;
}

class TokenSearchService extends BaseService {
  async searchTokens(
    query: string,
    chain?: string
  ): Promise<TokenSearchResponse>

  async getTokenByAddress(
    address: string,
    chain: string
  ): Promise<TokenSearchResult | null>
}
```

### 2.2 API Provider Strategy

**Primary**: CoinGecko API (Free tier: 50 calls/min)
```typescript
// Endpoint: https://api.coingecko.com/api/v3/search
// Query: ?query=pepe&category_filter=token
```

**Fallback**: Moralis Token API
```typescript
// Endpoint: https://deep-index.moralis.io/api/v2/erc20/metadata/symbols
// Requires: MORALIS_API_KEY
```

**Tertiary**: DexScreener API (already integrated in ContractService:315)
```typescript
// Endpoint: https://api.dexscreener.com/latest/dex/search
// No auth required, rate limited
```

### 2.3 Caching Strategy

**Multi-Layer Cache** (existing pattern from ContractService):

1. **Redis** (5-minute TTL):
   - Key format: `token:search:{query}:{chain?}`
   - Store top 10 results per query
   - Cache hit rate target: 60%

2. **In-Memory Cache** (1-minute TTL):
   - Popular tokens (top 100 by volume)
   - Pre-loaded on server start
   - Reduces API calls for common searches

3. **Database** (24-hour TTL):
   - Table: `token_metadata` (new migration required)
   - Index: `symbol`, `name`, `address`

**Cache Invalidation**:
- Time-based (TTL)
- Manual purge endpoint for admins
- Version-based (API schema changes)

---

## 3. UI/UX Component Design

### 3.1 Component Hierarchy

```
TokenSearchInput (new)
├── Input (shadcn - reuse)
├── Command (shadcn - add)
│   ├── CommandInput
│   ├── CommandList
│   │   ├── CommandEmpty
│   │   ├── CommandGroup
│   │   │   └── CommandItem[]
│   │   └── CommandLoading (Skeleton)
└── Popover (shadcn - add)
```

### 3.2 TokenSearchInput Component

**File**: `components/crypto/TokenSearchInput.tsx`

**Props Interface**:
```typescript
interface TokenSearchInputProps {
  onSelect: (result: TokenSearchResult) => void;
  defaultChain?: string;
  placeholder?: string;
  className?: string;
}
```

**Key Features**:
- Debounced search (300ms) to reduce API calls
- Keyboard navigation (↑/↓ arrows, Enter to select)
- Loading states with skeleton
- Empty state messaging
- Error handling with fallback
- Chain filtering integration

**Reused Components**:
- `Input` - Base input styling
- `Badge` - Chain indicators (Ethereum, BSC, etc.)
- `Card` - Result list container
- Uses existing `ChainSelector` logic for chain handling

### 3.3 Search Result Item

**Component**: Part of `TokenSearchInput`

**Design** (using shadcn Command pattern):
```tsx
<CommandItem key={result.address} onSelect={handleSelect}>
  <div className="flex items-center justify-between w-full">
    {/* Left: Token info */}
    <div className="flex items-center gap-3">
      {result.logoUrl && (
        <img src={result.logoUrl} alt="" className="w-6 h-6 rounded-full" />
      )}
      <div>
        <div className="font-medium">{result.name}</div>
        <div className="text-sm text-muted-foreground">{result.symbol}</div>
      </div>
    </div>

    {/* Right: Metadata */}
    <div className="flex items-center gap-2">
      <Badge variant="outline">{result.chain}</Badge>
      {result.marketCap && (
        <span className="text-xs text-muted-foreground">
          ${formatMarketCap(result.marketCap)}
        </span>
      )}
    </div>
  </div>
</CommandItem>
```

### 3.4 Integration Points

**Update existing scan form** (location TBD - needs audit page inspection):
```tsx
// Before (current):
<Input
  placeholder="Enter contract address (0x...)"
  value={address}
  onChange={e => setAddress(e.target.value)}
/>

// After (enhanced):
<TokenSearchInput
  onSelect={(result) => {
    setAddress(result.address);
    setChain(result.chain);
    // Auto-trigger scan if desired
  }}
  defaultChain={selectedChain}
/>

// Keep manual input as fallback:
<Input
  placeholder="Or paste contract address directly"
  value={address}
  onChange={e => setAddress(e.target.value)}
/>
```

---

## 4. Search Algorithm & Ranking

### 4.1 Fuzzy Search Strategy

**Client-Side** (for cached results):
```typescript
import Fuse from 'fuse.js'; // Add dependency

const fuse = new Fuse(tokens, {
  keys: ['name', 'symbol'],
  threshold: 0.3,
  includeScore: true
});
```

**Server-Side** (API level):
- CoinGecko handles fuzzy matching natively
- Moralis requires exact prefix matching
- DexScreener uses approximate matching

### 4.2 Result Ranking Algorithm

**Scoring Factors** (as per requirements):

```typescript
function calculateScore(token: TokenSearchResult, query: string): number {
  let score = 0;

  // 1. Exact match bonus (40 points)
  if (token.symbol.toLowerCase() === query.toLowerCase()) score += 40;
  if (token.name.toLowerCase() === query.toLowerCase()) score += 30;

  // 2. Prefix match (20 points)
  if (token.symbol.toLowerCase().startsWith(query.toLowerCase())) score += 20;

  // 3. Market cap ranking (20 points)
  if (token.marketCap) {
    if (token.marketCap > 1_000_000_000) score += 20; // >$1B
    else if (token.marketCap > 100_000_000) score += 15; // >$100M
    else if (token.marketCap > 10_000_000) score += 10;  // >$10M
  }

  // 4. Liquidity (10 points)
  if (token.liquidity) {
    const liq = parseFloat(token.liquidity.replace(/[$K,M]/g, ''));
    if (liq > 1000) score += 10; // >$1M liquidity
    else if (liq > 100) score += 5;  // >$100K
  }

  // 5. Verification bonus (10 points)
  if (token.verified) score += 10;

  return score;
}
```

**Sort Order**:
1. Score (descending)
2. Market cap (descending)
3. Name (alphabetical)

---

## 5. User Flow

### 5.1 Happy Path

```
1. User types "PEPE" → Debounced search (300ms)
2. API call → Check Redis cache
3. Cache hit → Return cached results (50ms)
4. Display 5-10 results in dropdown
5. User selects "Pepe (PEPE) - Ethereum"
6. Address auto-fills → Scan button enabled
7. Click scan → Normal audit flow
```

### 5.2 Multi-Result Handling

**Ambiguous Search** ("PEPE" matches multiple chains):
```
Search Results:
┌─────────────────────────────────────┐
│ Pepe                          ETH ⟠ │ ← Highest market cap first
│ $PEPE • $5.2B MC                    │
├─────────────────────────────────────┤
│ Pepe                          BSC 💎│
│ $PEPE • $12M MC                     │
├─────────────────────────────────────┤
│ PepeCoin                      Base 🔵│
│ $PEPE2 • $2M MC                     │
└─────────────────────────────────────┘
```

### 5.3 Error States

**No Results**:
```tsx
<CommandEmpty>
  <div className="text-center p-4">
    <p className="text-sm text-muted-foreground">
      No tokens found for "{query}"
    </p>
    <p className="text-xs text-muted-foreground mt-2">
      Try searching by contract address instead
    </p>
  </div>
</CommandEmpty>
```

**API Failure**:
- Show cached results (if available)
- Fallback to manual address input
- Display warning toast: "Search unavailable, please enter address manually"

**Rate Limited**:
- Show last cached results
- Disable search for 60 seconds
- Display countdown timer

---

## 6. Technical Specifications

### 6.1 Performance Requirements

| Metric | Target | Current |
|--------|--------|---------|
| Search response time | <200ms (cached) | N/A |
| API response time | <1000ms (uncached) | N/A |
| Cache hit rate | >60% | N/A |
| Debounce delay | 300ms | N/A |
| Max results | 10 per query | N/A |

### 6.2 Database Schema

**New Table**: `token_metadata`

```sql
CREATE TABLE token_metadata (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  logo_url VARCHAR(500),
  market_cap BIGINT,
  liquidity VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT NOW(),

  UNIQUE(address, chain),
  INDEX idx_symbol (symbol),
  INDEX idx_name (name),
  INDEX idx_market_cap (market_cap DESC)
);
```

**Drizzle Schema** (`db/schema.ts`):
```typescript
export const tokenMetadata = pgTable("token_metadata", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 42 }).notNull(),
  chain: varchar("chain", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  marketCap: bigint("market_cap", { mode: "number" }),
  liquidity: varchar("liquidity", { length: 50 }),
  verified: boolean("verified").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  uniqueAddressChain: unique().on(table.address, table.chain),
  symbolIdx: index("idx_symbol").on(table.symbol),
  nameIdx: index("idx_name").on(table.name),
  marketCapIdx: index("idx_market_cap").on(table.marketCap),
}));
```

### 6.3 API Routes

**New Endpoint**: `app/api/tokens/search/route.ts`

```typescript
// GET /api/tokens/search?q=pepe&chain=ethereum
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const chain = searchParams.get('chain');

  if (!query || query.length < 2) {
    return Response.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const service = new TokenSearchService();
    const results = await service.searchTokens(query, chain || undefined);

    return Response.json({
      data: results.tokens,
      meta: {
        source: results.source,
        cached: results.cached,
        count: results.tokens.length
      },
      status: 'success'
    });
  } catch (error) {
    console.error('Token search error:', error);
    return Response.json(
      {
        error: 'Search temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 503 }
    );
  }
}
```

### 6.4 Environment Variables

**Add to `.env.local`**:
```bash
# Token Search APIs
COINGECKO_API_KEY=           # Optional (free tier doesn't require)
MORALIS_API_KEY=             # Already exists (fallback)
DEXSCREENER_API_KEY=         # Not required (public API)

# Feature Flags
ENABLE_TOKEN_SEARCH=true     # Toggle feature on/off
```

---

## 7. Implementation Plan

### Phase 1: Foundation (Day 1)
1. ✅ Install shadcn components: `command`, `popover`, `skeleton`
2. ✅ Create database migration for `token_metadata` table
3. ✅ Implement `TokenSearchService` with CoinGecko integration
4. ✅ Add Redis caching layer
5. ✅ Create API route `/api/tokens/search`

### Phase 2: UI Components (Day 2)
1. ✅ Build `TokenSearchInput` component
2. ✅ Implement search result rendering
3. ✅ Add loading states and skeletons
4. ✅ Error handling and empty states
5. ✅ Keyboard navigation

### Phase 3: Integration (Day 2-3)
1. ✅ Integrate into existing scan form
2. ✅ Connect to audit flow
3. ✅ Add analytics tracking
4. ✅ Testing (unit + integration)
5. ✅ Documentation updates

### Phase 4: Polish & Optimization (Day 3)
1. ✅ Performance optimization
2. ✅ Cache warming for popular tokens
3. ✅ A/B testing setup
4. ✅ User feedback collection
5. ✅ Production deployment

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Service Layer**:
```typescript
// lib/services/token-search.service.test.ts
describe('TokenSearchService', () => {
  it('should search tokens by symbol', async () => {
    const service = new TokenSearchService();
    const results = await service.searchTokens('PEPE');
    expect(results.tokens.length).toBeGreaterThan(0);
  });

  it('should rank by market cap', async () => {
    const results = await service.searchTokens('PEPE');
    const scores = results.tokens.map(t => t.marketCap || 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('should use cache when available', async () => {
    const service = new TokenSearchService();
    await service.searchTokens('PEPE'); // First call
    const cached = await service.searchTokens('PEPE'); // Second call
    expect(cached.cached).toBe(true);
  });
});
```

**Component Tests**:
```typescript
// components/crypto/TokenSearchInput.test.tsx
describe('TokenSearchInput', () => {
  it('should debounce search input', async () => {
    const onSelect = jest.fn();
    render(<TokenSearchInput onSelect={onSelect} />);

    const input = screen.getByPlaceholder(/search/i);
    fireEvent.change(input, { target: { value: 'PEPE' } });

    // Should NOT call API immediately
    expect(global.fetch).not.toHaveBeenCalled();

    // Should call after 300ms
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 400 });
  });
});
```

### 8.2 Integration Tests

**End-to-End Flow**:
```typescript
// e2e/token-search.spec.ts (Playwright)
test('user can search and select token', async ({ page }) => {
  await page.goto('/audit');

  // Type search query
  await page.fill('[placeholder*="search"]', 'PEPE');

  // Wait for results
  await page.waitForSelector('[role="option"]');

  // Select first result
  await page.click('[role="option"]:first-child');

  // Verify address is filled
  const address = await page.inputValue('[name="address"]');
  expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
});
```

---

## 9. Analytics & Metrics

### 9.1 Tracking Events

**PostHog Events**:
```typescript
// Track search usage
posthog.capture('token_search_started', {
  query: query,
  chain: selectedChain
});

posthog.capture('token_search_completed', {
  query: query,
  results_count: results.length,
  response_time_ms: responseTime,
  source: 'cache' | 'api'
});

posthog.capture('token_selected', {
  token_name: result.name,
  token_symbol: result.symbol,
  chain: result.chain,
  rank: resultIndex
});
```

### 9.2 Success Metrics

**Week 1 Targets**:
- Search adoption rate: >40% of scans
- Cache hit rate: >60%
- Search-to-scan conversion: >75%
- Average search time: <500ms

**Month 1 Targets**:
- +25% scan volume (as per requirements)
- +40% conversion rate improvement
- <1% search error rate
- >90% user satisfaction (feedback)

---

## 10. Risk Mitigation

### 10.1 Potential Issues

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Multi-tier caching + fallbacks |
| Ambiguous results | Medium | Smart ranking + clear UI |
| Incorrect token selection | High | Show full address + chain |
| Search latency | Medium | Debouncing + loading states |
| API cost overruns | High | Aggressive caching (80% target) |

### 10.2 Rollback Plan

**Feature Flag Strategy**:
```typescript
// Feature toggle
if (process.env.ENABLE_TOKEN_SEARCH !== 'true') {
  return <Input placeholder="Enter contract address" />;
}

return <TokenSearchInput />;
```

**Phased Rollout**:
1. Week 1: 10% of users (A/B test)
2. Week 2: 50% of users (if metrics positive)
3. Week 3: 100% rollout

---

## 11. Future Enhancements

### 11.1 V2 Features (Post-Launch)

- **Recent Searches**: Store user's last 10 searches
- **Popular Tokens**: Show trending tokens when empty
- **Multi-Chain Results**: Single search across all chains
- **Token Details Preview**: Hover card with quick stats
- **Voice Search**: "Scan Pepe token" voice command
- **QR Code Scan**: Mobile camera integration

### 11.2 Advanced Features (Month 2+)

- **Smart Suggestions**: "Users also searched for..."
- **Watchlist Integration**: Add from search results
- **Price Alerts**: Set alerts during search
- **Token Comparison**: Compare multiple tokens
- **Historical Scans**: Show previous scan results

---

## 12. Cost Analysis

### 12.1 API Cost Estimates

**CoinGecko Free Tier**:
- 50 calls/minute = 72,000 calls/day
- Cache hit rate: 60% → 28,800 API calls/day
- Well within free tier limits ✅

**Moralis Fallback** (if needed):
- 3M requests/month free tier
- 1M requests/month paid tier = $49/month
- Unlikely to hit limits with caching

**Total Monthly Cost**: $0-49 (depending on volume)

### 12.2 Infrastructure Cost

**Redis Cache**:
- Upstash free tier: 10K commands/day
- Paid tier: $10/month for 100K commands/day
- Current usage + token search = ~50K/day
- **Estimated cost**: $10/month

**Database Storage**:
- ~100 bytes per token record
- 10,000 tokens = 1 MB
- Negligible cost on Neon PostgreSQL

**Total Infrastructure**: ~$10-20/month

---

## 13. Documentation Requirements

### 13.1 User Documentation

- Update landing page with token search demo
- Add "How to Search" section to FAQ
- Create video tutorial (1-2 min)
- Update help tooltips

### 13.2 Developer Documentation

- API endpoint documentation
- Service layer usage examples
- Component props reference
- Caching strategy guide

---

## 14. Success Criteria

### 14.1 Launch Checklist

- [ ] All shadcn components installed
- [ ] Database migration deployed
- [ ] API endpoint functional
- [ ] Cache layer operational
- [ ] UI component complete
- [ ] Integration tests passing
- [ ] Analytics tracking live
- [ ] Documentation updated
- [ ] Feature flag ready
- [ ] Rollback plan tested

### 14.2 Post-Launch Validation

**Week 1**:
- Monitor cache hit rates
- Track search-to-scan conversion
- Collect user feedback
- Review error logs

**Week 2**:
- Analyze A/B test results
- Optimize ranking algorithm
- Adjust cache TTLs
- Plan V2 features

---

## 15. Component File Structure

```
contractguard-ai/
├── components/
│   ├── crypto/
│   │   ├── TokenSearchInput.tsx          # NEW: Main search component
│   │   └── ChainSelector.tsx             # REUSE: Chain selection
│   └── ui/
│       ├── command.tsx                    # ADD: shadcn command
│       ├── popover.tsx                    # ADD: shadcn popover
│       ├── skeleton.tsx                   # ADD: shadcn skeleton
│       ├── input.tsx                      # REUSE: Base input
│       ├── dropdown-menu.tsx              # REUSE: Dropdown
│       ├── card.tsx                       # REUSE: Cards
│       └── badge.tsx                      # REUSE: Badges
├── lib/
│   └── services/
│       ├── token-search.service.ts        # NEW: Token search service
│       └── contract.service.ts            # REUSE: Address validation
├── app/
│   └── api/
│       └── tokens/
│           └── search/
│               └── route.ts               # NEW: Search endpoint
└── db/
    └── schema.ts                          # UPDATE: Add token_metadata table
```

---

## 16. Implementation Dependencies

**NPM Packages** (if needed):
```json
{
  "dependencies": {
    "fuse.js": "^7.0.0"        // Fuzzy search (optional, for client-side)
  }
}
```

**shadcn Components**:
```bash
pnpm dlx shadcn@latest add command --yes
pnpm dlx shadcn@latest add popover --yes
pnpm dlx shadcn@latest add skeleton --yes
```

---

## Conclusion

This design specification provides a complete blueprint for implementing token search functionality while:
- ✅ **Reusing 7 existing components** (Input, DropdownMenu, Card, Badge, ChainSelector, ContractService validation)
- ✅ **Using ONLY shadcn/ui components** (Command, Popover, Skeleton to be added)
- ✅ **Following existing patterns** (Service layer, caching strategy, API route design)
- ✅ **Minimizing dependencies** (Only 3 new shadcn components, optional fuse.js)
- ✅ **Maintaining consistency** (Code style, error handling, component structure)

**Estimated Impact**:
- 40% reduction in user friction
- 25% increase in scan volume
- <$50/month operational cost
- 2-3 day implementation timeline
