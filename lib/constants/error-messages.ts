// lib/constants/error-messages.ts

import { ErrorSeverity, ErrorAction } from '@/lib/types/errors';

interface ErrorTemplate {
  error: string;
  message: string;
  action: ErrorAction;
  severity: ErrorSeverity;
  details?: {
    reason?: string;
    upgradeUrl?: string;
    documentationUrl?: string;
    supportEmail?: string;
    service?: string;
    retryAfter?: string;
  };
}

export const ERROR_MESSAGES = {
  // ============================================================================
  // CLIENT INPUT ERRORS (400)
  // ============================================================================
  INVALID_ADDRESS: {
    error: 'Invalid contract address',
    message: 'Please enter a valid blockchain address (0x followed by 40 characters)',
    action: 'check_input' as const,
    severity: 'error' as const,
  } as ErrorTemplate,

  CONTRACT_NOT_VERIFIED: {
    error: 'Contract not verified',
    message:
      "This contract's source code is not verified on the blockchain explorer. We can only analyze verified contracts for your security.",
    action: 'check_input' as const,
    severity: 'error' as const,
    details: {
      reason:
        'Unverified contracts cannot be analyzed because their source code is not publicly available',
      documentationUrl: '/docs/verified-contracts',
    },
  } as ErrorTemplate,

  MISSING_PARAMETERS: {
    error: 'Missing required parameters',
    message: 'Please provide all required information to proceed',
    action: 'check_input' as const,
    severity: 'error' as const,
  } as ErrorTemplate,

  // ============================================================================
  // ACCESS & RATE LIMITING (403, 429)
  // ============================================================================
  SOFT_ACCOUNT_UPGRADE: {
    error: 'Account upgrade required',
    message: 'Complete your account setup to continue scanning contracts',
    action: 'upgrade_required' as const,
    severity: 'warning' as const,
    details: {
      reason: "You've reached the free tier limit for soft accounts",
      upgradeUrl: '/handler/sign-up',
    },
  } as ErrorTemplate,

  ANONYMOUS_LIMIT_REACHED: {
    error: 'Anonymous scan limit reached',
    message: 'Create a free account to continue scanning (3 free scans per day)',
    action: 'signup_required' as const,
    severity: 'warning' as const,
    details: {
      upgradeUrl: '/handler/sign-up',
    },
  } as ErrorTemplate,

  FREE_TIER_LIMIT: {
    error: 'Daily scan limit reached',
    message: "You've used all 3 free scans today. Upgrade to Pro for unlimited scans!",
    action: 'upgrade_required' as const,
    severity: 'warning' as const,
    details: {
      upgradeUrl: '/pricing',
    },
  } as ErrorTemplate,

  INSTANT_CREDITS_DEPLETED: {
    error: 'No instant credits remaining',
    message: 'Buy more instant reports or upgrade to Pro for unlimited scans.',
    action: 'upgrade_required' as const,
    severity: 'warning' as const,
    details: {
      upgradeUrl: '/pricing',
    },
  } as ErrorTemplate,

  ACCESS_LIMIT_EXCEEDED: {
    error: 'Access limit exceeded',
    message: 'No scans available. Upgrade to Pro for unlimited scans!',
    action: 'upgrade_required' as const,
    severity: 'warning' as const,
    details: {
      upgradeUrl: '/pricing',
    },
  } as ErrorTemplate,

  // ============================================================================
  // EXTERNAL SERVICE FAILURES (503)
  // ============================================================================
  ETHERSCAN_UNAVAILABLE: {
    error: 'Blockchain API unavailable',
    message:
      'The blockchain explorer is temporarily unavailable. Please try again in a few moments.',
    action: 'retry' as const,
    severity: 'error' as const,
    details: {
      service: 'Etherscan',
      reason: 'External service timeout or rate limit',
    },
  } as ErrorTemplate,

  ETHERSCAN_RATE_LIMIT: {
    error: 'Blockchain API rate limited',
    message:
      'Too many requests to the blockchain explorer. Please wait 30 seconds and try again.',
    action: 'wait' as const,
    severity: 'warning' as const,
    details: {
      service: 'Etherscan',
      retryAfter: new Date(Date.now() + 30000).toISOString(),
    },
  } as ErrorTemplate,

  ETHERSCAN_NOT_FOUND: {
    error: 'Contract not found',
    message:
      'This contract address was not found on the blockchain. Please verify the address is correct.',
    action: 'check_input' as const,
    severity: 'error' as const,
    details: {
      service: 'Etherscan',
      reason: 'Contract address does not exist on the specified blockchain',
    },
  } as ErrorTemplate,

  AI_SERVICE_TIMEOUT: {
    error: 'Analysis service timeout',
    message:
      "The AI analysis is taking longer than expected. We'll use pattern-based detection instead.",
    action: 'retry' as const,
    severity: 'warning' as const,
    details: {
      service: 'AI Analysis',
      reason: 'Request exceeded 30-second timeout',
    },
  } as ErrorTemplate,

  AI_SERVICE_UNAVAILABLE: {
    error: 'Analysis service unavailable',
    message:
      "AI analysis is temporarily unavailable. We'll provide a basic security scan using pattern detection.",
    action: 'retry' as const,
    severity: 'warning' as const,
    details: {
      service: 'OpenAI/Claude',
      reason: 'All AI providers failed',
    },
  } as ErrorTemplate,

  ENRICHMENT_DATA_PARTIAL: {
    error: 'Partial data available',
    message:
      'Some enrichment data (holder count, liquidity) is unavailable. Analysis will proceed with available data.',
    action: 'retry' as const,
    severity: 'info' as const,
    details: {
      service: 'Alchemy/DexScreener',
      reason: 'Non-critical data fetch failed',
    },
  } as ErrorTemplate,

  // ============================================================================
  // INTERNAL SERVER ERRORS (500)
  // ============================================================================
  DATABASE_ERROR: {
    error: 'Database error',
    message:
      'We encountered a database error. Our team has been notified. Please try again shortly.',
    action: 'contact_support' as const,
    severity: 'error' as const,
    details: {
      supportEmail: 'support@contractguard.ai',
    },
  } as ErrorTemplate,

  UNEXPECTED_ERROR: {
    error: 'Unexpected error',
    message:
      'An unexpected error occurred. Our team has been notified. Please try again or contact support if the issue persists.',
    action: 'contact_support' as const,
    severity: 'error' as const,
    details: {
      supportEmail: 'support@contractguard.ai',
    },
  } as ErrorTemplate,

  ANALYSIS_FAILED: {
    error: 'Analysis failed',
    message:
      'Unable to complete security analysis. Please try again or use a different contract address.',
    action: 'retry' as const,
    severity: 'error' as const,
  } as ErrorTemplate,

  USER_SYNC_FAILED: {
    error: 'Failed to sync user account',
    message: 'We encountered an error setting up your account. Please try signing in again.',
    action: 'contact_support' as const,
    severity: 'error' as const,
    details: {
      supportEmail: 'support@contractguard.ai',
    },
  } as ErrorTemplate,

  INVALID_USER_ACCOUNT: {
    error: 'Invalid user account',
    message: 'Your account is missing required information. Please contact support.',
    action: 'contact_support' as const,
    severity: 'error' as const,
    details: {
      supportEmail: 'support@contractguard.ai',
    },
  } as ErrorTemplate,

  // ============================================================================
  // CONFIGURATION ERRORS (500)
  // ============================================================================
  API_KEY_MISSING: {
    error: 'Service configuration error',
    message: 'A required service is not configured. Please contact support.',
    action: 'contact_support' as const,
    severity: 'error' as const,
    details: {
      supportEmail: 'support@contractguard.ai',
      reason: 'Required API key is missing',
    },
  } as ErrorTemplate,
} as const;
