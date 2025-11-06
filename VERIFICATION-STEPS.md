# Token Search Fix - Verification Steps

## Issue Summary
Token searches were returning no results when `COINGECKO_API_KEY` was not configured in `.env.local`. The component appeared to work (debounce, loading states) but no tokens were displayed.

## Root Cause
- Missing CoinGecko API key → client runs in "demo" mode
- Demo mode has severe rate limits (10-15 calls/minute)
- Parallel fetches for 30-100 coins hit rate limits immediately
- Errors were caught and logged but not surfaced to users
- Result: empty `tokens[]` array returned, no visible error

## Fix Applied
1. **Demo Mode Detection**: Detects when no API key is present
2. **Conservative Limits**: Reduces parallel requests from 30-100 to 5-10 in demo mode
3. **Error Surfacing**: Throws explicit error when all fetches fail, triggering fallback APIs
4. **Enhanced Logging**: Tracks successful vs failed fetches, logs demo mode status

## Verification Steps

### 1. Prerequisites
```bash
# Ensure you're on the fix branch
git checkout feat/search-token-name

# Install dependencies
npm install

# Verify COINGECKO_API_KEY is empty (demo mode test)
grep COINGECKO_API_KEY .env.local
# Should show: COINGECKO_API_KEY=   # Optional, increases rate limits
```

### 2. Run Type Checking
```bash
# Verify no TypeScript errors
npx tsc --noEmit
# Expected: No output (success)
```

### 3. Start Development Server
```bash
# Start the dev server
npm run dev
# Expected: Server starts on http://localhost:3000 or 3001
```

### 4. Test Token Search API

#### Test A: Basic Search
```bash
# Search for PEPE on Ethereum
curl "http://localhost:3001/api/tokens/search?q=pepe&chain=ethereum" | jq

# Expected response:
{
  "status": "success",
  "data": [
    {
      "name": "PepeCoin",
      "symbol": "PEPE",
      "address": "0x...",
      "chain": "ethereum",
      "verified": true
    }
  ],
  "meta": {
    "source": "database|coingecko|dexscreener",
    "cached": true|false,
    "count": 4
  }
}
```

#### Test B: Multiple Searches
```bash
# Run the test script
node test-token-search.js

# Expected output:
# ✅ All tests pass with results
# 📊 Shows token counts
# 🔍 Displays data source
```

### 5. Frontend Testing

1. **Open the Application**
   ```
   http://localhost:3001
   ```

2. **Navigate to Crypto Scan Interface**

3. **Test Token Search Input**
   - Type "pepe" in the search field
   - Expected: Debounce delay (300ms), then loading spinner
   - Expected: Dropdown shows PEPE token results
   - Expected: Can select a token from results

4. **Verify Search Works for Multiple Tokens**
   - Try: SHIB, UNI, DOGE, USDT, USDC
   - Expected: Each search returns relevant tokens

### 6. Check Logs

Monitor the terminal for log entries:

```
✅ Good logs:
- "Token search completed" with resultCount > 0
- "CoinGecko search results processed" with tokensFound > 0
- Source: "database" | "coingecko" | "dexscreener"

⚠️ Warning logs (expected in demo mode):
- "Running in CoinGecko demo mode - results limited"
- "CoinGecko rate limit error" → should trigger fallback

❌ Error logs (investigate if seen):
- "Search failed" without fallback
- "No results found" with no error context
```

### 7. Test With API Key (Optional)

To test full functionality with CoinGecko API key:

1. **Add CoinGecko API Key**
   ```bash
   # Edit .env.local
   COINGECKO_API_KEY=your_api_key_here
   ```

2. **Restart Dev Server**
   ```bash
   npm run dev
   ```

3. **Clear Redis Cache** (optional, to force fresh API calls)
   ```bash
   # If using Upstash Redis
   # Login to Upstash dashboard and clear cache
   # OR wait for TTL expiration (5 minutes)
   ```

4. **Re-test Searches**
   - Should fetch more results (30-100 coins)
   - Logs should show `demoMode: false`

### 8. Edge Cases to Test

#### A. Rate Limit Handling
```bash
# Make 20 rapid searches (if in demo mode)
for i in {1..20}; do
  curl -s "http://localhost:3001/api/tokens/search?q=test$i&chain=ethereum"
done

# Expected: Some requests may hit rate limits but should:
# - Return cached results OR
# - Fall back to DexScreener OR
# - Show user-friendly error message
```

#### B. Invalid Inputs
```bash
# Test with invalid chain
curl "http://localhost:3001/api/tokens/search?q=pepe&chain=invalid"
# Expected: 400 error with message "Invalid chain"

# Test with short query (< 2 characters)
curl "http://localhost:3001/api/tokens/search?q=a"
# Expected: 400 error with message "Query must be at least 2 characters"
```

#### C. Empty Results
```bash
# Test with non-existent token
curl "http://localhost:3001/api/tokens/search?q=zzznottokenzzz&chain=ethereum" | jq
# Expected: 200 with empty data array and helpful message
```

## Success Criteria

✅ **Fix is successful if**:
1. Token searches return results (from cache, CoinGecko, or DexScreener)
2. No silent failures - errors are logged and handled
3. Frontend search input displays token results
4. Demo mode (no API key) works with reduced functionality
5. With API key, full functionality is restored
6. Type checking passes without errors
7. No console errors in browser or terminal (except expected warnings)

## Known Limitations

- **Demo Mode**: Limited to 5-10 results per search vs 30-100 with API key
- **Rate Limits**: Demo mode may still hit rate limits with rapid searches
- **Fallback Quality**: DexScreener fallback has less comprehensive data than CoinGecko

## Rollback Plan

If the fix causes issues:

```bash
# Revert the commit
git revert HEAD

# Or reset to previous state
git reset --hard HEAD~1

# Restore previous behavior
npm run dev
```

## Additional Resources

- **CoinGecko API Docs**: https://docs.coingecko.com/reference/introduction
- **Project Issue**: Token search returning no results (#XXX)
- **Related Files**:
  - `lib/services/token-search.service.ts`
  - `lib/services/coingecko.client.ts`
  - `components/crypto/TokenSearchInput.tsx`
