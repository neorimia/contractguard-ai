import { Button } from "@/components/ui/button";

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-left space-y-4 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            AI-powered security analysis{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
              in seconds
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl">
            Get instant, plain English security analysis that detects scams,
            honeypots, and rug pulls before you invest.
          </p>
        </div>

        {/* Row One: Image on left, content on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left: Security Analysis Demo */}
          <div className="relative h-full min-h-[300px] rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/50 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Security Alert
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Honeypot detected
              </p>
              <div className="text-xs text-red-500 dark:text-red-400">
                Only owner can sell
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex flex-col justify-center space-y-6">
            <h3 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
              Instant security analysis
            </h3>
            <p className="text-base text-black/70 dark:text-white/70">
              <span className="font-semibold ml-12">AI-Powered Detection</span>{" "}
              analyzes smart contracts in seconds, detecting honeypots, rug
              pulls, and scams with plain English explanations that anyone can
              understand.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                className="h-6 group text-white dark:text-black bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90"
              >
                Try it now
                <span className="ml-2 transition-transform group-hover:translate-x-1 h-1 w-1 rounded-full bg-current" />
              </Button>
            </div>
          </div>
        </div>

        {/* Row Two: Content on left, image on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left: Content */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
              Comprehensive security coverage
            </h3>
            <p className="text-base text-black/70 dark:text-white/70">
              Our AI analyzes multiple security vectors including contract code,
              liquidity patterns, and holder distribution to provide complete
              risk assessment.
            </p>

            {/* Two cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 border border-black/15 dark:border-white/15 rounded-xl p-1">
              {/* Card 1 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                <h4 className="text-lg font-medium text-black dark:text-white mb-2">
                  Honeypot Detection
                </h4>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Identify contracts that trap users and prevent selling with
                  advanced pattern recognition.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                <h4 className="text-lg font-medium text-black dark:text-white mb-2">
                  Rug Pull Analysis
                </h4>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Detect contracts designed to drain liquidity and identify
                  potential rug pull schemes.
                </p>
              </div>
            </div>

            {/* Additional title and subtitle below cards */}
            <div className="flex items-center gap-2">
              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                  10s
                </h4>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Analysis time
                </p>
              </div>
              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                  99%
                </h4>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Accuracy rate
                </p>
              </div>

              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                  5k+
                </h4>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Contracts scanned
                </p>
              </div>
            </div>
          </div>

          {/* Right: Security Success Demo */}
          <div className="relative h-full min-h-[300px] rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50 flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Security Passed
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                No issues detected
              </p>
              <div className="text-xs text-green-500 dark:text-green-400">
                Safe to invest
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
