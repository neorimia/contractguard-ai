"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Share2, Trophy, TrendingUp, Gift, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { REFERRAL_TIERS } from "@/lib/referrals/gamification-config";
import { ReferralStats } from "./ReferralStats";
import { ReferralDashboardSkeleton } from "./ReferralDashboardSkeleton";

interface DashboardData {
  currentTier: {
    id: string;
    name: string;
    badge: string;
    color: string;
    bgGradient: string;
    perks: string[];
    reward: {
      description: string;
      details: string;
    };
  };
  nextTier: {
    id: string;
    name: string;
    badge: string;
    referralsRequired: number;
  } | null;
  progress: number;
  referralsNeeded: number;
  totalReferrals: number;
  activeCommissions: number;
  totalEarnings: number;
  lifetimeCommission: number;
  achievements: Array<{
    tier: string;
    achievedAt: string;
    rewardDescription: string;
  }>;
  recentReferrals: Array<{
    date: string;
    status: string;
    reward: string;
  }>;
}

interface Referral {
  id: string;
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
  rewardAmount?: number | null;
}

export function ReferralDashboard({ userId }: { userId?: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    fetchDashboard();
    fetchReferralCode();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/referrals/dashboard");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await fetch("/api/referrals/stats");
      const result = await response.json();
      if (result.referralCode) {
        setReferralCode(result.referralCode);
      }
      if (result.recentReferrals) {
        setRecentReferrals(result.recentReferrals);
      }
    } catch (error) {
      console.error("Failed to fetch referral code:", error);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/ref/${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const link = `${window.location.origin}/ref/${referralCode}`;
    const text = `Check out ContractGuard AI! Scan smart contracts for scams in seconds. Join me and get bonus scans! 🚀`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(twitterUrl, "_blank");
  };

  if (loading) {
    return <ReferralDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-black/60 dark:text-white/60">
          Failed to load dashboard data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Badge Section */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${data.currentTier.bgGradient} flex items-center justify-center text-4xl`}
            >
              {data.currentTier.badge}
            </motion.div>
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                {data.currentTier.name} Tier
              </h2>
              <p className="text-black/60 dark:text-white/60 mt-1">
                {data.totalReferrals} successful referrals
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-black/60 dark:text-white/60">
              Total Earnings
            </div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              ${(data.totalEarnings / 100).toFixed(2)}
            </div>
            {data.activeCommissions > 0 && (
              <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                {data.activeCommissions} active commission
                {data.activeCommissions !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Current Tier Perks */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.currentTier.perks.map((perk, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
              {perk}
            </div>
          ))}
        </div>
      </div>

      {/* Progress to Next Tier */}
      {data.nextTier && (
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Next: {data.nextTier.badge} {data.nextTier.name}
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                {data.referralsNeeded} more referral
                {data.referralsNeeded !== 1 ? "s" : ""} needed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-black dark:text-white">
                {Math.round(data.progress)}%
              </div>
            </div>
          </div>
          <Progress value={data.progress} className="h-3" />
        </div>
      )}

      {/* Referral Link Section */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Your Referral Link
        </h3>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-black/70 dark:text-white/70 font-mono text-sm">
            {window.location.origin}/ref/{referralCode}
          </div>
          <Button
            onClick={copyReferralLink}
            variant="outline"
            className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={shareOnTwitter}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Total Referrals
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {data.totalReferrals}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Total Earned
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                ${(data.totalEarnings / 100).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Commissions
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                ${(data.lifetimeCommission / 100).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <ReferralStats referrals={recentReferrals} />

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Achievements
          </h3>
          <div className="space-y-3">
            {data.achievements.map((achievement, index) => {
              const tier = REFERRAL_TIERS[achievement.tier];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5"
                >
                  <div className="text-3xl">{tier?.badge || "🏆"}</div>
                  <div className="flex-1">
                    <div className="font-medium text-black dark:text-white">
                      {tier?.name || achievement.tier} Tier Unlocked
                    </div>
                    <div className="text-sm text-black/60 dark:text-white/60">
                      {achievement.rewardDescription}
                    </div>
                  </div>
                  <div className="text-xs text-black/50 dark:text-white/50">
                    {new Date(achievement.achievedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
