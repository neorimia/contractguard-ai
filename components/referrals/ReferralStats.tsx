// components/referrals/ReferralStats.tsx
"use client";

import { motion } from "motion/react";
import { Users, Clock, CheckCircle, Gift, Sparkles } from "lucide-react";

interface Referral {
  id: string;
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
  rewardAmount?: number | null;
}

interface ReferralStatsProps {
  referrals: Referral[];
}

export function ReferralStats({ referrals }: ReferralStatsProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
      case "rewarded":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Confirmed",
          bgColor: "bg-green-600/10 dark:bg-green-400/10",
          borderColor: "border-green-600/30 dark:border-green-400/30",
          textColor: "text-green-600 dark:text-green-400",
          dotColor: "bg-green-600 dark:bg-green-400",
        };
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "Pending",
          bgColor: "bg-yellow-600/10 dark:bg-yellow-400/10",
          borderColor: "border-yellow-600/30 dark:border-yellow-400/30",
          textColor: "text-yellow-600 dark:text-yellow-400",
          dotColor: "bg-yellow-600 dark:bg-yellow-400",
        };
      case "cancelled":
        return {
          icon: <Users className="h-4 w-4" />,
          label: "Cancelled",
          bgColor: "bg-red-600/10 dark:bg-red-400/10",
          borderColor: "border-red-600/30 dark:border-red-400/30",
          textColor: "text-red-600 dark:text-red-400",
          dotColor: "bg-red-600 dark:bg-red-400",
        };
      default:
        return {
          icon: <Users className="h-4 w-4" />,
          label: status,
          bgColor: "bg-black/5 dark:bg-white/5",
          borderColor: "border-black/10 dark:border-white/10",
          textColor: "text-black/60 dark:text-white/60",
          dotColor: "bg-black/60 dark:bg-white/60",
        };
    }
  };

  return (
    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-black dark:text-white" />
          </div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Recent Referrals
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-black/5 dark:bg-white/5 p-4">
              <Sparkles className="h-8 w-8 text-black/50 dark:text-white/50" />
            </div>
            <p className="text-black/60 dark:text-white/60">
              No referrals yet. Share your link to get started!
            </p>
            <p className="mt-2 text-sm text-black/50 dark:text-white/50">
              Invite friends and earn rewards together 💎
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral, idx) => {
              const statusConfig = getStatusConfig(referral.status);
              const isRewarded =
                referral.status === "confirmed" ||
                referral.status === "rewarded";

              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl hover:border-black/20 dark:hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Status info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor} p-2 ${statusConfig.textColor}`}
                      >
                        {statusConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black dark:text-white">
                            {isRewarded ? "Friend joined!" : "Pending signup"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                          <Clock className="h-3 w-3" />
                          {formatDate(referral.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status badge and reward */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Status badge */}
                      <div
                        className={`flex items-center gap-1.5 rounded-full border ${statusConfig.borderColor} ${statusConfig.bgColor} px-3 py-1`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`}
                        />
                        <span
                          className={`text-xs font-medium ${statusConfig.textColor}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Reward amount */}
                      {referral.rewardAmount && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: idx * 0.1 + 0.2,
                            type: "spring",
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600/10 dark:bg-green-400/10 px-3 py-1.5 border border-green-600/30 dark:border-green-400/30"
                        >
                          <Gift className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            +{referral.rewardAmount} scans
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
