/**
 * Account Settings Custom Hooks
 *
 * Extracted business logic from AccountSettings component for:
 * - Better testability (hooks can be unit tested in isolation)
 * - Better reusability (hooks can be used in other components)
 * - Better maintainability (single responsibility principle)
 * - Reduced component complexity (from 815 lines to modular hooks)
 */

export { useAvatarUpload } from "./useAvatarUpload";
export type { UseAvatarUploadReturn } from "./useAvatarUpload";

export { useProfileUpdate } from "./useProfileUpdate";
export type { UseProfileUpdateReturn } from "./useProfileUpdate";

export { usePasswordChange } from "./usePasswordChange";
export type { UsePasswordChangeReturn } from "./usePasswordChange";

export { usePreferences } from "./usePreferences";
export type { UsePreferencesReturn } from "./usePreferences";