import { useState } from "react";
import { IMAGE_UPLOAD_CONSTANTS, isAcceptedImageType, AlertMessage } from "@/lib/types/account-settings";

interface UseAvatarUploadOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  setMessage?: (message: AlertMessage | null) => void;
}

export interface UseAvatarUploadReturn {
  uploadingImage: boolean;
  imageError: boolean;
  setImageError: (error: boolean) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/**
 * Custom hook for handling avatar/profile image uploads
 *
 * TODO: Replace base64 upload with direct CDN upload
 * Current implementation stores ~2.7MB in state for a 2MB image (33% overhead)
 * Recommended: Use /api/upload endpoint with FormData to upload to CDN/S3
 *
 * @param options - Configuration options for upload behavior
 * @returns Upload state and handler function
 */
export function useAvatarUpload(options: UseAvatarUploadOptions = {}): UseAvatarUploadReturn {
  const { onSuccess, onError, setMessage } = options;
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isAcceptedImageType(file.type)) {
      const errorMessage = "Please select a valid image file (jpg, png, gif, webp).";
      if (onError) {
        onError(errorMessage);
      }
      if (setMessage) {
        setMessage({ type: "error", text: errorMessage });
      }
      return;
    }

    // Validate file size
    if (file.size > IMAGE_UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
      const errorMessage = `Image size must be less than ${IMAGE_UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB. Please choose a smaller file.`;
      if (onError) {
        onError(errorMessage);
      }
      if (setMessage) {
        setMessage({ type: "error", text: errorMessage });
      }
      return;
    }

    setUploadingImage(true);
    if (setMessage) {
      setMessage(null);
    }

    try {
      // Convert file to base64 (temporary solution)
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageError(false); // Reset image error state
        setUploadingImage(false);

        if (onSuccess) {
          onSuccess(base64String);
        }

        if (setMessage) {
          setMessage({
            type: "success",
            text: "Image uploaded successfully! Don't forget to save changes.",
          });
        }
      };

      reader.onerror = () => {
        setUploadingImage(false);
        const errorMessage = "Failed to read image file. Please try again.";

        if (onError) {
          onError(errorMessage);
        }

        if (setMessage) {
          setMessage({ type: "error", text: errorMessage });
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingImage(false);
      const errorMessage = "Failed to upload image. Please try again.";

      if (onError) {
        onError(errorMessage);
      }

      if (setMessage) {
        setMessage({ type: "error", text: errorMessage });
      }
    }
  };

  return {
    uploadingImage,
    imageError,
    setImageError,
    handleAvatarUpload,
  };
}