// lib/stack.tsx
"use client";

import { StackProvider, StackClientApp } from "@stackframe/stack";
import { useMemo } from "react";

export function StackAuthProvider({ children }: { children: React.ReactNode }) {
  // Get env vars
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  // Check for missing or empty credentials
  const hasValidCredentials = useMemo(() => {
    return (
      projectId &&
      publishableKey &&
      projectId.trim() !== "" &&
      publishableKey.trim() !== ""
    );
  }, [projectId, publishableKey]);

  // Create Stack app instance with proper token store
  const stackApp = useMemo(() => {
    if (!hasValidCredentials) return null;

    return new StackClientApp({
      projectId: projectId!,
      publishableClientKey: publishableKey!,
      tokenStore: "nextjs-cookie", // Use Next.js cookie-based token storage
      urls: {
        signIn: "/handler/sign-in",
        signUp: "/handler/sign-up",
        afterSignIn: "/",
        afterSignUp: "/",
        afterSignOut: "/",
      },
    });
  }, [hasValidCredentials, projectId, publishableKey]);

  // If no valid credentials, render children without auth (for development)
  if (!hasValidCredentials || !stackApp) {
    if (typeof window !== "undefined") {
      console.warn(
        "⚠️ Stack Auth credentials not configured. Authentication will not work."
      );
      console.warn(
        "Add NEXT_PUBLIC_STACK_PROJECT_ID and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY to .env.local"
      );
    }

    // Create a mock Stack app for development
    const mockStackApp = new StackClientApp({
      projectId: "mock-project-id",
      publishableClientKey: "mock-publishable-key",
      tokenStore: "nextjs-cookie",
      urls: {
        signIn: "/handler/sign-in",
        signUp: "/handler/sign-up",
        afterSignIn: "/",
        afterSignUp: "/",
        afterSignOut: "/",
      },
    });

    return <StackProvider app={mockStackApp}>{children}</StackProvider>;
  }

  // Render with StackProvider
  return <StackProvider app={stackApp}>{children}</StackProvider>;
}
