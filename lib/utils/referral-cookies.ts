// lib/utils/referral-cookies.ts

import { cookies } from "next/headers";
import { referralConfig } from "@/lib/referrals/config";

/**
 * Set referral cookie (server-side)
 */
export async function setReferralCookie(code: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(referralConfig.cookieName, code, {
    maxAge: referralConfig.cookieMaxAge,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

/**
 * Get referral cookie (server-side)
 */
export async function getReferralCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(referralConfig.cookieName)?.value || null;
}

/**
 * Clear referral cookie (server-side)
 */
export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(referralConfig.cookieName);
}

/**
 * Set referral cookie (client-side)
 */
export function setReferralCookieClient(code: string): void {
  const maxAge = referralConfig.cookieMaxAge;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${referralConfig.cookieName}=${code}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

/**
 * Get referral cookie (client-side)
 */
export function getReferralCookieClient(): string | null {
  const name = `${referralConfig.cookieName}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }

  return null;
}

/**
 * Clear referral cookie (client-side)
 */
export function clearReferralCookieClient(): void {
  document.cookie = `${referralConfig.cookieName}=; path=/; max-age=0`;
}
