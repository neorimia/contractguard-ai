// components/auth/CompleteAccountPrompt.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface CompleteAccountPromptProps {
  email: string;
  accountType: "soft";
  onClose?: () => void;
}

/**
 * Prompt shown to soft account users to complete their account setup
 * Soft accounts = email verified via magic link, but no password/OAuth set
 */
export function CompleteAccountPrompt({
  email,
  accountType,
  onClose,
}: CompleteAccountPromptProps) {
  // Only show for soft accounts
  if (accountType !== "soft") return null;

  const handleCompleteSetup = () => {
    // Redirect to Stack Auth account settings
    window.location.href = "/handler/account-settings";
  };

  return (
    <Card className="p-5 bg-amber-50 border-amber-200 shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-amber-900 mb-1">
            Complete Your Account Setup
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            You're signed in with <strong>{email}</strong>, but you haven't set
            up a password or connected a Google account yet.
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCompleteSetup}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
              >
                Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
