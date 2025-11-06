"use client";

import { StackAuthProvider } from "@/lib/stack";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { UserIdentifier } from "@/components/analytics/UserIdentifier";
import { ThemeProvider } from "next-themes";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { Suspense } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <StackAuthProvider>
      <PostHogProvider>
        <Suspense fallback={null}>
          <UserIdentifier />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <AuthErrorBoundary>{children}</AuthErrorBoundary>
        </ThemeProvider>
      </PostHogProvider>
    </StackAuthProvider>
  );
}
