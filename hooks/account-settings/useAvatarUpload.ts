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
 * Uses /api/upload endpoint for CDN-based uploads
 * Replaces the old base64 conversion method with proper API calls
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
      // Upload to API endpoint using FormData
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      setImageError(false); // Reset image error state
      setUploadingImage(false);
 
      if (onSuccess) {
        onSuccess(data.url);
      }

      if (setMessage) {
        setMessage({
          type: "success",
          text: "Image uploaded successfully! Don't forget to save changes.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingImage(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again.";

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