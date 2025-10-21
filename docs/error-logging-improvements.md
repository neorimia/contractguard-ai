# Error Logging Improvements

## Changes Made

### 1. Removed Duplicate Error Logging

**Problem**: Errors were being logged twice - once in the `catch` block and once in `createErrorResponse()`, creating verbose duplicate stack traces.

**Solution**: Removed duplicate `console.error()` calls from catch blocks in:
- `POST /api/audit` (main handler)
- `GET /api/audit` (retrieval endpoint)
- `handleAnonymousScan()` (anonymous flow)

**Before**:
```typescript
} catch (error: any) {
  console.error("Audit API error:", error);  // ❌ Duplicate logging
  return createErrorResponse(error, requestId);
}
```

**After**:
```typescript
} catch (error: any) {
  // Error logging handled by createErrorResponse
  return createErrorResponse(error, requestId);
}
```

### 2. Improved Error Handler Logging

**Problem**: All errors logged at the same level with full stack traces, even for expected client errors (400s).

**Solution**: Differentiated logging based on error type:
- **500+ errors**: Full error logging with stack trace (unexpected/internal errors)
- **400s errors**: Warning-level logging without stack traces (expected client errors)

**Implementation** (`lib/utils/error-handler.ts`):
```typescript
const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
const logMessage = `[${error.statusCode}] ${error.template.error}`;
const logData = {
  requestId: response.metadata?.requestId,
  ...(error.additionalDetails && { details: error.additionalDetails }),
};

if (logLevel === 'error') {
  // 500s - Internal errors, need full stack trace
  console.error(logMessage, logData, error);
} else {
  // 400s - Client errors, just log the details
  console.warn(logMessage, logData);
}
```

## Log Output Examples

### Client Errors (400s) - Now Cleaner

**Old Output**:
```
Anonymous scan error: Error [APIError]: This contract's source code is not verified...
    at Object.contractNotVerified (lib/utils/error-handler.ts:104:30)
    at handleAnonymousScan (app/api/audit/route.ts:714:26)
    ...full stack trace...
[400] Contract not verified: {
  message: "This contract's source code is not verified...",
  requestId: '573406e3-bb22-482c-9c96-81a0e635c1dd',
  details: undefined
}
```

**New Output**:
```
[400] Contract not verified {
  requestId: '573406e3-bb22-482c-9c96-81a0e635c1dd'
}
```

### Server Errors (500s) - Still Detailed

```
[500] Database error {
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  details: { originalError: 'Connection refused' }
} Error [APIError]: ...
    at Object.databaseError (lib/utils/error-handler.ts:157:30)
    ...full stack trace...
```

## Benefits

1. **Cleaner Development Logs**: Expected client errors (invalid input, unverified contracts) don't clutter logs with stack traces
2. **Easier Debugging**: Real problems (500s) still get full stack traces
3. **Better Monitoring**: Different log levels make it easier to filter in production logging tools
4. **No Duplicate Logging**: Single source of truth for error logging

## Testing

Test with an unverified contract to see cleaner logs:

```bash
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x0000000000000000000000000000000000000000",
    "chain": "ethereum"
  }'
```

**Expected Log Output** (clean warning, no stack trace):
```
[400] Contract not verified { requestId: '...' }
```

**Expected API Response** (still detailed for user):
```json
{
  "status": "error",
  "severity": "error",
  "error": "Contract not verified",
  "message": "This contract's source code is not verified on the blockchain explorer...",
  "action": "check_input",
  "details": { ... }
}
```

## Production Integration

For production, you can integrate with monitoring services:

```typescript
// In lib/utils/error-handler.ts

if (logLevel === 'error') {
  console.error(logMessage, logData, error);

  // Optional: Send to Sentry
  // Sentry.captureException(error, { extra: logData });
} else {
  console.warn(logMessage, logData);

  // Optional: Track client errors in PostHog
  // posthog.capture('client_error', logData);
}
```
