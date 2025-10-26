/**
 * useUserTier Hook
 *
 * Custom hook for managing user subscription tier state and fetching.
 * Implements best practices:
 * - Runtime validation with Zod
 * - Proper error handling with typed errors
 * - Automatic refetching capability
 * - Loading and error states
 */

import { useEffect, useState, useCallback } from "react";
import {
  UserTier,
  UserTierResult,
  UserTierError,
  validateUserProfileResponse,
  formatUserTierError,
} from "@/lib/types/user";

interface UseUserTierOptions {
  userId?: string;
  enabled?: boolean;
  onSuccess?: (tier: UserTier) => void;
  onError?: (error: string) => void;
}

export function useUserTier(options: UseUserTierOptions = {}): UserTierResult {
  const { userId, enabled = true, onSuccess, onError } = options;

  const [tier, setTier] = useState<UserTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTier = useCallback(async () => {
    // Skip if not enabled or no user ID
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/user/profile");

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new UserTierError(
            "Authentication failed",
            "auth"
          );
        }
        if (response.status >= 500) {
          throw new UserTierError(
            "Server error",
            "server"
          );
        }
        throw new UserTierError(
          `HTTP error! status: ${response.status}`,
          "server"
        );
      }

      // Parse and validate response
      const rawData = await response.json();
      const data = validateUserProfileResponse(rawData);

      // Handle API-level errors
      if (data.status === "error") {
        throw new UserTierError(
          data.error || "API returned error",
          "server"
        );
      }

      // Extract and set tier
      if (data.tier) {
        setTier(data.tier);
        setError(null);
        onSuccess?.(data.tier);
      } else {
        // Default to free if no tier returned
        setTier("free");
        setError("No subscription tier found");
        onError?.("No subscription tier found");
      }
    } catch (err) {
      console.error("Failed to fetch user tier:", err);

      // Format error message
      const errorMessage = formatUserTierError(err);
      setError(errorMessage);
      setTier("free"); // Fallback to free tier
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled, onSuccess, onError]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    void fetchUserTier();
  }, [fetchUserTier]);

  return {
    tier,
    isLoading,
    error,
    refetch: fetchUserTier,
  };
}
