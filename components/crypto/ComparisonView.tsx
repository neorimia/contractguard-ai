"use client";

/**
 * Comparison View Component
 *
 * Side-by-side comparison of multiple contracts
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowRight } from "lucide-react";
import { CryptoAudit } from "@/db/schema";

interface ComparisonViewProps {
  onCompare: (addresses: string[]) => void;
  maxContracts?: number;
}

export function ComparisonView({
  onCompare,
  maxContracts = 3,
}: ComparisonViewProps) {
  const [addresses, setAddresses] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  const addAddress = () => {
    if (addresses.length < maxContracts) {
      setAddresses([...addresses, ""]);
    }
  };

  const removeAddress = (index: number) => {
    if (addresses.length > 2) {
      setAddresses(addresses.filter((_, i) => i !== index));
    }
  };

  const updateAddress = (index: number, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  const handleCompare = () => {
    const validAddresses = addresses.filter(
      (addr) => addr.trim() && /^0x[a-fA-F0-9]{40}$/.test(addr)
    );

    if (validAddresses.length < 2) {
      alert("Please enter at least 2 valid contract addresses");
      return;
    }

    onCompare(validAddresses);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Compare Contracts
          </h3>
          <p className="text-sm text-gray-400">
            Analyze multiple contracts side-by-side to compare risk profiles
          </p>
        </div>

        {/* Address Inputs */}
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder={`Contract ${index + 1} address (0x...)`}
                  value={address}
                  onChange={(e) => updateAddress(index, e.target.value)}
                  className="font-mono"
                />
              </div>
              {addresses.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAddress(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {addresses.length < maxContracts && (
            <Button
              variant="outline"
              onClick={addAddress}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Contract
            </Button>
          )}
          <Button
            onClick={handleCompare}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {loading ? "Comparing..." : "Compare Contracts"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 p-3 bg-gray-800/30 rounded-lg">
          💡 <strong>Tip:</strong> Use comparison to evaluate similar tokens or
          check if a contract is a fork of a known scam
        </div>
      </div>
    </Card>
  );
}

interface ComparisonResult {
  address: string;
  result: CryptoAudit & {
    recommendation?: string;
    heuristicResults?: any[];
  };
}

interface ComparisonTableProps {
  results: ComparisonResult[];
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  if (results.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-3 text-gray-400 font-medium">
                Metric
              </th>
              {results.map((r, idx) => (
                <th key={idx} className="text-left p-3 text-white font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">
                      Contract {idx + 1}
                    </span>
                    <code className="text-xs font-mono">
                      {r.address.slice(0, 6)}...{r.address.slice(-4)}
                    </code>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Risk Score */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Risk Score</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3">
                  <span
                    className={`font-bold ${
                      (r.result.riskScore || 0) >= 80
                        ? "text-red-500"
                        : (r.result.riskScore || 0) >= 60
                          ? "text-orange-500"
                          : (r.result.riskScore || 0) >= 40
                            ? "text-yellow-500"
                            : "text-green-500"
                    }`}
                  >
                    {r.result.riskScore || 0}/100
                  </span>
                </td>
              ))}
            </tr>

            {/* Risk Category */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Risk Category</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3">
                  <span className="capitalize text-white">
                    {r.result.riskCategory || "unknown"}
                  </span>
                </td>
              ))}
            </tr>

            {/* Confidence */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Confidence</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3 text-white">
                  {r.result.confidence || 0}%
                </td>
              ))}
            </tr>

            {/* Verified */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Verified</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3">
                  {r.result.isVerified ? (
                    <span className="text-green-500">✓ Yes</span>
                  ) : (
                    <span className="text-red-500">✗ No</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Holders */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Holder Count</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3 text-white">
                  {r.result.holderCount?.toLocaleString() || "N/A"}
                </td>
              ))}
            </tr>

            {/* Concentration */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Top 10 Concentration</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3">
                  <span
                    className={`${
                      (r.result.topHolderConcentration || 0) > 75
                        ? "text-red-500"
                        : (r.result.topHolderConcentration || 0) > 50
                          ? "text-orange-500"
                          : "text-green-500"
                    }`}
                  >
                    {r.result.topHolderConcentration || 0}%
                  </span>
                </td>
              ))}
            </tr>

            {/* Liquidity */}
            <tr className="border-b border-gray-800/50">
              <td className="p-3 text-gray-400">Liquidity</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3 text-white">
                  ${Number(r.result.liquidityUsd || 0).toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Red Flags */}
            <tr>
              <td className="p-3 text-gray-400">Red Flags</td>
              {results.map((r, idx) => (
                <td key={idx} className="p-3">
                  <span className="text-white">
                    {r.result.flags?.length || 0}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
