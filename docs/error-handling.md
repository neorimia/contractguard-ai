# Error Handling System Documentation

## Overview

ContractGuard AI uses a comprehensive, user-friendly error handling system that provides clear, actionable feedback for all data fetching and API scenarios.

## Architecture

### Components

1. **Type Definitions** (`lib/types/errors.ts`)
   - `ClientErrorResponse`: Structured error response type
   - `SuccessResponse<T>`: Structured success response type
   - `ErrorSeverity`: error | warning | info
   - `ErrorAction`: Recommended user actions

2. **Error Messages** (`lib/constants/error-messages.ts`)
   - Centralized error message templates
   - Categorized by HTTP status code
   - User-friendly messages with technical context

3. **Error Handler** (`lib/utils/error-handler.ts`)
   - `APIError` class for typed errors
   - `ErrorFactory` for creating common errors
   - `createErrorResponse()` for consistent formatting

4. **UI Component** (`components/ui/error-alert.tsx`)
   - `ErrorAlert` component for displaying errors
   - Auto-renders appropriate actions based on error type
   - Supports custom callbacks

## Usage

### In API Routes

```typescript
import { ErrorFactory, createErrorResponse } from '@/lib/utils/error-handler';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Validate input
    if (!contractService.validateAddress(contractAddress)) {
      throw ErrorFactory.invalidAddress();
    }

    // Check contract verification
    if (!contractData.isVerified) {
      throw ErrorFactory.contractNotVerified();
    }

    // Handle external API failures
    if (apiResponse.status !== 200) {
      throw ErrorFactory.etherscanUnavailable(apiResponse.status);
    }

    // Return success
    return NextResponse.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return createErrorResponse(error, requestId);
  }
}
```

### In Service Classes

```typescript
import { ErrorFactory } from '@/lib/utils/error-handler';

export class ContractService {
  async fetchContract(address: string) {
    // Validate configuration
    if (!this.etherscanApiKey) {
      throw ErrorFactory.apiKeyMissing("Etherscan");
    }

    // Handle API errors
    if (response.message?.includes("rate limit")) {
      throw ErrorFactory.etherscanRateLimit();
    }

    // Handle not found
    if (!response.result[0]) {
      throw ErrorFactory.etherscanNotFound(address, chain);
    }
  }
}
```

### In Frontend Components

```typescript
import { ErrorAlert } from '@/components/ui/error-alert';
import { ClientErrorResponse } from '@/lib/types/errors';

function ScanResults() {
  const [error, setError] = useState<ClientErrorResponse | null>(null);

  const handleScan = async () => {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify({ contractAddress, chain }),
      });

      const data = await response.json();

      if (data.status === 'error') {
        setError(data);
      } else {
        setResults(data.data);
      }
    } catch (err) {
      // Handle network errors
      setError({
        status: 'error',
        severity: 'error',
        error: 'Network error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'retry',
      });
    }
  };

  return (
    <div>
      {error && (
        <ErrorAlert
          error={error}
          onRetry={handleScan}
          onUpgrade={() => router.push('/pricing')}
          onSignup={() => router.push('/handler/sign-up')}
        />
      )}
    </div>
  );
}
```

## Error Categories

### Client Input Errors (400)
- `invalidAddress`: Invalid blockchain address format
- `contractNotVerified`: Source code not verified on blockchain
- `missingParameters`: Required parameters missing

### Access & Rate Limiting (403, 429)
- `softAccountUpgrade`: Soft account needs full signup
- `anonymousLimitReached`: Anonymous user hit 3 scan limit
- `freeTierLimit`: Free user hit daily scan limit
- `instantCreditsDepl`: No instant credits remaining
- `accessLimitExceeded`: Generic access limit error

### External Service Failures (503)
- `etherscanUnavailable`: Etherscan API down or timeout
- `etherscanRateLimit`: Etherscan rate limit exceeded
- `etherscanNotFound`: Contract not found on blockchain
- `aiServiceTimeout`: AI analysis timeout (30s)
- `aiServiceUnavailable`: All AI providers failed
- `enrichmentDataPartial`: Some enrichment data unavailable

### Internal Server Errors (500)
- `databaseError`: Database operation failed
- `analysisFailed`: Analysis could not complete
- `userSyncFailed`: User account sync error
- `invalidUserAccount`: User account missing data
- `apiKeyMissing`: Required API key not configured
- `unexpectedError`: Catch-all for unknown errors

## Error Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "cached": false,
  "metadata": {
    "accessType": "free",
    "scansRemaining": 2,
    "instantCredits": 0
  }
}
```

### Error Response
```json
{
  "status": "error",
  "severity": "error",
  "error": "Contract not verified",
  "message": "This contract's source code is not verified on the blockchain explorer. We can only analyze verified contracts for your security.",
  "action": "check_input",
  "details": {
    "reason": "Unverified contracts cannot be analyzed because their source code is not publicly available",
    "documentationUrl": "/docs/verified-contracts"
  },
  "metadata": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

## Best Practices

### 1. Always Use ErrorFactory
```typescript
// ✅ Good
throw ErrorFactory.invalidAddress();

// ❌ Bad
throw new Error("Invalid address");
```

### 2. Provide Context
```typescript
// ✅ Good
throw ErrorFactory.etherscanNotFound(address, chain);

// ❌ Bad
throw ErrorFactory.etherscanNotFound();
```

### 3. Use Request IDs
```typescript
// ✅ Good
const requestId = crypto.randomUUID();
return createErrorResponse(error, requestId);

// ❌ Bad
return createErrorResponse(error);
```

### 4. Handle Frontend Errors
```typescript
// ✅ Good
if (data.status === 'error') {
  setError(data);
} else {
  setResults(data.data);
}

// ❌ Bad
if (data.error) {
  // Inconsistent checking
}
```

### 5. Provide User Actions
```typescript
// ✅ Good
<ErrorAlert
  error={error}
  onRetry={handleRetry}
  onUpgrade={() => router.push('/pricing')}
/>

// ❌ Bad
<ErrorAlert error={error} />
// Missing action callbacks
```

## Testing Error Scenarios

### Test Invalid Address
```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"contractAddress": "invalid"}'
```

### Test Unverified Contract
```bash
# Use a known unverified contract address
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"contractAddress": "0x0000000000000000000000000000000000000000"}'
```

### Test Rate Limiting
```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/audit \
    -H "Content-Type: application/json" \
    -d '{"contractAddress": "0x..."}'
done
```

## Monitoring and Debugging

### Request ID Tracking
Every error includes a `requestId` in metadata and `X-Request-ID` header for tracing:

```typescript
console.error(`[${error.statusCode}] ${error.template.error}:`, {
  message: error.message,
  requestId,
  details: error.additionalDetails,
});
```

### Response Headers
- `X-Request-ID`: Unique request identifier
- `X-Error-Type`: Technical error name
- `X-Access-Type`: User access level
- `X-Scans-Remaining`: Remaining scan count
- `X-Instant-Credits`: Remaining instant credits

## Future Enhancements

1. **Error Analytics**: Track error rates by type and severity
2. **User Feedback**: Allow users to report incorrect error messages
3. **A/B Testing**: Test different error message variations
4. **Localization**: Multi-language error messages
5. **Error Recovery**: Automatic retry with exponential backoff
6. **Sentry Integration**: Automatic error reporting to Sentry
