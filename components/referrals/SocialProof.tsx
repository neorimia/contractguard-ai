"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, DollarSign, TrendingUp, Sparkles } from "lucide-react";

interface SocialProofData {
  totalUsersJoined: number;
  totalScamsAvoided: number;
  estimatedSavings: number;
  estimatedSavingsFormatted: string;
  totalReferrals: number;
  totalScans: number;
  topReferrerCount: number;
  topReferrerName: string;
  recentUsers24h: number;
  viralCoefficient: string;
  milestones: {
    nextUserMilestone: number | null;
    nextSavingsMilestone: number | null;
  };
}

export function SocialProof({
  variant = "banner",
}: {
  variant?: "banner" | "widget" | "footer";
}) {
  const [data, setData] = useState<SocialProofData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    fetchSocialProof();
    const interval = setInterval(fetchSocialProof, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 4000); // Rotate stats every 4 seconds
    return () => clearInterval(interval);
  }, [data]);

  const fetchSocialProof = async () => {
    try {
      const response = await fetch("/api/referrals/social-proof");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch social proof:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return null;
  }

  const stats = [
    {
      icon: Users,
      label: "Users Protected",
      value: data.totalUsersJoined.toLocaleString(),
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      icon: Shield,
      label: "Scams Avoided",
      value: data.totalScamsAvoided.toLocaleString(),
      color: "text-red-400",
      bgColor: "bg-red-500/20",
    },
    {
      icon: DollarSign,
      label: "Money Saved",
      value: data.estimatedSavingsFormatted,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      icon: TrendingUp,
      label: "Viral Coefficient",
      value: data.viralCoefficient,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
  ];

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">
              ContractGuard Community Impact
            </span>
          </div>
          <div className="flex items-center gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                {(() => {
                  const stat = stats[currentStat];
                  const Icon = stat.icon;
                  return (
                    <>
                      <div
                        className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-400">{stat.label}</div>
                        <div className="font-bold text-white">{stat.value}</div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "widget") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4"
            >
              <div
                className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mb-3`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        {data.recentUsers24h > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-800 text-center"
          >
            <div className="text-sm text-gray-400">
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold text-green-400">
                  {data.recentUsers24h}
                </span>{" "}
                new users joined in the last 24 hours
              </span>
            </div>
          </motion.div>
        )}

        {/* Top Referrer */}
        {data.topReferrerCount > 0 && (
          <div className="mt-3 text-center text-sm text-gray-400">
            🏆 Top referrer:{" "}
            <span className="text-white font-medium">
              {data.topReferrerName}
            </span>{" "}
            with{" "}
            <span className="text-purple-400 font-semibold">
              {data.topReferrerCount}
            </span>{" "}
            referrals
          </div>
        )}
      </div>
    );
  }

  return null;
}
