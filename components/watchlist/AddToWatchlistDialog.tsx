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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus } from "lucide-react";

interface AddToWatchlistDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: {
    contractAddress?: string;
    chain?: string;
  };
}

export function AddToWatchlistDialog({
  open,
  onClose,
  onSuccess,
  defaultValues,
}: AddToWatchlistDialogProps) {
  const [contractAddress, setContractAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [nickname, setNickname] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default values if provided
  useEffect(() => {
    if (defaultValues) {
      if (defaultValues.contractAddress) {
        setContractAddress(defaultValues.contractAddress);
      }
      if (defaultValues.chain) {
        setChain(defaultValues.chain);
      }
    }
  }, [defaultValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate contract address
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Please enter a valid contract address");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress,
          chain,
          nickname,
          notes,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        // Reset form
        setContractAddress("");
        setChain("ethereum");
        setNickname("");
        setNotes("");
        setError(null);

        // Close dialog and refresh
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to add contract to watchlist");
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      setError("Failed to add contract to watchlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContractAddress("");
      setChain("ethereum");
      setNickname("");
      setNotes("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Add Contract to Watchlist
          </DialogTitle>
          <DialogDescription>
            Monitor this contract and receive alerts when security risks change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Contract Address */}
          <div className="space-y-2">
            <Label htmlFor="contract-address">
              Contract Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contract-address"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          {/* Chain */}
          <div className="space-y-2">
            <Label htmlFor="chain">
              Chain <span className="text-red-500">*</span>
            </Label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger id="chain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
                <SelectItem value="optimism">Optimism</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nickname (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="nickname">
              Nickname <span className="text-sm text-black/50 dark:text-white/50">(optional)</span>
            </Label>
            <Input
              id="nickname"
              placeholder="My favorite token"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-sm text-black/50 dark:text-white/50">(optional)</span>
            </Label>
            <textarea
              id="notes"
              placeholder="Why are you watching this contract?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-transparent border border-black/20 dark:border-white/20 rounded-md text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none text-sm"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !contractAddress}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 w-4 h-4 animate-spin rounded-full border-b-2 border-white dark:border-black" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}