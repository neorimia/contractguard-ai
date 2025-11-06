"use client";

import { useState } from "react";
import { useStackApp } from "@stackframe/stack";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CustomMagicLinkSignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stackApp = useStackApp();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await stackApp.sendMagicLinkEmail(email);

      if (result.status === "ok") {
        setIsEmailSent(true);
      } else {
        // Handle error
        const errorMessage = result.error?.message || "Failed to send magic link. Please try again.";
        setError(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Magic link error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email sent state (after email is sent)
  if (isEmailSent) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Mail className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
            Check your email
          </h2>
          <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
            We sent a magic link to <span className="font-medium text-black dark:text-white">{email}</span>
          </p>
        </div>

        <div className="p-6 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-black dark:text-white">Click the link in your email</p>
                <p className="text-black/70 dark:text-white/70">
                  Open your email inbox and click the link in the email we just sent. This will sign you in or create your account if you're new.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-black dark:text-white">Link expires in 1 hour</p>
                <p className="text-black/70 dark:text-white/70">
                  For security, the magic link will expire after 1 hour. You can request a new one if needed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-black dark:text-white">No password required</p>
                <p className="text-black/70 dark:text-white/70">
                  The magic link will automatically sign you in or create your account. No need to remember or enter a password.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => {
              setIsEmailSent(false);
              setError(null);
            }}
            className="w-full text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
          >
            Use a different email
          </button>
          <button
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              try {
                const result = await stackApp.sendMagicLinkEmail(email);
                if (result.status === "ok") {
                  // Link resent successfully
                } else {
                  const errorMessage = result.error?.message || "Failed to resend magic link. Please try again.";
                  setError(errorMessage);
                }
              } catch (err) {
                setError("An unexpected error occurred. Please try again.");
                console.error("Resend magic link error:", err);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Resend magic link"}
          </button>
        </div>
      </div>
    );
  }

  // Email input state (initial)
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
          Sign in with magic link
        </h2>
        <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
          Enter your email address and we'll send you a secure link to sign in or create your account.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="sr-only">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="w-full"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send magic link
            </>
          )}
        </Button>
      </form>

      <div className="text-xs text-center text-black/60 dark:text-white/60">
        New to ContractGuard AI? The magic link will create your account automatically.
      </div>
    </div>
  );
}

