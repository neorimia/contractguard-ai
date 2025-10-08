# Test Scripts

Comprehensive test scripts for ContractGuard AI.

## Available Tests

### 1. End-to-End Audit Flow Test

Tests the complete audit pipeline including AI analysis, contract fetching, and enrichment.

```bash
npx tsx scripts/test-audit-flow.ts
```

**Tests:**

- ✅ Contract Service (Etherscan API integration)
- ✅ Enrichment Data (Alchemy + DexScreener)
- ✅ AI Analysis (OpenAI/Claude with fallback)
- ✅ Pattern Detection
- ✅ Error Handling

**Expected Duration:** 30-60 seconds

### 2. Caching System Test

Tests Redis and Database caching functionality.

```bash
npx tsx scripts/test-caching.ts
```

**Tests:**

- ✅ Redis Cache (write, read, TTL, delete)
- ✅ Database Cache (insert, query, update)
- ✅ Cache invalidation

**Expected Duration:** 5-10 seconds

## Prerequisites

Before running tests, ensure you have:

1. **Environment Variables** configured in `.env.local`:

   ```env
   DATABASE_URL=your_neon_postgres_url
   UPSTASH_REDIS_URL=your_redis_url
   UPSTASH_REDIS_TOKEN=your_redis_token
   OPENAI_API_KEY=your_openai_key  # or CLAUDE_API_KEY
   ETHERSCAN_API_KEY=your_etherscan_key
   ALCHEMY_API_KEY=your_alchemy_key
   ```

2. **Dependencies** installed:

   ```bash
   npm install
   ```

3. **Database** schema up to date:
   ```bash
   npm run db:push
   ```

## Test Results

### Success Output

```
✅ All tests passed! System is ready for production.
```

### Failure Output

```
⚠️  Some tests failed. Please review and fix issues.
```

## Common Issues

### "AI API key not configured"

- Add `OPENAI_API_KEY` or `CLAUDE_API_KEY` to `.env.local`

### "Redis connection failed"

- Check `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`

### "Database connection failed"

- Verify `DATABASE_URL` is correct
- Run `npm run db:push` to ensure schema is up to date

### "Etherscan rate limit"

- Free tier has rate limits
- Consider upgrading or waiting 1 minute between tests

## Manual Testing

For manual end-to-end testing:

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000

3. Test with known contracts:
   - **USDT (Safe):** `0xdac17f958d2ee523a2206206994597c13d831ec7`
   - **Uniswap (Safe):** `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Tests
  run: |
    npx tsx scripts/test-audit-flow.ts
    npx tsx scripts/test-caching.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    UPSTASH_REDIS_URL: ${{ secrets.UPSTASH_REDIS_URL }}
    UPSTASH_REDIS_TOKEN: ${{ secrets.UPSTASH_REDIS_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
    ALCHEMY_API_KEY: ${{ secrets.ALCHEMY_API_KEY }}
```

## Contributing

When adding new features, please add corresponding tests to ensure system reliability.
