/**
 * Scan State Management Hook
 *
 * Consolidates 17 useState variables into a single useReducer for:
 * - Reduced re-renders (batched updates)
 * - Better state organization (grouped by concern)
 * - Easier testing and debugging
 * - Type-safe actions
 */

import { useReducer } from "react";
import type { CryptoAudit } from "@/db/schema";
import type { ReportResponse } from "@/lib/types/report-types";

// ============================================================================
// Types
// ============================================================================

export interface CryptoAnalysisResult extends CryptoAudit {
  recommendation?: string;
  heuristicResults?: any[];
  scanMetadata?: ScanMetadata;
}

export interface ScanLimitError {
  error: string;
  message: string;
  scansRemaining: number;
  resetAt: string;
  upgradeUrl: string;
  status: string;
}

export interface ScanMetadata {
  accessType?: string;
  scansRemaining?: number;
  prompt?: string;
  sessionId?: string;
}

export interface UserAccessStatus {
  accessType: string;
  scansRemaining: number;
  instantCredits: number;
  accountType?: string;
}

export interface UpgradeData {
  email: string;
  scansRemaining: number;
}

/**
 * State Structure - Grouped by Concern
 */
export interface ScanState {
  // Form inputs
  form: {
    address: string;
    chain: string;
    selectedAI: "chatgpt" | "claude";
  };

  // UI visibility and status
  ui: {
    loading: boolean;
    error: string;
    showLimitDrawer: boolean;
    showSoftSignupPrompt: boolean;
    showUpgradeModal: boolean;
    showReportUpgradeModal: boolean;
  };

  // Scan results and API data
  data: {
    result: CryptoAnalysisResult | null;
    reportAccess: ReportResponse | null;
    limitError: ScanLimitError | null;
    upgradeData: UpgradeData | null;
  };

  // User access and limits
  access: {
    userAccessStatus: UserAccessStatus | null;
    anonymousScansPerformed: number;
    anonymousSessionId: string | null;
    scanMetadata: ScanMetadata | null;
  };
}

// ============================================================================
// Actions - Type-Safe State Transitions
// ============================================================================

export type ScanAction =
  // Form actions
  | { type: "SET_ADDRESS"; payload: string }
  | { type: "SET_CHAIN"; payload: string }
  | { type: "SET_AI_PROVIDER"; payload: "chatgpt" | "claude" }
  // UI actions
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SHOW_LIMIT_DRAWER"; payload: boolean }
  | { type: "SET_SHOW_SOFT_SIGNUP_PROMPT"; payload: boolean }
  | { type: "SET_SHOW_UPGRADE_MODAL"; payload: boolean }
  | { type: "SET_SHOW_REPORT_UPGRADE_MODAL"; payload: boolean }
  // Data actions
  | { type: "SET_RESULT"; payload: CryptoAnalysisResult | null }
  | { type: "SET_REPORT_ACCESS"; payload: ReportResponse | null }
  | { type: "SET_LIMIT_ERROR"; payload: ScanLimitError | null }
  | { type: "SET_UPGRADE_DATA"; payload: UpgradeData | null }
  // Access actions
  | { type: "SET_USER_ACCESS_STATUS"; payload: UserAccessStatus | null }
  | { type: "UPDATE_USER_ACCESS_STATUS"; payload: Partial<UserAccessStatus> }
  | { type: "SET_ANONYMOUS_SCANS_PERFORMED"; payload: number }
  | { type: "SET_ANONYMOUS_SESSION_ID"; payload: string | null }
  | { type: "SET_SCAN_METADATA"; payload: ScanMetadata | null }
  // Compound actions (multiple state updates at once)
  | {
      type: "START_SCAN";
    }
  | {
      type: "SCAN_SUCCESS";
      payload: {
        result: CryptoAnalysisResult;
        reportAccess?: ReportResponse;
        scanMetadata?: ScanMetadata;
      };
    }
  | {
      type: "SCAN_ERROR";
      payload: {
        error: string;
        limitError?: ScanLimitError;
        showLimitDrawer?: boolean;
      };
    }
  | {
      type: "ANONYMOUS_LIMIT_REACHED";
      payload: {
        scansPerformed: number;
        sessionId?: string;
        scanMetadata: ScanMetadata;
      };
    }
  | {
      type: "SOFT_ACCOUNT_UPGRADE_REQUIRED";
      payload: {
        email: string;
        scansRemaining: number;
      };
    }
  | { type: "RESET_SCAN" };

// ============================================================================
// Initial State
// ============================================================================

export const initialState: ScanState = {
  form: {
    address: "",
    chain: "ethereum",
    selectedAI: "chatgpt",
  },
  ui: {
    loading: false,
    error: "",
    showLimitDrawer: false,
    showSoftSignupPrompt: false,
    showUpgradeModal: false,
    showReportUpgradeModal: false,
  },
  data: {
    result: null,
    reportAccess: null,
    limitError: null,
    upgradeData: null,
  },
  access: {
    userAccessStatus: null,
    anonymousScansPerformed: 0,
    anonymousSessionId: null,
    scanMetadata: null,
  },
};

