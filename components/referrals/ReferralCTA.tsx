import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ReferralCTAProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function ReferralCTA({
  title = "Start Earning",
  subtitle = "Join our referral program",
  className = "",
}: ReferralCTAProps) {
  return (
    <div className={cn("max-w-5xl mx-auto px-4 py-12 sm:py-20", className)}>
      <div className="relative">
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Subtle badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2">
              <span className="text-sm font-light text-black/70 dark:text-white/70">
                {subtitle}
              </span>
            </div>
          </div>

          {/* Simplified title */}
          <h2 className="max-w-2xl text-3xl sm:text-4xl md:text-5xl font-light text-black dark:text-white leading-[1.2] tracking-wide mb-8">
            {title}
            <span className="block mt-2 text-black/70 dark:text-white/70">
              Share. Earn. Grow.
            </span>
          </h2>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <a
              href="#top"
              className="w-full sm:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-light transition-all hover:bg-black/90 dark:hover:bg-white/90"
            >
              View Dashboard
            </a>
            <a
              href="https://twitter.com/intent/tweet?text=Check%20out%20ContractGuard%20AI!%20Scan%20smart%20contracts%20for%20scams%20in%20seconds."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3 border border-black/10 dark:border-white/10 text-black dark:text-white rounded-lg font-light transition-all hover:bg-black/5 dark:hover:bg-white/5"
            >
              Share on Twitter
            </a>
          </div>

          {/* Minimal stats grid */}
          <div className="grid grid-cols-3 border-t border-black/5 dark:border-white/5 pt-8 max-w-2xl w-full">
            {[
              { value: "10%", label: "Commission Rate" },
              { value: "Instant", label: "Rewards" },
              { value: "Forever", label: "Your Tier" },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center",
                  i !== 0 && "border-l border-black/5 dark:border-white/5"
                )}
              >
                <span className="text-xl sm:text-2xl font-light text-black dark:text-white mb-1">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-black/50 dark:text-white/50 font-light">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
