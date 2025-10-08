/**
 * PostHog Provider Component
 *
 * Initializes PostHog analytics and provides context to the app
 */

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, trackPageView } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
