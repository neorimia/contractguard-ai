# ContractGuard AI - API Reference

Complete API documentation for ContractGuard AI endpoints.

**Base URL:** `https://your-domain.com` or `http://localhost:3000` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Contract Analysis](#contract-analysis)
3. [User Management](#user-management)
4. [Payment Processing](#payment-processing)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All authenticated endpoints require a Stack Auth session token in the Authorization header:

```
Authorization: Bearer <stack-session-token>
```

Get the token from Stack Auth client:

```typescript
import { useUser } from "@stackframe/stack";

const user = useUser();
const token = await user?.getAuthToken();
```

---

## Contract Analysis

### POST /api/audit

Analyze a smart contract for security vulnerabilities and scam indicators.

**Authentication:** Optional (affects rate limits)

**Request:**

```http
POST /api/audit HTTP/1.1
Content-Type: application/json

{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "chain": "ethereum"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Ethereum contract address (0x...) |
| `chain` | string | No | Blockchain network (default: "ethereum") |

**Supported Chains:**
- `ethereum` - Ethereum Mainnet
- `polygon` - Polygon
- `base` - Base

**Response (200 OK):**

```json
{
  "data": {
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "contractName": "MyToken",
    "chain": "ethereum",
    "riskScore": 45,
    "summary": "This contract exhibits moderate security risks. The contract has centralized owner control which could be exploited. However, liquidity appears adequate and holder distribution is reasonable.",
    "issues": [
      {
        "severity": "HIGH",
        "type": "Ownership Risk",
        "description": "Contract owner can pause trading at any time",
        "impact": "Owner could prevent users from selling their tokens",
        "code": "function pause() public onlyOwner { _pause(); }"
      },
      {
        "severity": "MEDIUM",
        "type": "Tax Function",
        "description": "Contract includes a transfer tax mechanism",
        "impact": "Users may pay unexpected fees on transfers",
        "code": "uint256 taxAmount = amount * taxRate / 100;"
      },
      {
        "severity": "LOW",
        "type": "Renounced Ownership",
        "description": "Ownership can be renounced",
        "impact": "Contract could become immutable",
        "code": "function renounceOwnership() public onlyOwner"
      }
    ],
    "recommendation": "CAUTION",
    "holderCount": 1234,
    "liquidity": "$456,789.00",
    "ownerBalance": "15.3%",
    "isVerified": true,
    "createdAt": "2025-01-08T12:00:00.000Z",
    "updatedAt": "2025-01-08T12:00:00.000Z",
    "views": 42,
    "shares": 5
  },
  "status": "success",
  "cached": true,
  "cacheSource": "redis"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `contractAddress` | string | Contract address |
| `contractName` | string | Token/contract name |
| `chain` | string | Blockchain network |
| `riskScore` | number | Risk score (0-100) |
| `summary` | string | Plain English analysis summary |
| `issues` | Issue[] | Array of detected issues |
| `recommendation` | string | BUY, CAUTION, or AVOID |
| `holderCount` | number | Number of token holders |
| `liquidity` | string | Total liquidity amount |
| `ownerBalance` | string | Owner's token percentage |
| `isVerified` | boolean | Contract verification status |
| `createdAt` | string | First analysis timestamp (ISO 8601) |
| `updatedAt` | string | Last update timestamp (ISO 8601) |
| `views` | number | View count |
| `shares` | number | Share count |
| `cached` | boolean | Whether result was cached |
| `cacheSource` | string | "redis", "database", or null |

**Issue Object:**

```typescript
{
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;           // Issue category
  description: string;    // Plain English description
  impact: string;         // Potential impact
  code?: string;          // Relevant code snippet (optional)
}
```

**Risk Score Interpretation:**
- **0-30:** Low risk (BUY)
- **31-60:** Medium risk (CAUTION)
- **61-100:** High risk (AVOID)

**Error Responses:**

**400 Bad Request** - Invalid input

```json
{
  "error": "Invalid contract address",
  "details": "Address must be a valid Ethereum address starting with 0x",
  "status": "error"
}
```

**429 Too Many Requests** - Rate limit exceeded

```json
{
  "error": "Rate limit exceeded",
  "details": "Free tier allows 3 scans per day. Upgrade to Pro for 100 scans.",
  "retryAfter": 86400,
  "status": "error"
}
```

**503 Service Unavailable** - External API failure

```json
{
  "error": "Contract data unavailable",
  "details": "Unable to fetch contract from Etherscan. Please try again.",
  "status": "error"
}
```

**500 Internal Server Error** - Server error

```json
{
  "error": "Analysis failed",
  "details": "An unexpected error occurred. Please contact support.",
  "status": "error"
}
```

**Example Usage:**

```typescript
async function analyzeContract(address: string) {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
      chain: 'ethereum'
    })
  });

  const result = await response.json();

  if (response.ok) {
    console.log('Risk Score:', result.data.riskScore);
    console.log('Recommendation:', result.data.recommendation);
  } else {
    console.error('Error:', result.error);
  }
}
```

---

## User Management

### GET /api/user/profile

Get authenticated user profile and usage statistics.

**Authentication:** Required

**Request:**

```http
GET /api/user/profile HTTP/1.1
Authorization: Bearer <stack-session-token>
```

**Response (200 OK):**

```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tier": "pro",
  "scansToday": 15,
  "scansRemaining": 85,
  "scansResetAt": "2025-01-09T00:00:00.000Z",
  "subscriptionStatus": "active",
  "stripeCustomerId": "cus_ABC123",
  "stripeSubscriptionId": "sub_XYZ789",
  "emailVerified": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "lastLoginAt": "2025-01-08T12:00:00.000Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | User ID |
| `email` | string | User email |
| `firstName` | string | First name (optional) |
| `lastName` | string | Last name (optional) |
| `tier` | string | "free", "pro", or "enterprise" |
| `scansToday` | number | Scans used today |
| `scansRemaining` | number | Remaining scans today |
| `scansResetAt` | string | Next reset timestamp (ISO 8601) |
| `subscriptionStatus` | string | "active", "cancelled", "past_due", null |
| `stripeCustomerId` | string | Stripe customer ID (optional) |
| `stripeSubscriptionId` | string | Stripe subscription ID (optional) |
| `emailVerified` | boolean | Email verification status |
| `createdAt` | string | Registration timestamp (ISO 8601) |
| `lastLoginAt` | string | Last login timestamp (ISO 8601) |

**Error Responses:**

**401 Unauthorized** - Not authenticated

```json
{
  "error": "Unauthorized",
  "status": "error"
}
```

### GET /api/user/verification-status

Check email verification status for authenticated user.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "verified": true,
  "email": "user@example.com"
}
```

### POST /api/auth/resend-verification

Resend email verification link.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "message": "Verification email sent",
  "email": "user@example.com"
}
```

**Error Responses:**

**400 Bad Request** - Email already verified

```json
{
  "error": "Email already verified",
  "status": "error"
}
```

**429 Too Many Requests** - Rate limited

```json
{
  "error": "Too many requests",
  "details": "Please wait before requesting another verification email",
  "status": "error"
}
```

---

## Payment Processing

### POST /api/stripe/checkout

Create Stripe checkout session for subscription upgrade.

**Authentication:** Required

**Request:**

```http
POST /api/stripe/checkout HTTP/1.1
Authorization: Bearer <stack-session-token>
Content-Type: application/json

{
  "priceId": "price_1QiaTXF1EbHBJPLvNp50V4R1",
  "tier": "pro"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `priceId` | string | Yes | Stripe price ID |
| `tier` | string | Yes | Target tier ("pro" or "enterprise") |

**Stripe Price IDs:**
- Pro: `price_1QiaTXF1EbHBJPLvNp50V4R1` ($29/month)
- Enterprise: `price_1QiaTXF1EbHBJPLvNp50V4R2` ($199/month)

**Response (200 OK):**

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Stripe checkout session ID |
| `url` | string | Checkout URL to redirect user to |

**Usage:**

```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    priceId: 'price_1QiaTXF1EbHBJPLvNp50V4R1',
    tier: 'pro'
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe checkout
```

**Error Responses:**

**401 Unauthorized** - Not authenticated

```json
{
  "error": "Unauthorized",
  "status": "error"
}
```

**400 Bad Request** - Invalid parameters

```json
{
  "error": "Invalid parameters",
  "details": "priceId and tier are required",
  "status": "error"
}
```

### POST /api/stripe/portal

Create Stripe customer portal session for subscription management.

**Authentication:** Required

**Request:**

```http
POST /api/stripe/portal HTTP/1.1
Authorization: Bearer <stack-session-token>
```

**Response (200 OK):**

```json
{
  "url": "https://billing.stripe.com/p/session/test_ABC123"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Portal URL to redirect user to |

**Portal Features:**
- Update payment method
- View invoices and receipts
- Cancel subscription
- Download billing history

**Error Responses:**

**401 Unauthorized** - Not authenticated

```json
{
  "error": "Unauthorized",
  "status": "error"
}
```

**400 Bad Request** - No Stripe customer

```json
{
  "error": "No active subscription",
  "details": "User has no Stripe customer account",
  "status": "error"
}
```

### POST /api/stripe/webhook

Stripe webhook endpoint for processing subscription events.

**⚠️ Internal Use Only** - Called by Stripe, not by clients.

**Security:** Validates webhook signature using `STRIPE_WEBHOOK_SECRET`

**Handled Events:**
- `checkout.session.completed` - Create subscription, upgrade tier
- `customer.subscription.created` - Initialize subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Downgrade to free tier
- `invoice.paid` - Confirm payment
- `invoice.payment_failed` - Handle failed payment

**Webhook Configuration:**

Configure in Stripe Dashboard → Webhooks:

```
URL: https://your-domain.com/api/stripe/webhook
Events to send:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - invoice.payment_failed
```

---

## Error Handling

### Standard Error Response

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "details": "Additional context or debugging information",
  "status": "error"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | External API failure |

### Common Errors

**Invalid Contract Address:**
```json
{
  "error": "Invalid contract address",
  "details": "Address must be a valid Ethereum address starting with 0x",
  "status": "error"
}
```

**Contract Not Verified:**
```json
{
  "error": "Contract not verified",
  "details": "This contract's source code is not verified on Etherscan. Analysis cannot be performed.",
  "status": "error"
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "details": "Free tier: 3 scans/day. Pro tier: 100 scans/day. Enterprise: unlimited.",
  "retryAfter": 86400,
  "status": "error"
}
```

---

## Rate Limiting

### Tier Limits

| Tier | Scans per Day | Reset Time |
|------|---------------|------------|
| Free | 3 | Midnight UTC |
| Pro | 100 | Midnight UTC |
| Enterprise | Unlimited | N/A |

### Rate Limit Headers

Responses include rate limit information in headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1704758400
```

### Handling Rate Limits

When rate limit is exceeded (HTTP 429):

```typescript
if (response.status === 429) {
  const { retryAfter } = await response.json();
  const resetDate = new Date(Date.now() + retryAfter * 1000);
  console.log(`Rate limit exceeded. Try again at ${resetDate.toLocaleString()}`);
}
```

### Rate Limit Strategy

**Implementation:**
- Redis-based tracking per user
- Resets daily at midnight UTC
- Graceful handling with informative errors
- Upgrade prompts for free tier users

---

## API Client Example

### TypeScript Client

```typescript
class ContractGuardClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error);
    }

    return response.json();
  }

  async analyzeContract(address: string, chain: string = 'ethereum') {
    return this.request<AnalysisResponse>('/api/audit', {
      method: 'POST',
      body: JSON.stringify({ address, chain }),
    });
  }

  async getUserProfile() {
    return this.request<UserProfile>('/api/user/profile');
  }

  async createCheckoutSession(priceId: string, tier: string) {
    return this.request<CheckoutSession>('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId, tier }),
    });
  }

  async createPortalSession() {
    return this.request<PortalSession>('/api/stripe/portal', {
      method: 'POST',
    });
  }
}

// Usage
const client = new ContractGuardClient(
  'https://your-domain.com',
  userToken
);

const analysis = await client.analyzeContract('0x...');
console.log('Risk Score:', analysis.data.riskScore);
```

---

## Webhooks (Future)

### Contract Monitoring Webhook (Planned)

For Enterprise tier users, receive real-time alerts when monitored contracts change.

**Coming Soon:**
- Contract ownership changes
- Code updates
- Liquidity changes
- Large transactions
- Price movements

---

## Support

For API support or questions:

- **Documentation:** See `/docs` directory
- **GitHub Issues:** [github.com/neorimia/contractguard-ai/issues](https://github.com/neorimia/contractguard-ai/issues)
- **Email:** support@contractguard.ai

---

**Last Updated:** January 2025
**API Version:** 1.0.0