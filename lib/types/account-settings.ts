/**
 * Type definitions for Account Settings
 * Provides type safety for user preferences, profile data, and form states
 */

/**
 * User preferences stored in Stack Auth clientMetadata
 */
export interface UserPreferences {
  emailNotifications: boolean;
  marketingEmails: boolean;
  darkMode: boolean;
}

/**
 * Profile form data structure
 */
export interface ProfileData {
  displayName: string;
  email: string;
  profileImageUrl: string;
}

/**
 * Password change form data structure
 */
export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Alert/message state structure
 */
export interface AlertMessage {
  type: "success" | "error";
  text: string;
}

/**
 * Constants for image upload validation
 */
export const IMAGE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB in bytes
  MAX_FILE_SIZE_MB: 2,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  ACCEPTED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] as const,
} as const;

/**
 * Type guard for checking if a file type is accepted
 */
export function isAcceptedImageType(type: string): boolean {
  return IMAGE_UPLOAD_CONSTANTS.ACCEPTED_IMAGE_TYPES.includes(type as any);
}

/**
 * Extended Stack Auth user metadata with typed preferences
 */
export interface UserClientMetadata {
  preferences?: UserPreferences;
  [key: string]: any;
}