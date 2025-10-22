"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Bell, Lock } from "lucide-react";
import { AddToWatchlistDialog } from "./AddToWatchlistDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddToWatchlistButtonProps {
  contractAddress: string;
  chain: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddToWatchlistButton({
  contractAddress,
  chain,
  className,
  variant = "outline",
  size = "default",
}: AddToWatchlistButtonProps) {
  const stackUser = useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isCheckingTier, setIsCheckingTier] = useState(false);

  const handleClick = async () => {
    // Check if user is authenticated
    if (!stackUser) {
      // Redirect to sign in
      window.location.href = "/auth/signin";
      return;
    }

    setIsCheckingTier(true);

    try {
      // Check user tier via API
      const response = await fetch("/api/user/tier");
      if (!response.ok) {
        throw new Error("Failed to check user tier");
      }

      const { tier } = await response.json();

      if (tier !== "pro" && tier !== "team") {
        // Show upgrade prompt
        setShowUpgradePrompt(true);
        return;
      }

      // Open watchlist dialog
      setShowDialog(true);
    } catch (error) {
      console.error("Error checking user tier:", error);
      // Fallback: show upgrade prompt
      setShowUpgradePrompt(true);
    } finally {
      setIsCheckingTier(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        disabled={isCheckingTier}
      >
        <Bell className="mr-2 h-4 w-4" />
        {isCheckingTier ? "Checking..." : "Add to Watchlist"}
      </Button>

      {/* Upgrade Prompt Dialog */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Upgrade to Pro for Watchlist Alerts
            </DialogTitle>
            <DialogDescription className="text-center">
              Monitor your contracts 24/7 and get instant email alerts when
              security risks change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-left bg-black/5 dark:bg-white/5 p-6 rounded-lg mt-4">
            <h3 className="font-semibold mb-3 text-black dark:text-white">
              Pro features include:
            </h3>
            <ul className="space-y-2 text-black/70 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Watch up to 10 contracts simultaneously</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Instant email alerts for risk changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Customizable alert thresholds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Weekly summary reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Alert history and analytics</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowUpgradePrompt(false)}
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => (window.location.href = "/pricing")}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              Upgrade to Pro - $29/month
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Watchlist Dialog */}
      <AddToWatchlistDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => {
          setShowDialog(false);
          // Show success message or redirect to watchlist page
        }}
        defaultValues={{
          contractAddress,
          chain,
        }}
      />
    </>
  );
}
