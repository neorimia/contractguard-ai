"use client";

/**
 * Token Search Input Component
 *
 * Provides token search functionality with:
 * - Debounced search (300ms)
 * - Keyboard navigation
 * - Loading states
 * - Error handling
 * - Chain filtering
 * - Image URL security validation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { TOKEN_SEARCH_CONFIG } from "@/lib/services/token-search.config";

// Security: Allowlist of trusted image domains
const TRUSTED_IMAGE_DOMAINS =
  TOKEN_SEARCH_CONFIG.SECURITY.ALLOWED_IMAGE_DOMAINS;

/**
 * Validates image URL against trusted domains
 * Security: Prevents XSS via malicious image URLs
 */
function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS
    if (parsedUrl.protocol !== "https:") return false;

    // Check if domain is in allowlist
    return TRUSTED_IMAGE_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

export interface TokenSearchResult {
  name: string;
  symbol: string;
  address: string;
  chain: string;
  logoUrl?: string;
  marketCap?: number;
  liquidity?: string;
  verified: boolean;
}

interface TokenSearchInputProps {
  onSelect: (result: TokenSearchResult) => void;
  defaultChain?: string;
  placeholder?: string;
  className?: string;
}

export function TokenSearchInput({
  onSelect,
  defaultChain,
  placeholder = "Search token by name (e.g., PEPE, SHIB)",
  className,
}: TokenSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Track search started
      trackEvent(AnalyticsEvents.TOKEN_SEARCH_STARTED, {
        query: searchQuery,
        chain: defaultChain || "all",
      });

      try {
        const params = new URLSearchParams({
          q: searchQuery,
        });

        if (defaultChain) {
          params.append("chain", defaultChain);
        }

        const response = await fetch(
          `/api/tokens/search?${params.toString()}`,
          {
            signal: abortControllerRef.current.signal,
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Search failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        if (data.status === "success" && data.data) {
          setResults(data.data);
          setOpen(data.data.length > 0);

          // Track search completed
          trackEvent(AnalyticsEvents.TOKEN_SEARCH_COMPLETED, {
            query: searchQuery,
            chain: defaultChain || "all",
            resultsCount: data.data.length,
            source: data.meta?.source,
            cached: data.meta?.cached,
          });
        } else {
          throw new Error(data.error || "Search failed");
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            // Request was cancelled, ignore
            return;
          }
          setError(err.message);

          // Track search failed
          trackEvent(AnalyticsEvents.TOKEN_SEARCH_FAILED, {
            query: searchQuery,
            chain: defaultChain || "all",
            error: err.message,
          });
        } else {
          setError("An unexpected error occurred");
        }
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [defaultChain],
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, TOKEN_SEARCH_CONFIG.QUERY.DEBOUNCE_MS);
    },
    [performSearch],
  );

  // Handle token selection
  const handleSelect = useCallback(
    (result: TokenSearchResult) => {
      onSelect(result);
      setOpen(false);
      setQuery("");
      setResults([]);
    },
    [onSelect],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Format market cap for display
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
    } else if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(2)}M`;
    } else if (marketCap >= 1_000) {
      return `$${(marketCap / 1_000).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  // Get chain badge color
  const getChainBadge = (chain: string): { label: string; icon: string } => {
    const chains: Record<string, { label: string; icon: string }> = {
      ethereum: { label: "ETH", icon: "⟠" },
      bsc: { label: "BSC", icon: "💎" },
      polygon: { label: "MATIC", icon: "⬡" },
      base: { label: "Base", icon: "🔵" },
      arbitrum: { label: "ARB", icon: "🔷" },
      optimism: { label: "OP", icon: "🔴" },
      avalanche: { label: "AVAX", icon: "🔺" },
    };
    return (
      chains[chain.toLowerCase()] || { label: chain.toUpperCase(), icon: "🔗" }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-9
                  bg-neutral-950 border-neutral-800 text-white
                  placeholder:text-neutral-500 font-mono
                  focus-visible:ring-white focus-visible:ring-1
                  h-12"
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {error && !loading && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {loading && (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {!loading && results.length === 0 && query.length >= 2 && (
              <CommandEmpty>
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">
                    No tokens found for &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Try searching by contract address instead
                  </p>
                </div>
              </CommandEmpty>
            )}

            {!loading && error && (
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Please enter the contract address manually
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <CommandGroup heading="Search Results">
                {results.map((result, index) => {
                  const chainInfo = getChainBadge(result.chain);
                  return (
                    <CommandItem
                      key={`${result.address}-${result.chain}-${index}`}
                      value={`${result.name} ${result.symbol} ${result.address}`}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        {/* Left: Token info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isValidImageUrl(result.logoUrl) && (
                            <img
                              src={result.logoUrl}
                              alt={result.symbol}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {result.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {result.symbol} • {result.address.slice(0, 6)}...
                              {result.address.slice(-4)}
                            </div>
                          </div>
                        </div>

                        {/* Right: Metadata */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="font-normal">
                            <span className="mr-1">{chainInfo.icon}</span>
                            {chainInfo.label}
                          </Badge>
                          {result.marketCap && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatMarketCap(result.marketCap)}
                            </span>
                          )}
                          {result.verified && (
                            <span className="text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
