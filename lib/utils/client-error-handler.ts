/**
 * Client-side API error handler
 * Maps API errors to user-friendly messages for UI display
 */

/**
 * Handles API errors with specific error message mapping
 * @param error - The error object from the API
 * @param defaultMessage - Default message to show if no specific match is found
 * @returns User-friendly error message
 */
export function handleClientApiError(error: any, defaultMessage: string): string {
  console.error("API Error:", error);

  // Handle specific Stack Auth error types
  if (error?.message?.includes("email")) {
    return "Invalid email address. Please check your email format.";
  }
  if (error?.message?.includes("password")) {
    return "Password requirements not met. Please ensure your password is at least 8 characters long.";
  }
  if (error?.message?.includes("unauthorized")) {
    return "Authentication failed. Please log in again.";
  }
  if (error?.message?.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return defaultMessage;
}
