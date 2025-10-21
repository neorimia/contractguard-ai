// lib/types/errors.ts

export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorAction =
  | 'retry'
  | 'upgrade_required'
  | 'signup_required'
  | 'wait'
  | 'contact_support'
  | 'check_input';

export interface ClientErrorResponse {
  status: 'error';
  severity: ErrorSeverity;
  error: string; // Technical error name
  message: string; // User-friendly message
  action: ErrorAction; // Recommended user action
  details?: {
    reason?: string;
    retryAfter?: string; // ISO timestamp
    upgradeUrl?: string;
    documentationUrl?: string;
    supportEmail?: string;
    service?: string; // Which service failed
    statusCode?: number;
    originalError?: string;
    providerError?: string;
  };
  metadata?: {
    requestId?: string;
    timestamp?: string;
    accessType?: string;
    scansRemaining?: number;
    instantCredits?: number;
  };
}

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  cached?: boolean;
  metadata?: {
    accessType: string;
    scansRemaining: number;
    instantCredits?: number;
  };
}

export type APIResponse<T> = ClientErrorResponse | SuccessResponse<T>;
