"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, ExternalLink, Bell, BellOff } from "lucide-react";
import { AlertSettingsDialog } from "./AlertSettingsDialog";

interface WatchlistTableProps {
  watchlists: any[];
  onUpdate: () => void;
}

export function WatchlistTable({ watchlists, onUpdate }: WatchlistTableProps) {
  const [selectedWatchlist, setSelectedWatchlist] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this contract from your watchlist?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.status === "success") {
        onUpdate();
      } else {
        alert(data.error || "Failed to remove from watchlist");
      }
    } catch (error) {
      console.error("Error deleting watchlist:", error);
      alert("Failed to remove from watchlist");
    } finally {
      setDeletingId(null);
    }
  };

  const getRiskBadge = (riskScore: number | null) => {
    if (riskScore === null || riskScore === undefined) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          No Data
        </Badge>
      );
    }

    if (riskScore >= 70) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-500/10 text-red-600 dark:text-red-400"
        >
          High Risk
        </Badge>
      );
    }
    if (riskScore >= 40) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
        >
          Medium Risk
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-600 dark:text-green-400"
      >
        Low Risk
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {watchlists.map(({ watchlist, latestAudit }) => (
          <Card
            key={watchlist.id}
            className="p-6 hover:shadow-lg transition-shadow w-full "
          >
            <div className="flex flex-col md:flex-row justify-between items-start">
              {/* Left side - Contract info */}
              <div className="flex-1 max-w-full">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-black dark:text-white">
                    {watchlist.nickname ||
                      `Contract ${watchlist.contractAddress.slice(0, 8)}...`}
                  </h3>
                  {latestAudit && getRiskBadge(latestAudit.riskScore)}
                  {watchlist.alertEnabled ? (
                    <Bell className="w-4 h-4 text-green-500" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <p className="text-sm text-black/50 dark:text-white/50 font-mono mb-3 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                  {watchlist.contractAddress}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-black/60 dark:text-white/60">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Chain:</span>
                    <span className="capitalize">{watchlist.chain}</span>
                  </span>
                  {latestAudit && (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Risk Score:</span>
                        <span>{latestAudit.riskScore}/100</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Flags:</span>
                        <span>{latestAudit.flags?.length || 0}</span>
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Last Alert:</span>
                    <span>{formatDate(watchlist.lastAlertSent)}</span>
                  </span>
                </div>

                {watchlist.notes && (
                  <p className="text-sm text-black/60 dark:text-white/60 mt-3 italic">
                    {watchlist.notes}
                  </p>
                )}

                {/* Alert configuration summary */}
                {watchlist.alertEnabled && (
                  <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                    <p className="text-xs text-black/50 dark:text-white/50">
                      Alerts: {watchlist.alertFrequency} •{" "}
                      {watchlist.alertOnRiskIncrease && "Risk changes"}{" "}
                      {watchlist.alertOnNewFlags && "• New flags"}{" "}
                      {watchlist.alertOnLiquidityChange && "• Liquidity"}{" "}
                      {watchlist.alertOnHolderChange && "• Holder count"}
                    </p>
                  </div>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="flex gap-2 max-w-full">
                {/* TODO: ADD a history page with all audits */}
                {/* {latestAudit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                  >
                    <a
                      href={`/crypto/audit?address=${watchlist.contractAddress}&chain=${watchlist.chain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )} */}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWatchlist(watchlist);
                    setShowSettings(true);
                  }}
                  className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(watchlist.id)}
                  disabled={deletingId === watchlist.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                >
                  {deletingId === watchlist.id ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-600" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Settings dialog */}
      {showSettings && selectedWatchlist && (
        <AlertSettingsDialog
          watchlist={selectedWatchlist}
          open={showSettings}
          onClose={() => {
            setShowSettings(false);
            setSelectedWatchlist(null);
          }}
          onSuccess={() => {
            setShowSettings(false);
            setSelectedWatchlist(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
