"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
}

export const CancelModal = memo(function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  reason,
  onReasonChange,
}: CancelModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-labelledby="cancel-modal-title"
      aria-describedby="cancel-modal-description"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 max-w-md w-full">
        <h3
          id="cancel-modal-title"
          className="text-xl font-semibold text-black dark:text-white mb-4"
        >
          Cancel Subscription
        </h3>
        <p
          id="cancel-modal-description"
          className="text-sm text-black/60 dark:text-white/60 mb-4"
        >
          Are you sure you want to cancel your subscription? You'll have access
          until the end of your current billing period.
        </p>

        <div className="mb-4">
          <label
            htmlFor="cancel-reason"
            className="block text-sm font-medium text-black dark:text-white mb-2"
          >
            Tell us why (optional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white"
            rows={3}
            placeholder="Your feedback helps us improve..."
            aria-label="Cancellation reason"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Keep Subscription
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
