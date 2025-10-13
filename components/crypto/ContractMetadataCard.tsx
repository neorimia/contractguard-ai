"use client";

import { ContractMetadata } from "@/db/schema";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  User,
  Calendar,
} from "lucide-react";

interface ContractMetadataCardProps {
  metadata?: ContractMetadata;
  isVerified: boolean;
  chain: string;
  address: string;
}

export function ContractMetadataCard({
  metadata,
  isVerified,
  chain,
  address,
}: ContractMetadataCardProps) {
  const getExplorerUrl = (chain: string, address: string) => {
    const explorers: Record<string, string> = {
      ethereum: "https://etherscan.io",
      bsc: "https://bscscan.com",
    };
    return `${explorers[chain] || explorers.ethereum}/address/${address}`;
  };

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <div className="flex items-center gap-3">
        {isVerified ? (
          <>
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-500">Contract Verified</p>
              <p className="text-sm text-neutral-400">
                Source code is publicly available
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-500">
                Contract Not Verified
              </p>
              <p className="text-sm text-neutral-400">
                Source code is not available
              </p>
            </div>
          </>
        )}
      </div>

      {/* Deployer Info */}
      {metadata?.deployer && (
        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Deployer</span>
          </div>
          <div className="font-mono text-sm break-all">{metadata.deployer}</div>
        </div>
      )}

      {/* Deploy Date */}
      {metadata?.deployDate && (
        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Deployed</span>
          </div>
          <div className="text-sm">
            {new Date(metadata.deployDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}

      {/* Transaction Count */}
      {metadata?.txCount !== undefined && (
        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm font-medium">Transactions</span>
          </div>
          <div className="text-sm">{metadata.txCount.toLocaleString()}</div>
        </div>
      )}

      {/* Compiler Info */}
      {metadata?.compiler && (
        <div className="p-4 bg-neutral-800/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-sm font-medium">Compiler</span>
          </div>
          <div className="text-sm font-mono">{metadata.compiler}</div>
        </div>
      )}

      {/* Explorer Link */}
      <a
        href={getExplorerUrl(chain, address)}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex items-center justify-center gap-2 w-full
          p-4 bg-neutral-800 hover:bg-neutral-700
          rounded-lg transition-colors
        "
      >
        <span className="font-medium">View on Explorer</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
