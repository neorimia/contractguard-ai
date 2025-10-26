"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Edit, Loader2 } from "lucide-react";
import type { PaymentMethodData } from "../schemas";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodData | null;
  onManagePayment: () => void;
  loading: boolean;
}

export const PaymentMethodCard = memo(function PaymentMethodCard({
  paymentMethod,
  onManagePayment,
  loading,
}: PaymentMethodCardProps) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Payment Method
        </h3>

        {paymentMethod ? (
          <>
            <div className="p-4 border border-black/5 dark:border-white/5 rounded-lg bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="h-5 w-5 text-black/60 dark:text-white/60" />
                <span className="font-mono text-black dark:text-white">
                  •••• {paymentMethod.card.last4}
                </span>
              </div>
              <p className="text-sm text-black/60 dark:text-white/60">
                {paymentMethod.card.brand.toUpperCase()} • Expires{" "}
                {paymentMethod.card.expMonth}/{paymentMethod.card.expYear}
              </p>
            </div>

            <Button
              onClick={onManagePayment}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Payment
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              No payment method on file
            </p>
            <Button
              onClick={onManagePayment}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Add Payment Method"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
});
