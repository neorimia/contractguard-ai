"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Coins, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import type { InstantCreditsData } from "../schemas";

interface InstantCreditsCardProps {
  credits: InstantCreditsData | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const InstantCreditsCard = memo(function InstantCreditsCard({ credits }: InstantCreditsCardProps) {
  const router = useRouter();

  if (!credits) {
    return null;
  }

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Instant Credits
          </h2>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1">
            <Coins className="h-3 w-3" />
            Pay-per-scan
          </span>
        </div>

        {/* Credits Balance */}
        <div className="mb-6">
          <p className="text-sm text-black/60 dark:text-white/60 mb-2">
            Available Credits
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-black dark:text-white">
              {credits.balance}
            </span>
            <span className="text-lg text-black/60 dark:text-white/60">
              {credits.balance === 1 ? "credit" : "credits"}
            </span>
          </div>
          {credits.usedToday > 0 && (
            <p className="text-xs text-black/60 dark:text-white/60">
              {credits.usedToday} used today
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 border border-black/5 dark:border-white/5 rounded-lg bg-black/5 dark:bg-white/5">
          <div>
            <p className="text-xs text-black/60 dark:text-white/60 mb-1">
              Total Purchased
            </p>
            <p className="text-lg font-semibold text-black dark:text-white">
              {credits.totalPurchased}
            </p>
          </div>
          <div>
            <p className="text-xs text-black/60 dark:text-white/60 mb-1">
              Remaining
            </p>
            <p className="text-lg font-semibold text-black dark:text-white">
              {credits.balance}
            </p>
          </div>
        </div>

        {/* Recent Purchases */}
        {credits.recentPurchases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
              Recent Credit Purchases
            </h3>
            <div className="space-y-2">
              {credits.recentPurchases.slice(0, 3).map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-3 border border-black/5 dark:border-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {purchase.credits}{" "}
                        {purchase.credits === 1 ? "Report" : "Reports"}
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {formatDate(purchase.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        purchase.status === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : purchase.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {purchase.status}
                    </span>
                    <span className="text-sm font-semibold text-black dark:text-white">
                      ${(purchase.amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buy More Button */}
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => router.push("/pricing")}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy More Credits
        </Button>
      </div>
    </div>
  );
});
