// lib/utils/referral-code.ts

import crypto from "crypto";
import { referralConfig } from "@/lib/referrals/config";

// Remove ambiguous characters: 0, O, I, L, 1
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generate a custom alphanumeric ID without ambiguous characters
 * Alternative to nanoid using crypto.randomBytes
 */
function generateCustomId(length: number): string {
  const bytes = crypto.randomBytes(length * 2); // Generate extra bytes for better randomness
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % ALPHABET.length;
    result += ALPHABET[randomIndex];
  }

  return result;
}

/**
 * Generate a unique referral code
 * Format: CG-XXXXXX (e.g., CG-2A3B4C)
 */
export function generateReferralCode(): string {
  const code = generateCustomId(referralConfig.codeLength);
  return `${referralConfig.codePrefix}-${code}`;
}

/**
 * Validate referral code format
 */
export function validateReferralCodeFormat(code: string): boolean {
  const pattern = new RegExp(
    `^${referralConfig.codePrefix}-[${ALPHABET}]{${referralConfig.codeLength}}$`
  );
  return pattern.test(code);
}

/**
 * Extract code from URL or format
 * Handles: "CG-ABC123", "/ref/CG-ABC123", "https://example.com/ref/CG-ABC123"
 */
export function extractReferralCode(input: string): string | null {
  const match = input.match(
    new RegExp(`${referralConfig.codePrefix}-[${ALPHABET}]{${referralConfig.codeLength}}`)
  );
  return match ? match[0] : null;
}
