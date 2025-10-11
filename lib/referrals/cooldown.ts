// lib/referrals/cooldown.ts

import { differenceInDays, addDays, formatDistanceToNow } from "date-fns";

/**
 * Cooldown period in days between reward claims
 */
export const REWARD_COOLDOWN_DAYS = 30;

/**
 * Check if user is currently in cooldown period
 */
export function isInCooldown(lastRewardDate: Date | null): boolean {
  if (!lastRewardDate) {
    return false; // No previous reward, no cooldown
  }

  const daysSinceLastReward = differenceInDays(new Date(), lastRewardDate);
  return daysSinceLastReward < REWARD_COOLDOWN_DAYS;
}

/**
 * Get days remaining in cooldown period
 */
export function getCooldownDaysRemaining(lastRewardDate: Date | null): number {
  if (!lastRewardDate) {
    return 0;
  }

  const daysSinceLastReward = differenceInDays(new Date(), lastRewardDate);
  const daysRemaining = REWARD_COOLDOWN_DAYS - daysSinceLastReward;

  return Math.max(0, daysRemaining);
}

/**
 * Get next reward available date
 */
export function getNextRewardDate(lastRewardDate: Date | null): Date | null {
  if (!lastRewardDate) {
    return null;
  }

  return addDays(lastRewardDate, REWARD_COOLDOWN_DAYS);
}

/**
 * Get human-readable cooldown status
 */
export function getCooldownStatus(lastRewardDate: Date | null): {
  isActive: boolean;
  daysRemaining: number;
  nextAvailableDate: Date | null;
  humanReadable: string;
} {
  const isActive = isInCooldown(lastRewardDate);
  const daysRemaining = getCooldownDaysRemaining(lastRewardDate);
  const nextAvailableDate = getNextRewardDate(lastRewardDate);

  let humanReadable = "";
  if (!isActive) {
    humanReadable = "No cooldown - ready to claim rewards";
  } else if (nextAvailableDate) {
    humanReadable = `Next reward available ${formatDistanceToNow(nextAvailableDate, { addSuffix: true })}`;
  }

  return {
    isActive,
    daysRemaining,
    nextAvailableDate,
    humanReadable,
  };
}

/**
 * Format cooldown time remaining for UI display
 */
export function formatCooldownTime(lastRewardDate: Date | null): string {
  const daysRemaining = getCooldownDaysRemaining(lastRewardDate);

  if (daysRemaining === 0) {
    return "Available now";
  }

  if (daysRemaining === 1) {
    return "1 day remaining";
  }

  return `${daysRemaining} days remaining`;
}