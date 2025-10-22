"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlertSettingsDialogProps {
  watchlist: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AlertSettingsDialog({
  watchlist,
  open,
  onClose,
  onSuccess,
}: AlertSettingsDialogProps) {
  // Basic settings
  const [nickname, setNickname] = useState(watchlist.nickname || "");
  const [notes, setNotes] = useState(watchlist.notes || "");
  const [alertEnabled, setAlertEnabled] = useState(
    watchlist.alertEnabled ?? true
  );
  const [alertFrequency, setAlertFrequency] = useState(
    watchlist.alertFrequency || "instant"
  );

  // Alert triggers
  const [alertOnRiskIncrease, setAlertOnRiskIncrease] = useState(
    watchlist.alertOnRiskIncrease ?? true
  );
  const [alertOnNewFlags, setAlertOnNewFlags] = useState(
    watchlist.alertOnNewFlags ?? true
  );
  const [alertOnLiquidityChange, setAlertOnLiquidityChange] = useState(
    watchlist.alertOnLiquidityChange ?? false
  );
  const [alertOnHolderChange, setAlertOnHolderChange] = useState(
    watchlist.alertOnHolderChange ?? false
  );

  // Thresholds
  const [riskIncreaseThreshold, setRiskIncreaseThreshold] = useState(
    watchlist.riskIncreaseThreshold || 10
  );
  const [liquidityChangeThreshold, setLiquidityChangeThreshold] = useState(
    watchlist.liquidityChangeThreshold || 20
  );
  const [holderChangeThreshold, setHolderChangeThreshold] = useState(
    watchlist.holderChangeThreshold || 15
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when watchlist changes
  useEffect(() => {
    setNickname(watchlist.nickname || "");
    setNotes(watchlist.notes || "");
    setAlertEnabled(watchlist.alertEnabled ?? true);
    setAlertFrequency(watchlist.alertFrequency || "instant");
    setAlertOnRiskIncrease(watchlist.alertOnRiskIncrease ?? true);
    setAlertOnNewFlags(watchlist.alertOnNewFlags ?? true);
    setAlertOnLiquidityChange(watchlist.alertOnLiquidityChange ?? false);
    setAlertOnHolderChange(watchlist.alertOnHolderChange ?? false);
    setRiskIncreaseThreshold(watchlist.riskIncreaseThreshold || 10);
    setLiquidityChangeThreshold(watchlist.liquidityChangeThreshold || 20);
    setHolderChangeThreshold(watchlist.holderChangeThreshold || 15);
  }, [watchlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/watchlist/${watchlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          notes,
          alertEnabled,
          alertFrequency,
          alertOnRiskIncrease,
          alertOnNewFlags,
          alertOnLiquidityChange,
          alertOnHolderChange,
          riskIncreaseThreshold,
          liquidityChangeThreshold,
          holderChangeThreshold,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        onSuccess();
      } else {
        setError(data.error || "Failed to update watchlist settings");
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      setError("Failed to update watchlist settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Alert Settings
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Customize how you want to be notified about this contract
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">
                Basic
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                Alerts
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-4 sm:space-y-5 mt-4">
              {/* Nickname */}
              <div className="space-y-2">
                <Label htmlFor="nickname-edit" className="text-sm sm:text-base">
                  Nickname
                </Label>
                <Input
                  id="nickname-edit"
                  placeholder="My favorite token"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes-edit" className="text-sm sm:text-base">
                  Notes
                </Label>
                <textarea
                  id="notes-edit"
                  placeholder="Why are you watching this contract?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-transparent border border-black/20 dark:border-white/20 rounded-md text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none text-xs sm:text-sm"
                />
              </div>

              {/* Contract Info (Read-only) */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Contract Address</Label>
                <p className="text-xs sm:text-sm font-mono text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/5 p-2 sm:p-3 rounded-md break-all">
                  {watchlist.contractAddress}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Chain</Label>
                <p className="text-xs sm:text-sm capitalize text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/5 p-2 sm:p-3 rounded-md">
                  {watchlist.chain}
                </p>
              </div>
            </TabsContent>

            {/* Alert Settings Tab */}
            <TabsContent value="alerts" className="space-y-4 sm:space-y-5 mt-4">
              {/* Master Alert Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                <div className="flex-1 pr-3">
                  <Label
                    htmlFor="alert-enabled"
                    className="text-sm sm:text-base font-semibold"
                  >
                    Enable Alerts
                  </Label>
                  <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                    Receive email notifications for this contract
                  </p>
                </div>
                <Switch
                  id="alert-enabled"
                  checked={alertEnabled}
                  onCheckedChange={setAlertEnabled}
                  className="flex-shrink-0"
                />
              </div>

              {alertEnabled && (
                <>
                  {/* Alert Frequency */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="alert-frequency"
                      className="text-sm sm:text-base"
                    >
                      Alert Frequency
                    </Label>
                    <Select
                      value={alertFrequency}
                      onValueChange={setAlertFrequency}
                    >
                      <SelectTrigger
                        id="alert-frequency"
                        className="text-sm sm:text-base"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="instant"
                          className="text-sm sm:text-base"
                        >
                          Instant (recommended)
                        </SelectItem>
                        <SelectItem
                          value="hourly"
                          className="text-sm sm:text-base"
                        >
                          Hourly Summary
                        </SelectItem>
                        <SelectItem
                          value="daily"
                          className="text-sm sm:text-base"
                        >
                          Daily Summary
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Alert Triggers */}
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold">
                      Alert Triggers
                    </Label>

                    {/* Risk Increase */}
                    <div className="space-y-3 p-3 sm:p-4 border border-black/10 dark:border-white/10 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="risk-increase"
                            className="text-sm sm:text-base"
                          >
                            Risk Score Increase
                          </Label>
                          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                            Alert when risk score increases by threshold
                          </p>
                        </div>
                        <Switch
                          id="risk-increase"
                          checked={alertOnRiskIncrease}
                          onCheckedChange={setAlertOnRiskIncrease}
                          className="flex-shrink-0"
                        />
                      </div>
                      {alertOnRiskIncrease && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="risk-threshold"
                            className="text-xs sm:text-sm"
                          >
                            Threshold: +{riskIncreaseThreshold} points
                          </Label>
                          <Slider
                            id="risk-threshold"
                            min={5}
                            max={50}
                            step={5}
                            value={[riskIncreaseThreshold]}
                            onValueChange={(value) =>
                              setRiskIncreaseThreshold(value[0])
                            }
                            className="py-2 sm:py-4"
                          />
                        </div>
                      )}
                    </div>

                    {/* New Flags */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border border-black/10 dark:border-white/10 rounded-lg gap-3">
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor="new-flags"
                          className="text-sm sm:text-base"
                        >
                          New Security Flags
                        </Label>
                        <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                          Alert when new security issues are detected
                        </p>
                      </div>
                      <Switch
                        id="new-flags"
                        checked={alertOnNewFlags}
                        onCheckedChange={setAlertOnNewFlags}
                        className="flex-shrink-0"
                      />
                    </div>

                    {/* Liquidity Change */}
                    <div className="space-y-3 p-3 sm:p-4 border border-black/10 dark:border-white/10 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="liquidity-change"
                            className="text-sm sm:text-base"
                          >
                            Liquidity Change
                          </Label>
                          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                            Alert on significant liquidity changes
                          </p>
                        </div>
                        <Switch
                          id="liquidity-change"
                          checked={alertOnLiquidityChange}
                          onCheckedChange={setAlertOnLiquidityChange}
                          className="flex-shrink-0"
                        />
                      </div>
                      {alertOnLiquidityChange && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="liquidity-threshold"
                            className="text-xs sm:text-sm"
                          >
                            Threshold: ±{liquidityChangeThreshold}%
                          </Label>
                          <Slider
                            id="liquidity-threshold"
                            min={10}
                            max={50}
                            step={5}
                            value={[liquidityChangeThreshold]}
                            onValueChange={(value) =>
                              setLiquidityChangeThreshold(value[0])
                            }
                            className="py-2 sm:py-4"
                          />
                        </div>
                      )}
                    </div>

                    {/* Holder Change */}
                    <div className="space-y-3 p-3 sm:p-4 border border-black/10 dark:border-white/10 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="holder-change"
                            className="text-sm sm:text-base"
                          >
                            Holder Count Change
                          </Label>
                          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                            Alert on significant holder distribution changes
                          </p>
                        </div>
                        <Switch
                          id="holder-change"
                          checked={alertOnHolderChange}
                          onCheckedChange={setAlertOnHolderChange}
                          className="flex-shrink-0"
                        />
                      </div>
                      {alertOnHolderChange && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="holder-threshold"
                            className="text-xs sm:text-sm"
                          >
                            Threshold: ±{holderChangeThreshold}%
                          </Label>
                          <Slider
                            id="holder-threshold"
                            min={10}
                            max={50}
                            step={5}
                            value={[holderChangeThreshold]}
                            onValueChange={(value) =>
                              setHolderChangeThreshold(value[0])
                            }
                            className="py-2 sm:py-4"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Error message */}
          {error && (
            <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 sm:h-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 sm:h-auto text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 w-3 h-3 sm:w-4 sm:h-4 animate-spin rounded-full border-b-2 border-white dark:border-black" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Save Settings</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
