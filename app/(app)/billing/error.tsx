"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Billing page error:", error);
  }, [error]);

  return (
    <section className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-6 rounded-full bg-red-100 dark:bg-red-950/30">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60 max-w-md">
              We encountered an error while loading your billing information.
              Please try again or contact support if the problem persists.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Go to Homepage
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-black/40 dark:text-white/40 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
