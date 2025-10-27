import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import { UserPreferences } from "@/lib/types/account-settings";
import { handleClientApiError } from "@/lib/utils/client-error-handler";
import { debounce } from "@/lib/utils";

interface UsePreferencesOptions {
  debounceMs?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UsePreferencesReturn {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  isLoading: boolean;
  updatePreferences: () => Promise<void>;
  debouncedUpdate: () => void;
}

/**
 * Custom hook for managing user preferences
 * Includes automatic initialization from user metadata and debounced updates
 *
 * @param options - Configuration options including debounce delay
 * @returns Preferences state, setters, and update handlers
 */
export function usePreferences(options: UsePreferencesOptions = {}): UsePreferencesReturn {
  const { debounceMs = 500, onSuccess, onError } = options;
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    marketingEmails: false,
    darkMode: false,
  });

  // Initialize preferences from user's clientMetadata
  // Using JSON.stringify to avoid object reference issues
  const userPreferencesJson = JSON.stringify(user?.clientMetadata?.preferences);

  useEffect(() => {
    if (user?.clientMetadata?.preferences) {
      setPreferences({
        emailNotifications: user.clientMetadata.preferences.emailNotifications ?? true,
        marketingEmails: user.clientMetadata.preferences.marketingEmails ?? false,
        darkMode: user.clientMetadata.preferences.darkMode ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPreferencesJson]); // Depend on stringified version to avoid object reference changes

  const updatePreferences = useCallback(async () => {
    if (!user) {
      const errorMessage = "User not authenticated. Please log in again.";
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Update user preferences using Stack Auth clientMetadata
      await user.update({
        clientMetadata: {
          ...user.clientMetadata,
          preferences: preferences,
        },
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = handleClientApiError(
        error,
        "Failed to update preferences. Please try again."
      );
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, preferences, onSuccess, onError]);

  // Create debounced version of preferences update
  const debouncedUpdate = useMemo(
    () => debounce(updatePreferences, debounceMs),
    [updatePreferences, debounceMs]
  );

  return {
    preferences,
    setPreferences,
    isLoading,
    updatePreferences,
    debouncedUpdate,
  };
}