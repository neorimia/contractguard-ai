"use client";

import { useEffect, useState } from "react";
import { Trophy, Award, Crown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  referralCount: number;
  tier: string;
  badge: string;
}

export function Leaderboard({ limit = 100 }: { limit?: number }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 5; // Show 5 entries at a time

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/referrals/leaderboard?limit=${limit}`);
      const result = await response.json();
      if (result.success) {
        setLeaderboard(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const rotateItems = () => {
    if (startIndex + visibleCount < leaderboard.length) {
      setStartIndex((prev) => prev + visibleCount);
    } else {
      setStartIndex(0); // Loop back to start
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-100" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-100" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-100" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-500";
    if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600";
    return "bg-black/5 dark:bg-white/5";
  };

  const getRankBorderColor = (rank: number) => {
    if (rank === 1) return "border-yellow-500/50 dark:border-yellow-400/50";
    if (rank === 2) return "border-gray-400/50 dark:border-gray-300/50";
    if (rank === 3) return "border-orange-500/50 dark:border-orange-400/50";
    return "border-black/10 dark:border-white/10";
  };

  const slideVariants: Variants = {
    enter: {
      y: 20,
      opacity: 0,
    },
    center: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: -20,
      opacity: 0,
    },
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-5 sm:p-6 bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 rounded-2xl animate-pulse"
          >
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Rank Badge Skeleton */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/10 dark:bg-white/10" />

              {/* Content Skeleton */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                {/* Badge & Name Skeleton */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/10 dark:bg-white/10 flex-shrink-0" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded-md w-32 sm:w-40" />
                    <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-20 sm:w-24" />
                  </div>
                </div>

                {/* Referral Count Skeleton */}
                <div className="text-right flex-shrink-0 space-y-2">
                  <div className="h-6 sm:h-8 bg-black/10 dark:bg-white/10 rounded-md w-12 sm:w-16 ml-auto" />
                  <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-16 sm:w-20 ml-auto" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-12 text-black/60 dark:text-white/60">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No referrals yet. Be the first!</p>
      </div>
    );
  }

  const visibleItems = leaderboard.slice(startIndex, startIndex + visibleCount);
  const hasMore = startIndex + visibleCount < leaderboard.length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <div className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems.map((entry, index) => (
            <motion.div
              key={`${startIndex}-${entry.userId}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              layoutId={`item-${entry.userId}`}
              className={cn(
                "group relative overflow-hidden",
                "p-5 sm:p-6 transition-all duration-300",
                "bg-white dark:bg-black",
                "border-2 rounded-2xl",
                getRankBorderColor(entry.rank),
                "hover:shadow-xl dark:hover:shadow-2xl",
                "hover:scale-[1.02]",
                index !== 0 && "mt-3"
              )}
            >
              {/* Background glow for top 3 */}
              {entry.rank <= 3 && (
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div
                    className={cn(
                      "absolute inset-0",
                      getRankBadgeColor(entry.rank)
                    )}
                  />
                </div>
              )}

              <div className="relative flex items-center gap-4 sm:gap-6">
                {/* Rank Badge */}
                <div
                  className={cn(
                    "flex items-center justify-center",
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl",
                    "shadow",
                    getRankBadgeColor(entry.rank)
                  )}
                >
                  {getRankIcon(entry.rank) || (
                    <span className="text-xl sm:text-2xl font-light text-black dark:text-white">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  {/* Badge & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {entry.badge}
                    </span>
                    <div className="min-w-0">
                      <div className="text-base sm:text-base font-medium text-black dark:text-white truncate">
                        {entry.displayName}
                      </div>
                      <div className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                        {entry.tier} Tier
                      </div>
                    </div>
                  </div>

                  {/* Referral Count */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl sm:text-2xl font-light text-black dark:text-white">
                      {entry.referralCount}
                    </div>
                    <div className="text-xs text-black/50 dark:text-white/50 uppercase tracking-wide">
                      Referrals
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -translate-x-full group-hover:translate-x-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {leaderboard.length > visibleCount && (
        <motion.button
          onClick={rotateItems}
          className={cn(
            "w-full p-3",
            "bg-black/5 dark:bg-white/5",
            "hover:bg-black/10 dark:hover:bg-white/10",
            "rounded-xl border border-black/10 dark:border-white/10",
            "text-sm text-black/70 dark:text-white/70",
            "transition-colors duration-200",
            "flex items-center justify-center gap-2"
          )}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          <span>{hasMore ? "Show Next" : "Back to Top"}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              !hasMore && "rotate-180"
            )}
          />
        </motion.button>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-black/10 dark:border-white/10 text-center text-sm text-black/60 dark:text-white/60">
        <p>
          🏆 Climb the leaderboard by referring more users to ContractGuard AI
        </p>
      </div>
    </div>
  );
}
