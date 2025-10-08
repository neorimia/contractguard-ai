/**
 * User Identifier Component
 *
 * Automatically identifies users in PostHog when they log in
 */

"use client";

import { useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { identifyUser, resetUser } from "@/lib/analytics/posthog";

export function UserIdentifier() {
  const user = useUser();

  useEffect(() => {
    if (user) {
      // Identify user in PostHog
      identifyUser(user.id, {
        email: user.primaryEmail,
        displayName: user.displayName,
        signedUpAt: user.signedUpAt,
        // Add any other user properties you want to track
      });
    } else {
      // Reset on logout
      resetUser();
    }
  }, [user]);

  return null; // This component doesn't render anything
}
