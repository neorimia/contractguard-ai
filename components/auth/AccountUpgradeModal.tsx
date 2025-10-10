// components/auth/AccountUpgradeModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface AccountUpgradeModalProps {
  isOpen: boolean;
  email: string;
  accountType: "soft";
  scansRemaining: number;
  onClose: () => void;
}

/**
 * Modal shown to soft account users when they hit scan limits
 * Prompts them to complete their account setup (Stack Auth signup)
 */
export function AccountUpgradeModal({
  isOpen,
  email,
  accountType,
  scansRemaining,
  onClose,
}: AccountUpgradeModalProps) {
  const [upgrading, setUpgrading] = useState(false);

  // Only show for soft accounts
  if (accountType !== "soft") return null;

  const handleCompleteSetup = () => {
    setUpgrading(true);
    // Redirect to Stack Auth signup
    window.location.href = "/handler/sign-up";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">
                Complete Your Account
              </DialogTitle>
              <DialogDescription className="text-sm">
                You've reached the free tier limit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Limited Account
                </p>
                <p className="text-sm text-amber-700">
                  You're signed in with <strong>{email}</strong>, but you
                  haven't completed your account setup yet.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Complete your account to unlock:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>
                  <strong>3 free scans per day</strong> instead of one-time
                  limit
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>
                  <strong>Full scan history</strong> with all your previous
                  results
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>
                  <strong>Upgrade options</strong> for unlimited scans
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>
                  <strong>Email notifications</strong> and alerts
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCompleteSetup}
              disabled={upgrading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              size="lg"
            >
              {upgrading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Redirecting...
                </>
              ) : (
                <>
                  Complete Account Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-600">
              Takes less than 30 seconds • No payment required
            </p>
          </div>

          {/* Alternative - Upgrade to Pro */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-600 mb-2">
              Want unlimited scans instead?
            </p>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="w-full">
                View Pro Plans
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
