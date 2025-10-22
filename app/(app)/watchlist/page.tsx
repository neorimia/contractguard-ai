"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Bell, AlertCircle } from "lucide-react";
import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { AddToWatchlistDialog } from "@/components/watchlist/AddToWatchlistDialog";
import { WatchlistSkeleton } from "@/components/watchlist/WatchlistSkeleton";

interface User {
  id: number;
  email: string;
  tier: string;
  scansToday: number;
  scansResetAt: string;
}

export default function WatchlistPage() {
  const stackUser = useUser();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!stackUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/tier");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error("Failed to fetch user data");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [stackUser]);

  useEffect(() => {
    if (user) {
      loadWatchlists();
    } else if (stackUser) {
      // User is authenticated but we don't have user data yet
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [user, stackUser]);

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/watchlist");
      const data = await res.json();

      if (data.status === "success") {
        setWatchlists(data.data);
      } else {
        setError(data.error || "Failed to load watchlists");
      }
    } catch (error) {
      console.error("Error loading watchlists:", error);
      setError("Failed to load watchlists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade prompt for non-Pro/Team users
  if (user && user.tier && user.tier !== "pro" && user.tier !== "team") {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-4 sm:p-6 lg:p-8 text-center space-y-4 sm:space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-black dark:text-white">
                Upgrade to Pro for Watchlist Alerts
              </h2>
              <p className="text-sm sm:text-base text-black/60 dark:text-white/60 mb-4 sm:mb-6">
                Monitor your contracts 24/7 and get instant email alerts when
                security risks change.
              </p>
            </div>

            <div className="space-y-3 text-left bg-black/5 dark:bg-white/5 p-4 sm:p-6 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm sm:text-base text-black dark:text-white">
                Pro features include:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-black/70 dark:text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-sm">✓</span>
                  <span>Watch up to 10 contracts simultaneously</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-sm">✓</span>
                  <span>Instant email alerts for risk changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-sm">✓</span>
                  <span>Customizable alert thresholds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-sm">✓</span>
                  <span>Weekly summary reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-sm">✓</span>
                  <span>Alert history and analytics</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={() => router.push("/pricing")}
                size="lg"
                className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">
                  Upgrade to Pro - $29/month
                </span>
                <span className="sm:hidden">Upgrade to Pro</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <WatchlistSkeleton />;
  }

  // Not authenticated
  if (!stackUser) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Card className="p-6 sm:p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
            Please Sign In
          </h2>
          <p className="text-sm sm:text-base text-black/60 dark:text-white/60 ">
            Sign in to access your watchlist and set up contract alerts.
          </p>
          <Button
            onClick={() => router.push("/sign-in?redirect=/watchlist")}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black text-sm sm:text-base"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const watchlistLimit = user?.tier === "team" ? 50 : 10;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-black dark:text-white">
            Contract Watchlist
          </h1>
          <p className="text-sm sm:text-base text-black/60 dark:text-white/60">
            Monitor contracts and get instant alerts on security changes
          </p>
          <p className="text-xs sm:text-sm text-black/50 dark:text-white/50 mt-1 sm:mt-2">
            {watchlists.length} / {watchlistLimit} contracts
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={watchlists.length >= watchlistLimit}
          className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 text-sm sm:text-base"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Contract</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6 border-red-500/50 bg-red-500/5">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base text-red-600 dark:text-red-400">
                Error
              </p>
              <p className="text-xs sm:text-sm text-red-600/80 dark:text-red-400/80 break-words">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {watchlists.length === 0 && !error && (
        <Card className="p-6 sm:p-8 lg:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-black/40 dark:text-white/40" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-black dark:text-white">
            No Contracts in Watchlist
          </h3>
          <p className="text-sm sm:text-base text-black/60 dark:text-white/60 mb-4 sm:mb-6 max-w-md mx-auto">
            Start monitoring contracts by adding them to your watchlist. You'll
            receive instant alerts when security risks change.
          </p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black text-sm sm:text-base"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Your First Contract</span>
            <span className="sm:hidden">Add Contract</span>
          </Button>
        </Card>
      )}

      {/* Watchlist table */}
      {watchlists.length > 0 && (
        <WatchlistTable watchlists={watchlists} onUpdate={loadWatchlists} />
      )}

      {/* Add dialog */}
      <AddToWatchlistDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={loadWatchlists}
      />
    </div>
  );
}
