import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { PasswordData } from "@/lib/types/account-settings";
import { handleClientApiError } from "@/lib/utils/client-error-handler";

interface UsePasswordChangeOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UsePasswordChangeReturn {
  isLoading: boolean;
  isPasswordAuthEnabled: boolean;
  handlePasswordChange: (passwordData: PasswordData) => Promise<boolean>;
}

/**
 * Custom hook for handling password changes
 * Includes validation and Stack Auth API integration
 *
 * @param options - Configuration options for password change behavior
 * @returns Loading state and change handler function
 */
export function usePasswordChange(options: UsePasswordChangeOptions = {}): UsePasswordChangeReturn {
  const { onSuccess, onError } = options;
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Check if password authentication is enabled
  // If user has OAuth-only authentication (Google, GitHub, etc.), password auth is not available
  const isPasswordAuthEnabled = user?.hasPassword ?? false;

  const handlePasswordChange = async (passwordData: PasswordData): Promise<boolean> => {
    // Check if password authentication is enabled
    if (!isPasswordAuthEnabled) {
      const errorMessage = "Password authentication is not enabled. You signed in with a social provider (Google, GitHub, etc.).";
      if (onError) {
        onError(errorMessage);
      }
      return false;
    }
    if (!user) {
      const errorMessage = "User not authenticated. Please log in again.";
      if (onError) {
        onError(errorMessage);
      }
      return false;
    }

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMessage = "New passwords do not match.";
      if (onError) {
        onError(errorMessage);
      }
      return false;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      const errorMessage = "Password must be at least 8 characters long.";
      if (onError) {
        onError(errorMessage);
      }
      return false;
    }

    setIsLoading(true);

    try {
      // Update password using Stack Auth API
      await user.updatePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = handleClientApiError(
        error,
        "Failed to update password. Please check your current password and try again."
      );
      if (onError) {
        onError(errorMessage);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPasswordAuthEnabled,
    handlePasswordChange,
  };
}