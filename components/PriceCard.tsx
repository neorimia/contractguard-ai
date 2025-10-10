/**
 * Reusable Price Card Component
 *
 * Unified card design for both Instant Reports and Subscriptions
 */

"use client";

import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { ReactNode } from "react";

interface PriceCardProps {
  // Card appearance
  isPopular?: boolean;
  animationDelay?: number;

  // Header content (for instant reports)
  credits?: number;
  savings?: string | null;

  // Header content (for subscriptions)
  title?: string;
  description?: string;

  // Price
  price: number;
  priceLabel?: string; // e.g., "/month", "/year", or custom
  subPrice?: {
    value: number;
    label: string; // e.g., "per report"
  };
  saveNote?: string; // e.g., "Billed annually • Save $69.60/year"

  // Features/Perks
  perks: readonly string[];

  // Button
  buttonText: string;
  buttonLoading?: boolean;
  onButtonClick: () => void;
  buttonDisabled?: boolean;

  // Custom content (optional)
  headerContent?: ReactNode;
}

export function PriceCard({
  isPopular = false,
  animationDelay = 0,
  credits,
  savings,
  title,
  description,
  price,
  priceLabel,
  subPrice,
  saveNote,
  perks,
  buttonText,
  buttonLoading = false,
  onButtonClick,
  buttonDisabled = false,
  headerContent,
}: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: animationDelay,
      }}
      className={`relative rounded-lg overflow-hidden group transition-all duration-300 hover:translate-y-[-1px] ${
        isPopular
          ? "backdrop-blur-sm bg-black/5 dark:bg-white/5 border border-black/30 dark:border-white/30"
          : "backdrop-blur-sm bg-black/[0.01] dark:bg-white/[0.01] border border-dashed border-black/5 dark:border-white/5"
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 right-5">
          <div className="px-2 py-0.5 text-[10px] font-medium text-white dark:text-black bg-black dark:bg-white rounded-b">
            Most Popular
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Header - Credits (for instant) */}
        {credits !== undefined && (
          <div className="flex justify-between items-center text-left mb-4">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-semibold text-black dark:text-white mb-1">
                {credits}
              </div>
              <div className="text-xs text-black/70 dark:text-white/70">
                {credits === 1 ? "Report" : "Reports"}
              </div>
            </div>

            {savings && (
              <Badge
                variant="outline"
                className="mt-2 bg-green-50 text-green-700 border-green-300"
              >
                {savings}
              </Badge>
            )}
          </div>
        )}

        {/* Header - Title/Description (for subscriptions) */}
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-black/70 dark:text-white/70">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Custom Header Content */}
        {headerContent}

        {/* Price Section */}
        <div className="text-left mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-semibold text-black dark:text-white">
              <NumberFlow
                value={price}
                format={{
                  style: "currency",
                  currency: "USD",
                }}
              />
            </span>
            {priceLabel && (
              <span className="ml-1 text-xs text-black/70 dark:text-white/70">
                {priceLabel}
              </span>
            )}
          </div>

          {/* Sub Price (e.g., per report) */}
          {subPrice && (
            <div className="text-xs text-black/60 dark:text-white/60 mt-1">
              <NumberFlow
                value={subPrice.value}
                format={{
                  style: "currency",
                  currency: "USD",
                }}
              />{" "}
              {subPrice.label}
            </div>
          )}

          {/* Save Note (for yearly) */}
          {saveNote && (
            <p className="mt-1 text-[10px] text-black/60 dark:text-white/60">
              {saveNote}
            </p>
          )}
        </div>

        {/* Features/Perks */}
        <div className="space-y-2 mb-4 sm:mb-6">
          {perks.map((perk, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="h-3 w-3 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-black/80 dark:text-white/80">
                {perk}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onButtonClick}
          disabled={buttonDisabled}
          className={`w-full h-9 text-sm ${
            isPopular
              ? "bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90"
              : "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10"
          }`}
        >
          {buttonLoading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
