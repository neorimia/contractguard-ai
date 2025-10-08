"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a refresh token error
    const isAuthError =
      error.message?.includes("refresh token") ||
      error.message?.includes("authentication") ||
      error.message?.includes("unauthorized");

    return {
      hasError: isAuthError,
      error: isAuthError ? error : undefined,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error("Auth Error Boundary caught an error:", error, errorInfo);

    // If it's a refresh token error, clear session and redirect
    if (this.state.hasError) {
      this.clearSessionAndRedirect();
    }
  }

  clearSessionAndRedirect = () => {
    try {
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Error clearing session:", error);
      // Force redirect anyway
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // Show a fallback UI while clearing session
      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Session Expired
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Redirecting you to the home page...
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
