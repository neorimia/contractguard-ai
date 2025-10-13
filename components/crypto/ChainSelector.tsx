"use client";

/**
 * Chain Selector Component
 *
 * Multi-chain dropdown selector for crypto analysis
 */

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Chain {
  id: string;
  name: string;
  icon?: string;
}

const SUPPORTED_CHAINS: Chain[] = [
  { id: "ethereum", name: "Ethereum", icon: "⟠" },
  { id: "bsc", name: "BNB Chain", icon: "💎" },
  { id: "polygon", name: "Polygon", icon: "⬡" },
  { id: "arbitrum", name: "Arbitrum", icon: "🔷" },
];

interface ChainSelectorProps {
  value: string;
  onChange: (chain: string) => void;
  className?: string;
}

export function ChainSelector({
  value,
  onChange,
  className,
}: ChainSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedChain =
    SUPPORTED_CHAINS.find((c) => c.id === value.toLowerCase()) ||
    SUPPORTED_CHAINS[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            {selectedChain.icon && (
              <span className="text-lg">{selectedChain.icon}</span>
            )}
            <span>{selectedChain.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {SUPPORTED_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => {
              onChange(chain.id);
              setOpen(false);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {chain.icon && <span className="text-lg">{chain.icon}</span>}
                <span>{chain.name}</span>
              </div>
              {selectedChain.id === chain.id && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
