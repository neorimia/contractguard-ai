/**
 * User Types and Validation Schemas
 *
 * Centralized type definitions and runtime validation for user-related data
 */

import { z } from "zod";

// User tier type
export const UserTierSchema = z.enum([
  "free",
  "starter",
  "pro",
  "team",
  "enterprise",
]);

export type UserTier = z.infer<typeof UserTierSchema>;

// API Response Schemas
export const UserProfileResponseSchema = z.object({
  tier: UserTierSchema.optional(),
  status: z.string().optional(),
  error: z.string().optional(),
});

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

// User tier fetch result
export interface UserTierResult {
  tier: UserTier;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Error types for better error handling
export class UserTierError extends Error {
  constructor(
    message: string,
    public readonly type: "network" | "auth" | "validation" | "server" | "unknown"
  ) {
    super(message);
    this.name = "UserTierError";
  }
}

/**
 * Validates and parses API response with runtime type checking
 */
export function validateUserProfileResponse(data: unknown): UserProfileResponse {
  try {
    return UserProfileResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new UserTierError(
        "Invalid API response format",
        "validation"
      );
    }
    throw error;
  }
}

/**
 * Creates user-friendly error messages based on error type
 */
export function formatUserTierError(error: unknown): string {
  if (error instanceof UserTierError) {
    switch (error.type) {
      case "network":
        return "Network error. Please check your connection and try again.";
      case "auth":
        return "Authentication error. Please log in again.";
      case "validation":
        return "Invalid response from server. Please try again or contact support.";
      case "server":
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (error.message.includes("401") || error.message.includes("403")) {
      return "Authentication error. Please log in again.";
    }
  }

  return "Failed to load subscription status. Please try again.";
}
