// components/auth/SoftSignupPrompt.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

interface SoftSignupPromptProps {
  scansPerformed: number;
  scansRemaining: number;
  anonymousSessionId: string;
  onClose?: () => void;
}

export function SoftSignupPrompt({
  scansPerformed,
  scansRemaining,
  anonymousSessionId,
  onClose,
}: SoftSignupPromptProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show prompt after 2 scans
  if (scansPerformed < 2) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/soft-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          anonymousSessionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        if (data.action === "redirect_to_signin") {
          // User already exists, redirect to signin
          setError(
            "This email is already registered. Redirecting to sign in..."
          );
          setTimeout(() => {
            window.location.href = "/handler/sign-in";
          }, 2000);
        } else {
          setError(data.error || "Failed to send magic link");
        }
      }
    } catch (err) {
      console.error("Soft signup error:", err);
      setError("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success state - email sent
  if (submitted) {
    return (
      <Card className="p-6 bg-green-50 border-green-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              ✉️ Check Your Email
            </h3>
            <p className="text-green-700 mb-3">
              We sent a magic link to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-green-600">
              Click the link in your email to save your scans and continue. The
              link expires in 1 hour.
            </p>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="mt-4 text-green-700 hover:text-green-800 hover:bg-green-100"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Signup form
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            💾 Save Your Scans
          </h3>
          <p className="text-blue-700 mb-1">
            You've scanned <strong>{scansPerformed}</strong> contract
            {scansPerformed > 1 ? "s" : ""}.
          </p>
          <p className="text-sm text-blue-600 mb-4">
            Enter your email to save your results and get{" "}
            <strong>3 free scans per day</strong>
            {scansRemaining > 0 && ` (${scansRemaining} remaining today)`}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !email}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-600 flex items-center gap-1">
              <span className="text-green-600">✓</span>
              No password required - we'll send you a magic link
            </p>
          </form>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-gray-600">
              Already have an account?{" "}
              <a
                href="/handler/sign-in"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
