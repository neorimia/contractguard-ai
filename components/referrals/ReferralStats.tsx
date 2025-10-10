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
          bgColor: "bg-green-950/40",
          borderColor: "border-green-800/50",
          textColor: "text-green-400",
        };
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "Pending",
          bgColor: "bg-yellow-950/40",
          borderColor: "border-yellow-800/50",
          textColor: "text-yellow-400",
        };
      case "cancelled":
        return {
          icon: <Users className="h-4 w-4" />,
          label: "Cancelled",
          bgColor: "bg-red-950/40",
          borderColor: "border-red-800/50",
          textColor: "text-red-400",
        };
      default:
        return {
          icon: <Users className="h-4 w-4" />,
          label: status,
          bgColor: "bg-neutral-950/40",
          borderColor: "border-neutral-800/50",
          textColor: "text-neutral-400",
        };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 shadow-xl">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />

      {/* Header */}
      <div className="relative border-b border-neutral-800 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-2">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Recent Referrals</h3>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-neutral-800/50 p-4">
              <Sparkles className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-neutral-400">
              No referrals yet. Share your link to get started!
            </p>
            <p className="mt-2 text-sm text-neutral-500">
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
                  className={`relative overflow-hidden rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Gradient accent */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />

                  <div className="relative flex items-center justify-between">
                    {/* Left side - Status info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor} p-2`}
                      >
                        {statusConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {isRewarded ? "Friend joined!" : "Pending signup"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
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
                          className={`h-2 w-2 rounded-full ${statusConfig.textColor.replace("text-", "bg-")}`}
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
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1.5 border border-green-500/30"
                        >
                          <Gift className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-sm font-bold text-green-400">
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
