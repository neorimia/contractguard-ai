"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { InvoiceData } from "../schemas";

interface InvoiceListProps {
  invoices: InvoiceData[];
}

// Security: Validate URLs are from trusted domains
const TRUSTED_DOMAINS = [
  "https://billing.stripe.com",
  "https://checkout.stripe.com",
  "https://dashboard.stripe.com",
];

const isValidRedirectUrl = (url: string): boolean => {
  try {
    new URL(url);
    return TRUSTED_DOMAINS.some((domain) => url.startsWith(domain));
  } catch {
    return false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const InvoiceList = memo(function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          Billing History
        </h2>

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 border border-black/5 dark:border-white/5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-black dark:text-white">
                    {formatDate(invoice.created)}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      invoice.status === "paid"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    }`}
                  >
                    {invoice.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-black dark:text-white">
                    ${(invoice.amountPaid / 100).toFixed(2)}
                  </span>

                  {invoice.invoicePdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Validate PDF URL before opening
                        if (
                          isValidRedirectUrl(invoice.invoicePdf) ||
                          invoice.invoicePdf.startsWith(
                            "https://pay.stripe.com"
                          )
                        ) {
                          window.open(invoice.invoicePdf, "_blank");
                        } else {
                          console.error(
                            "Invalid invoice PDF URL:",
                            invoice.invoicePdf
                          );
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-sm text-black/60 dark:text-white/60">
                {invoice.number} • {invoice.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
