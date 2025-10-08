"use client";

import { cn } from "@/lib/utils";
import { Audit } from "@/db/schema";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";

interface ShareOnXProps {
  result: Audit;
  contractAddress?: string;
}

export default function ShareOnX({ result, contractAddress }: ShareOnXProps) {
  const getRiskEmoji = (score: number) => {
    if (score >= 70) return "🚫";
    if (score >= 40) return "⚠️";
    return "✅";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "HIGH RISK";
    if (score >= 40) return "MEDIUM RISK";
    return "LOW RISK";
  };

  // Create tweet text
  const tweetText = `I just scanned a smart contract with ContractGuard AI!

${getRiskEmoji(result.riskScore || 0)} Risk Score: ${result.riskScore}/100
${result.recommendation === "AVOID" ? "🚫" : result.recommendation === "CAUTION" ? "⚠️" : "✅"} Recommendation: ${result.recommendation}

${result.summary ? result.summary.slice(0, 120) + "..." : ""}

Scan your contracts at`;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent("https://contractguard.ai")}`;

  const handleShare = () => {
    // Track share event
    trackEvent(AnalyticsEvents.RESULT_SHARED, {
      contractAddress: contractAddress || result.contractAddress,
      riskScore: result.riskScore,
      recommendation: result.recommendation,
      platform: "twitter",
    });
  };

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleShare}
      className="inline-block"
    >
      <div
        className={cn(
          "w-full min-w-[300px] max-w-md p-1.5 rounded-2xl relative isolate overflow-hidden",
          "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-900 dark:to-black",
          "border-2 border-gray-200 dark:border-zinc-800",
          "shadow-lg hover:shadow-xl",
          "will-change-transform translate-z-0",
          "hover:scale-[1.02] transition-all duration-200"
        )}
      >
        <div
          className={cn(
            "w-full p-5 rounded-xl relative",
            "bg-white dark:bg-zinc-950",
            "border border-gray-100 dark:border-zinc-900",
            "shadow-sm",
            "will-change-transform translate-z-0"
          )}
        >
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">🛡️</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ContractGuard AI
                    </span>
                    <svg
                      className="h-4 w-4 text-blue-500 dark:text-blue-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    @ContractGuardAI
                  </span>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg p-1 flex items-center justify-center transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1200"
                    height="1227"
                    fill="none"
                    viewBox="0 0 1200 1227"
                    className="w-4 h-4"
                  >
                    <title>Share on X</title>
                    <path
                      fill="currentColor"
                      d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-gray-900 dark:text-white text-base font-medium">
              Security Scan Complete! {getRiskEmoji(result.riskScore || 0)}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Risk Score:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {result.riskScore}/100
                </strong>
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-gray-700 dark:text-gray-300">
                {getRiskLabel(result.riskScore || 0)}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Recommendation:{" "}
              <strong className="text-gray-900 dark:text-white">
                {result.recommendation}
              </strong>
            </p>
            {contractAddress && (
              <p className="text-gray-600 dark:text-gray-400 text-xs font-mono truncate bg-gray-50 dark:bg-zinc-900 px-2 py-1 rounded">
                {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800">
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                Click to share on X
              </span>
              <svg
                className="w-3 h-3 text-gray-500 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
