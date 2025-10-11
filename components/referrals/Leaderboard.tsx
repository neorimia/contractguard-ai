"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, Crown } from "lucide-react";
import { motion } from "framer-motion";

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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-500 to-yellow-600";
    if (rank === 2) return "from-gray-400 to-gray-500";
    if (rank === 3) return "from-orange-600 to-orange-700";
    return "from-gray-700 to-gray-800";
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Referral Leaderboard
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <TrendingUp className="w-4 h-4" />
          Top {leaderboard.length} Referrers
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No referrals yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative overflow-hidden rounded-lg
                ${entry.rank <= 3 ? "bg-gradient-to-r " + getRankColor(entry.rank) : "bg-gray-800"}
                ${entry.rank <= 3 ? "border-2 border-white/20" : "border border-gray-700"}
              `}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm">
                  {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-white">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Badge & Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{entry.badge}</span>
                    <div>
                      <div className="font-semibold text-white">
                        {entry.displayName}
                      </div>
                      <div className="text-sm text-gray-300">
                        {entry.tier} Tier
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral Count */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {entry.referralCount}
                  </div>
                  <div className="text-sm text-gray-300">referrals</div>
                </div>
              </div>

              {/* Glow effect for top 3 */}
              {entry.rank <= 3 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
        <p>
          🏆 Climb the leaderboard by referring more users to ContractGuard AI
        </p>
      </div>
    </Card>
  );
}
