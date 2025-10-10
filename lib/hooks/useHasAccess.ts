/**
 * useHasAccess Hook
 *
 * Client-side hook for checking user access to scans
 * Implements priority logic: Pro/Team → Instant Credits → Free Tier
 *
 * Usage:
 * ```tsx
 * const { hasAccess, accessType, scansRemaining, instantCredits, isLoading } = useHasAccess();
 *
 * if (!hasAccess) {
 *   return <PaywallModal />;
 * }
 * ```
 */

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";

export type AccessType = "pro" | "team" | "instant_credit" | "free" | "none";

export interface AccessStatus {
  hasAccess: boolean;
  accessType: AccessType;
  scansRemaining: number;
  instantCredits: number;
  isAuthenticated: boolean;
  reason?: string;
  isLoading: boolean;
  error?: string;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if user has access to perform scans
 * Automatically refreshes on auth state changes
 */
export function useHasAccess(): AccessStatus {
  const { user, isLoading: authLoading } = useUser();
  const [accessStatus, setAccessStatus] = useState<Omit<AccessStatus, "refetch" | "isLoading">>({
    hasAccess: true,
    accessType: "free",
    scansRemaining: 3,
    instantCredits: 0,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchAccessStatus = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Check for guest session ID in localStorage
      const guestSessionId = localStorage.getItem("guestSessionId");

      // Build query params
      const params = new URLSearchParams();
      if (!user && guestSessionId) {
        params.append("guestSessionId", guestSessionId);
      }

      const url = `/api/user/access-status${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch access status");
      }

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.error || "Unknown error");
      }

      setAccessStatus({
        hasAccess: data.hasAccess,
        accessType: data.accessType,
        scansRemaining: data.scansRemaining,
        instantCredits: data.instantCredits,
        isAuthenticated: data.isAuthenticated,
        reason: data.reason,
      });
    } catch (err: any) {
      console.error("Access status fetch error:", err);
      setError(err.message || "Failed to check access");
      // Fallback to default free tier on error
      setAccessStatus({
        hasAccess: true,
        accessType: "free",
        scansRemaining: 3,
        instantCredits: 0,
        isAuthenticated: false,
        reason: "Error checking access, using default free tier",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch access status on mount and when auth state changes
  useEffect(() => {
    if (!authLoading) {
      fetchAccessStatus();
    }
  }, [user, authLoading]);

  return {
    ...accessStatus,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchAccessStatus,
  };
}

/**
 * Helper hook for displaying access status UI
 * Returns formatted strings for display
 */
export function useAccessStatusDisplay() {
  const accessStatus = useHasAccess();

  const getAccessLabel = (): string => {
    switch (accessStatus.accessType) {
      case "pro":
        return "Pro (Unlimited)";
      case "team":
        return "Team (Unlimited)";
      case "instant_credit":
        return `${accessStatus.scansRemaining} Credit${accessStatus.scansRemaining !== 1 ? "s" : ""}`;
      case "free":
        return `${accessStatus.scansRemaining}/3 Free Scans`;
      default:
        return "No Access";
    }
  };

  const getAccessDescription = (): string => {
    switch (accessStatus.accessType) {
      case "pro":
      case "team":
        return "You have unlimited scans with your subscription";
      case "instant_credit":
        return `You have ${accessStatus.scansRemaining} instant report${accessStatus.scansRemaining !== 1 ? "s" : ""} remaining`;
      case "free":
        return `You have ${accessStatus.scansRemaining} free scan${accessStatus.scansRemaining !== 1 ? "s" : ""} remaining today`;
      default:
        return accessStatus.reason || "Purchase instant reports or upgrade to Pro to continue";
    }
  };

  const shouldShowUpgrade = (): boolean => {
    return (
      accessStatus.accessType === "free" ||
      accessStatus.accessType === "instant_credit" ||
      accessStatus.accessType === "none"
    );
  };

  const getUpgradeMessage = (): string => {
    if (accessStatus.accessType === "none") {
      return "Out of scans. Purchase instant reports or upgrade to Pro.";
    }
    if (accessStatus.accessType === "free" && accessStatus.scansRemaining === 1) {
      return "Last free scan! Upgrade to Pro for unlimited scans.";
    }
    if (accessStatus.accessType === "instant_credit" && accessStatus.scansRemaining === 1) {
      return "Last credit! Buy more or upgrade to Pro.";
    }
    return "";
  };

  return {
    ...accessStatus,
    accessLabel: getAccessLabel(),
    accessDescription: getAccessDescription(),
    shouldShowUpgrade: shouldShowUpgrade(),
    upgradeMessage: getUpgradeMessage(),
  };
}