// ============================================================================
// Reducer - Pure State Transition Logic
// ============================================================================

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    // Form actions
    case "SET_ADDRESS":
      return {
        ...state,
        form: { ...state.form, address: action.payload },
      };

    case "SET_CHAIN":
      return {
        ...state,
        form: { ...state.form, chain: action.payload },
      };

    case "SET_AI_PROVIDER":
      return {
        ...state,
        form: { ...state.form, selectedAI: action.payload },
      };

    // UI actions
    case "SET_LOADING":
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload },
      };

    case "SET_ERROR":
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      };

    case "SET_SHOW_LIMIT_DRAWER":
      return {
        ...state,
        ui: { ...state.ui, showLimitDrawer: action.payload },
      };

    case "SET_SHOW_SOFT_SIGNUP_PROMPT":
      return {
        ...state,
        ui: { ...state.ui, showSoftSignupPrompt: action.payload },
      };

    case "SET_SHOW_UPGRADE_MODAL":
      return {
        ...state,
        ui: { ...state.ui, showUpgradeModal: action.payload },
      };

    case "SET_SHOW_REPORT_UPGRADE_MODAL":
      return {
        ...state,
        ui: { ...state.ui, showReportUpgradeModal: action.payload },
      };

    // Data actions
    case "SET_RESULT":
      return {
        ...state,
        data: { ...state.data, result: action.payload },
      };

    case "SET_REPORT_ACCESS":
      return {
        ...state,
        data: { ...state.data, reportAccess: action.payload },
      };

    case "SET_LIMIT_ERROR":
      return {
        ...state,
        data: { ...state.data, limitError: action.payload },
      };

    case "SET_UPGRADE_DATA":
      return {
        ...state,
        data: { ...state.data, upgradeData: action.payload },
      };

    // Access actions
    case "SET_USER_ACCESS_STATUS":
      return {
        ...state,
        access: { ...state.access, userAccessStatus: action.payload },
      };

    case "UPDATE_USER_ACCESS_STATUS":
      return {
        ...state,
        access: {
          ...state.access,
          userAccessStatus: state.access.userAccessStatus
            ? { ...state.access.userAccessStatus, ...action.payload }
            : null,
        },
      };

    case "SET_ANONYMOUS_SCANS_PERFORMED":
      return {
        ...state,
        access: { ...state.access, anonymousScansPerformed: action.payload },
      };

    case "SET_ANONYMOUS_SESSION_ID":
      return {
        ...state,
        access: { ...state.access, anonymousSessionId: action.payload },
      };

    case "SET_SCAN_METADATA":
      return {
        ...state,
        access: { ...state.access, scanMetadata: action.payload },
      };

    // Compound actions - Multiple state updates in one dispatch
    case "START_SCAN":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
          error: "",
          showLimitDrawer: false,
        },
        data: {
          ...state.data,
          result: null,
          limitError: null,
        },
      };

    case "SCAN_SUCCESS":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
          error: "",
        },
        data: {
          ...state.data,
          result: action.payload.result,
          reportAccess: action.payload.reportAccess || state.data.reportAccess,
        },
        access: {
          ...state.access,
          scanMetadata: action.payload.scanMetadata || state.access.scanMetadata,
        },
      };

    case "SCAN_ERROR":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
          error: action.payload.error,
          showLimitDrawer: action.payload.showLimitDrawer || false,
        },
        data: {
          ...state.data,
          limitError: action.payload.limitError || null,
        },
      };

    case "ANONYMOUS_LIMIT_REACHED":
      return {
        ...state,
        ui: {
          ...state.ui,
          showSoftSignupPrompt: true,
          error:
            "You've used your free scans. Sign up to continue with 3 free scans daily!",
        },
        access: {
          ...state.access,
          anonymousScansPerformed: action.payload.scansPerformed,
          anonymousSessionId:
            action.payload.sessionId || state.access.anonymousSessionId,
          scanMetadata: action.payload.scanMetadata,
        },
      };

    case "SOFT_ACCOUNT_UPGRADE_REQUIRED":
      return {
        ...state,
        ui: {
          ...state.ui,
          showUpgradeModal: true,
        },
        data: {
          ...state.data,
          upgradeData: {
            email: action.payload.email,
            scansRemaining: action.payload.scansRemaining,
          },
        },
      };

    case "RESET_SCAN":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
          error: "",
        },
        data: {
          ...state.data,
          result: null,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// Custom Hook - Encapsulated State Management
// ============================================================================

/**
 * Custom hook for scan state management
 *
 * Benefits over 17 useState variables:
 * - Batched updates (1 re-render instead of multiple)
 * - Grouped state by concern (easier to understand)
 * - Type-safe actions (no typos, autocomplete support)
 * - Easier testing (pure reducer function)
 * - Better debugging (Redux DevTools compatible)
 */
export function useScanState() {
  const [state, dispatch] = useReducer(scanReducer, initialState);

  return { state, dispatch };
}