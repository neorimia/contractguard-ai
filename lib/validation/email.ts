/**
 * Email Validation Utilities
 *
 * Robust email validation following RFC 5322 standards
 */

import { z } from "zod";

/**
 * Comprehensive email validation regex
 * Based on RFC 5322 standard with practical limitations
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Zod schema for email validation
 */
export const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(254, "Email address is too long") // RFC 5321 maximum length
  .refine(
    (email) => EMAIL_REGEX.test(email),
    "Please enter a valid email address"
  );

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  try {
    EmailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates email and returns detailed error message
 * @param email - Email address to validate
 * @returns Object with valid flag and optional error message
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  try {
    EmailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues[0]?.message || "Invalid email address",
      };
    }
    return { valid: false, error: "Invalid email address" };
  }
}

/**
 * Common disposable email domains to block
 * Extend this list based on your requirements
 */
const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "fakeinbox.com",
];

/**
 * Checks if email is from a disposable domain
 * @param email - Email address to check
 * @returns true if disposable, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.includes(domain) : false;
}

/**
 * Enhanced email validation with disposable email check
 * @param email - Email address to validate
 * @param allowDisposable - Whether to allow disposable emails (default: true)
 * @returns Object with valid flag and optional error message
 */
export function validateEmailEnhanced(
  email: string,
  allowDisposable: boolean = true
): {
  valid: boolean;
  error?: string;
} {
  // First check basic format
  const basicValidation = validateEmail(email);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Check for disposable emails if not allowed
  if (!allowDisposable && isDisposableEmail(email)) {
    return {
      valid: false,
      error: "Disposable email addresses are not allowed",
    };
  }

  return { valid: true };
}
