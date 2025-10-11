"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AlertCircle, Clock, XCircle, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason") || "unknown";

  // Set document title based on error type
  useEffect(() => {
    const titles: Record<string, string> = {
      invalid_token: "Invalid Magic Link",
      expired_token: "Link Expired",
      verification_failed: "Verification Failed",
      unknown: "Authentication Error",
    };
    const title = titles[reason] || titles.unknown;
    document.title = `${title} | ContractGuard AI`;
  }, [reason]);

  const errorConfig = {
    invalid_token: {
      icon: XCircle,
      title: "Invalid Magic Link",
      description:
        "This magic link is invalid or has already been used. Magic links can only be used once.",
      iconColor: "text-red-500",
      bgColor: "from-red-500/10 to-red-600/5",
      action: {
        label: "Request New Link",
        onClick: () => router.push("/audit"),
      },
    },
    expired_token: {
      icon: Clock,
      title: "Link Expired",
      description:
        "This magic link has expired. Magic links are valid for 1 hour after they're sent.",
      iconColor: "text-amber-500",
      bgColor: "from-amber-500/10 to-amber-600/5",
      action: {
        label: "Get New Link",
        onClick: () => router.push("/audit"),
      },
    },
    verification_failed: {
      icon: AlertCircle,
      title: "Verification Failed",
      description:
        "We couldn't verify your magic link. This might be due to a technical issue or an invalid link.",
      iconColor: "text-orange-500",
      bgColor: "from-orange-500/10 to-orange-600/5",
      action: {
        label: "Try Again",
        onClick: () => router.push("/audit"),
      },
    },
    unknown: {
      icon: AlertCircle,
      title: "Authentication Error",
      description:
        "An unexpected error occurred during authentication. Please try again.",
      iconColor: "text-gray-500",
      bgColor: "from-gray-500/10 to-gray-600/5",
      action: {
        label: "Go Home",
        onClick: () => router.push("/"),
      },
    },
  };

  const config =
    errorConfig[reason as keyof typeof errorConfig] || errorConfig.unknown;
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Icon */}
          <div
            className={`mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${config.bgColor}`}
          >
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3 text-foreground">
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {config.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={config.action.onClick}
              className="w-full h-11 text-base font-semibold"
            >
              {config.action.label}
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-11 text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Having trouble signing up?
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href="mailto:support@contractguard.ai"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
            <span className="text-muted-foreground">|</span>
            <a
              href="/faq"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Visit FAQ
            </a>
          </div>
        </div>

        {/* Additional Help Based on Error Type */}
        {reason === "expired_token" && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-2 text-foreground">
              💡 Tip: Check your email again
            </h3>
            <p className="text-xs text-muted-foreground">
              If you requested multiple magic links, make sure you're clicking
              the most recent one. Older links expire when new ones are sent.
            </p>
          </div>
        )}

        {reason === "invalid_token" && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-2 text-foreground">
              💡 Tip: Already signed up?
            </h3>
            <p className="text-xs text-muted-foreground">
              If you've already created an account, try signing in instead.
              Magic links can only be used once.
            </p>
            <Button
              onClick={() => router.push("/sign-in")}
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-primary"
            >
              Go to Sign In →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
