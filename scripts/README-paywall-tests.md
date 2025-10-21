# Paywall System Tests

This directory contains comprehensive tests for the paywall system implementation.

## Running the Tests

### Quick Start

```bash
npm run test:paywall
```

### Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains:

   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   UPSTASH_REDIS_URL=https://your-redis-instance.upstash.io
   UPSTASH_REDIS_TOKEN=your_redis_token_here
   ```

2. **Database Setup**: Make sure your database schema is up to date:
   ```bash
   npm run db:push
   ```

### Test Coverage

The paywall test suite covers:

1. **`determineReportAccess()` Function** (8 test cases)
   - Pro user → full access
   - Team user → full access
   - Free user → summary access
   - Valid instant report → full access
   - Expired instant report → summary access
   - Anonymous user → summary access
   - Anonymous with instant report → full access
   - Non-existent user → graceful error handling

2. **Helper Functions** (30+ test cases)
   - `getHolderRange()` - converts exact counts to ranges
   - `getLiquidityRange()` - converts USD amounts to ranges
   - `calculateTokenAge()` - converts deploy dates to age brackets
   - `getSeverityScore()` - severity level scoring
   - `transformToSummaryReport()` - summary data transformation
   - `transformToFullReport()` - full data transformation

3. **Integration Tests** (4 scenarios)
   - Anonymous user → summary response
   - Free user → summary response
   - Pro user → full response
   - Instant credit user → full response with expiration

### Test Output

The test suite provides detailed output showing:

- ✅ Pass/Fail status for each test
- 📊 Summary statistics for each test group
- 🏁 Overall test completion time and status

### Troubleshooting

**"No database connection string" error:**

1. Check that `.env.local` exists in project root
2. Verify `DATABASE_URL` is correctly set
3. See `docs/ENV_VARIABLES.md` for detailed setup

**Test failures:**

1. Ensure database schema is up to date (`npm run db:push`)
2. Check that all required environment variables are set
3. Verify database connection is working

### Test Architecture

- **Database**: Creates and cleans up test users and instant reports
- **Isolation**: Each test runs independently with proper cleanup
- **Mock Data**: Uses realistic test data for audit results
- **Error Handling**: Comprehensive error detection and reporting

The test suite ensures the paywall system works correctly across all user scenarios and handles edge cases gracefully.
