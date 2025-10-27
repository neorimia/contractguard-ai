import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { ProfileData, UserPreferences, AlertMessage } from "@/lib/types/account-settings";
import { handleClientApiError } from "@/lib/utils/client-error-handler";

interface UseProfileUpdateOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UseProfileUpdateReturn {
  isLoading: boolean;
  handleProfileUpdate: (profileData: ProfileData, preferences: UserPreferences) => Promise<void>;
}

/**
 * Custom hook for handling profile updates
 * Includes email validation and Stack Auth API integration
 *
 * @param options - Configuration options for update behavior
 * @returns Loading state and update handler function
 */
export function useProfileUpdate(options: UseProfileUpdateOptions = {}): UseProfileUpdateReturn {
  const { onSuccess, onError } = options;
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async (
    profileData: ProfileData,
    preferences: UserPreferences
  ): Promise<void> => {
    if (!user) {
      const errorMessage = "User not authenticated. Please log in again.";
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Validate email format with robust validation
      if (profileData.email) {
        const { isValidEmail } = await import("@/lib/validation/email");
        if (!isValidEmail(profileData.email)) {
          const errorMessage = "Please enter a valid email address.";
          if (onError) {
            onError(errorMessage);
          }
          setIsLoading(false);
          return;
        }
      }

      // Validate profile image URL if provided (skip validation for base64 images)
      if (profileData.profileImageUrl && !profileData.profileImageUrl.startsWith("data:image/")) {
        try {
          new URL(profileData.profileImageUrl);
          // Check if it's an image URL (basic validation)
          if (
            !profileData.profileImageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) &&
            !profileData.profileImageUrl.includes("gravatar") &&
            !profileData.profileImageUrl.includes("googleusercontent")
          ) {
            const errorMessage = "Please enter a valid image URL (jpg, png, gif, webp, or svg).";
            if (onError) {
              onError(errorMessage);
            }
            setIsLoading(false);
            return;
          }
        } catch {
          const errorMessage = "Please enter a valid image URL.";
          if (onError) {
            onError(errorMessage);
          }
          setIsLoading(false);
          return;
        }
      }

      // Update user profile using Stack Auth API
      await user.update({
        displayName: profileData.displayName,
        profileImageUrl: profileData.profileImageUrl || null,
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
        "Failed to update profile. Please try again."
      );
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleProfileUpdate,
  };
}