"use client";

import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  number: number | string;
  title: string;
  description: string;
  variant?: "default" | "dark";
  badge?: ReactNode;
  showConnector?: boolean;
  className?: string;
}

export function FeatureCard({
  number,
  title,
  description,
  variant = "default",
  badge,
  showConnector = false,
  className = "",
}: FeatureCardProps) {
  const isDarkVariant = variant === "dark";

  const cardClasses = isDarkVariant
    ? "rounded-xl border border-white/10 dark:border-black/10 bg-white/[0.02] dark:bg-black/[0.02] p-6 transition-all hover:border-white/15 dark:hover:border-black/15 hover:bg-white/[0.04] dark:hover:bg-black/[0.04]"
    : "rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-6 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]";

  const numberBadgeClasses = isDarkVariant
    ? "w-12 h-12 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 flex items-center justify-center text-white dark:text-black font-bold"
    : "w-12 h-12 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white font-bold";

  const titleClasses = isDarkVariant
    ? "text-xl font-semibold tracking-tight text-white dark:text-black mb-2"
    : "text-xl font-semibold tracking-tight text-black dark:text-white mb-2";

  const descriptionClasses = isDarkVariant
    ? "text-sm tracking-tight text-white/70 dark:text-black/70"
    : "text-sm tracking-tight text-black/70 dark:text-white/70";

  return (
    <div className={`relative group ${className}`}>
      <div className={cardClasses}>
        {/* Step Number */}
        <div className="mb-4">
          <div className={`${numberBadgeClasses} mb-3`}>
            <span>{number}</span>
          </div>
        </div>

        {/* Content */}
        <h3 className={titleClasses}>{title}</h3>
        <p className={descriptionClasses}>{description}</p>

        {/* Badge/Highlight */}
        {badge && <div className="mt-4">{badge}</div>}
      </div>

      {/* Connector Arrow */}
      {showConnector && (
        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
          <ArrowRight className="h-4 w-4 text-white/20 dark:text-black/20" />
        </div>
      )}
    </div>
  );
}

