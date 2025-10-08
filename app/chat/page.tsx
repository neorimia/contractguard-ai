"use client";

import { useState, useEffect, useRef } from "react";
import { Audit, Issue } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";

// Task sequences for the loading animation
const TASK_SEQUENCES = [
  {
    status: "Fetching contract data",
    lines: [
      "Initializing blockchain connection...",
      "Querying Etherscan API...",
      "Retrieving contract source code...",
      "Validating contract verification...",
      "Fetching transaction history...",
      "Loading complete ✓",
    ],
  },
  {
    status: "Analyzing smart contract",
    lines: [
      "Parsing Solidity code...",
      "Scanning function signatures...",
      "Analyzing contract permissions...",
      "Checking ownership controls...",
      "Reviewing transfer restrictions...",
      "Examining liquidity locks...",
      "Detecting hidden functions...",
      "Analysis complete ✓",
    ],
  },
  {
    status: "AI security assessment",
    lines: [
      "Initializing AI analysis engine...",
      "Scanning for honeypot patterns...",
      "Detecting rug pull indicators...",
      "Checking for scam signatures...",
      "Analyzing code vulnerabilities...",
      "Evaluating risk factors...",
      "Generating security report...",
      "Assessment complete ✓",
    ],
  },
];

const LoadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative w-6 h-6">
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label={`Loading progress: ${Math.round(progress)}%`}
    >
      <title>Loading Progress Indicator</title>

      <defs>
        <mask id="progress-mask">
          <rect width="240" height="240" fill="black" />
          <circle
            r="120"
            cx="120"
            cy="120"
            fill="white"
            strokeDasharray={`${(progress / 100) * 754}, 754`}
            transform="rotate(-90 120 120)"
          />
        </mask>
      </defs>

      <style>
        {`
          @keyframes rotate-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes rotate-ccw {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .g-spin circle {
            transform-origin: 120px 120px;
          }
          .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
          .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
          .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }

          .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
          .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
        `}
      </style>

      <g
        className="g-spin"
        strokeWidth="16"
        strokeDasharray="18% 40%"
        mask="url(#progress-mask)"
      >
        <circle r="150" cx="120" cy="120" stroke="#FF2E7E" opacity="0.95" />
        <circle r="130" cx="120" cy="120" stroke="#00E5FF" opacity="0.95" />
        <circle r="110" cx="120" cy="120" stroke="#4ADE80" opacity="0.95" />
        <circle r="90" cx="120" cy="120" stroke="#FFA726" opacity="0.95" />
        <circle r="70" cx="120" cy="120" stroke="#FFEB3B" opacity="0.95" />
        <circle r="50" cx="120" cy="120" stroke="#FF4081" opacity="0.95" />
      </g>
    </svg>
  </div>
);

function AILoadingState() {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<
    Array<{ text: string; number: number }>
  >([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const lineHeight = 28;

  const currentSequence = TASK_SEQUENCES[sequenceIndex];
  const totalLines = currentSequence.lines.length;

  useEffect(() => {
    const initialLines = [];
    for (let i = 0; i < Math.min(3, totalLines); i++) {
      initialLines.push({
        text: currentSequence.lines[i],
        number: i + 1,
      });
    }
    setVisibleLines(initialLines);
    setScrollPosition(0);
  }, [sequenceIndex, currentSequence.lines, totalLines]);

  // Handle line advancement
  useEffect(() => {
    const advanceTimer = setInterval(() => {
      const firstVisibleLineIndex = Math.floor(scrollPosition / lineHeight);
      const nextLineIndex = (firstVisibleLineIndex + 3) % totalLines;

      if (nextLineIndex < firstVisibleLineIndex && nextLineIndex !== 0) {
        setSequenceIndex(
          (prevIndex) => (prevIndex + 1) % TASK_SEQUENCES.length
        );
        return;
      }

      if (nextLineIndex >= visibleLines.length && nextLineIndex < totalLines) {
        setVisibleLines((prevLines) => [
          ...prevLines,
          {
            text: currentSequence.lines[nextLineIndex],
            number: nextLineIndex + 1,
          },
        ]);
      }

      setScrollPosition((prevPosition) => prevPosition + lineHeight);
    }, 1800);

    return () => clearInterval(advanceTimer);
  }, [
    scrollPosition,
    visibleLines,
    totalLines,
    sequenceIndex,
    currentSequence.lines,
    lineHeight,
  ]);

  // Apply scroll position
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const progress = ((sequenceIndex + 1) / TASK_SEQUENCES.length) * 100;

  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="space-y-6 w-full max-w-2xl px-4">
        <div className="flex items-center justify-center space-x-3 text-white dark:text-black">
          <LoadingAnimation progress={progress} />
          <span className="text-lg font-medium">
            {currentSequence.status}...
          </span>
        </div>

        <div className="relative bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-xl overflow-hidden">
          <div
            ref={codeContainerRef}
            className="font-mono text-sm overflow-hidden w-full h-[84px] relative"
            style={{ scrollBehavior: "smooth" }}
          >
            <div>
              {visibleLines.map((line) => (
                <div
                  key={`${line.number}-${line.text}`}
                  className="flex h-[28px] items-center px-4"
                >
                  <div className="text-white/40 dark:text-black/40 pr-4 select-none w-8 text-right font-light">
                    {line.number}
                  </div>
                  <div className="text-white/90 dark:text-black/90 flex-1">
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 100%)",
            }}
          />
        </div>

        <div className="flex items-center justify-center space-x-2 text-white/60 dark:text-black/60 text-sm">
          <Shield className="h-4 w-4" />
          <span>AI-powered security analysis in progress</span>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Audit | null>(null);
  const [error, setError] = useState("");

  const analyzeContract = async () => {
    if (!address) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: address,
          chain: "ethereum",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
      <div className="relative bg-white/95 dark:bg-black/5 pt-14">
        <Header />

        {/* Hero Section */}
        <section className="min-h-[calc(100vh-5.5rem)] flex flex-col justify-center py-6 sm:py-10 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
          <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 px-4">
            {/* Main Content */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white dark:text-black">
              Scan smart contracts{" "}
              <span className="bg-gradient-to-r from-white to-white/70 dark:from-black dark:to-black/70 bg-clip-text text-transparent">
                in seconds
              </span>
            </h1>
            <p className="text-base sm:text-lg tracking-tight text-white/60 dark:text-black/60 max-w-2xl mx-auto">
              AI-powered security analysis that detects scams, honeypots, and
              rug pulls. Get instant results in plain English.
            </p>

            {/* Input Section or Loading State */}
            {loading ? (
              <div className="max-w-2xl mx-auto mt-8">
                <AILoadingState />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-2xl p-6">
                  <label className="block text-sm font-medium text-white/80 dark:text-black/80 mb-3">
                    Contract Address
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && address && !loading) {
                          analyzeContract();
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-white/5 dark:bg-black/5 border border-white/20 dark:border-black/20 rounded-lg text-white dark:text-black placeholder-white/50 dark:placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                      disabled={loading}
                    />
                    <Button
                      onClick={analyzeContract}
                      disabled={loading || !address}
                      size="lg"
                      className="px-6 py-3 bg-white/95 dark:bg-black text-black dark:text-white hover:bg-white dark:hover:bg-black transition-all duration-300"
                    >
                      SCAN CONTRACT
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <p className="text-red-200 dark:text-red-800 text-sm">
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        {result && <ResultsDisplay result={result} />}

        <Footer />
      </div>
    </main>
  );
}

// Results Component
function ResultsDisplay({ result }: { result: Audit }) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-orange-500";
    return "text-green-500";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "HIGH RISK";
    if (score >= 40) return "MEDIUM RISK";
    return "LOW RISK";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 70) return <AlertTriangle className="h-6 w-6 text-red-500" />;
    if (score >= 40)
      return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const criticalIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "CRITICAL") || [];
  const highIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "HIGH") || [];
  const mediumIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "MEDIUM") || [];

  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            Security Analysis{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
              Results
            </span>
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Comprehensive analysis of the smart contract with detailed security
            insights.
          </p>
        </div>

        {/* Risk Score Card */}
        <div className="bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-black dark:text-white">
              Risk Assessment
            </h3>
            <Button
              onClick={() =>
                navigator.share?.({
                  title: "Contract Analysis",
                  text: result.summary || "",
                })
              }
              variant="outline"
              size="sm"
              className="bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20"
            >
              📤 Share Results
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Risk Score */}
            <div className="text-center p-6 bg-white/20 dark:bg-black/20 rounded-xl">
              <div className="flex items-center justify-center mb-4">
                {getRiskIcon(result.riskScore || 0)}
              </div>
              <div
                className={`text-6xl font-bold ${getRiskColor(result.riskScore || 0)} mb-2`}
              >
                {result.riskScore}
              </div>
              <div className="text-black/70 dark:text-white/70 font-medium">
                {getRiskLabel(result.riskScore || 0)}
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col justify-center p-6 bg-white/20 dark:bg-black/20 rounded-xl">
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {result.recommendation === "AVOID" && "🚫"}
                  {result.recommendation === "CAUTION" && "⚠️"}
                  {result.recommendation === "BUY" && "✅"}
                </div>
                <div className="text-2xl font-semibold text-black dark:text-white">
                  {result.recommendation}
                </div>
                <div className="text-sm text-black/60 dark:text-white/60 mt-2">
                  Recommendation
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-6 bg-white/10 dark:bg-black/10 rounded-xl">
            <h4 className="text-lg font-semibold text-black dark:text-white mb-3">
              Analysis Summary
            </h4>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>

        {/* Issues Grid */}
        <div className="grid gap-6">
          {criticalIssues.length > 0 && (
            <IssuesSection
              title="Critical Issues"
              issues={criticalIssues}
              color="red"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          )}

          {highIssues.length > 0 && (
            <IssuesSection
              title="High Severity"
              issues={highIssues}
              color="orange"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          )}

          {mediumIssues.length > 0 && (
            <IssuesSection
              title="Medium Severity"
              issues={mediumIssues}
              color="yellow"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          )}
        </div>

        {/* Contract Info */}
        <div className="bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
            Contract Details
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/20 dark:bg-black/20 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm text-black/60 dark:text-white/60 mb-1">
                Holders
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {result.holderCount || "N/A"}
              </div>
            </div>
            <div className="text-center p-4 bg-white/20 dark:bg-black/20 rounded-lg">
              <div className="text-2xl mb-2">💧</div>
              <div className="text-sm text-black/60 dark:text-white/60 mb-1">
                Liquidity
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {result.liquidity || "N/A"}
              </div>
            </div>
            <div className="text-center p-4 bg-white/20 dark:bg-black/20 rounded-lg">
              <div className="text-2xl mb-2">
                {result.isVerified ? "✅" : "❌"}
              </div>
              <div className="text-sm text-black/60 dark:text-white/60 mb-1">
                Verified
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {result.isVerified ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Issues Section Component
function IssuesSection({
  title,
  issues,
  color,
  icon,
}: {
  title: string;
  issues: Issue[];
  color: "red" | "orange" | "yellow";
  icon: React.ReactNode;
}) {
  const colorClasses = {
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50",
    orange:
      "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/50",
    yellow:
      "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50",
  };

  const textColorClasses = {
    red: "text-red-800 dark:text-red-200",
    orange: "text-orange-800 dark:text-orange-200",
    yellow: "text-yellow-800 dark:text-yellow-200",
  };

  return (
    <div className="bg-gradient-to-br from-white/50 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-xl font-semibold text-black dark:text-white">
          {title}
        </h3>
        <span className="text-sm text-black/60 dark:text-white/60 bg-white/20 dark:bg-black/20 px-2 py-1 rounded-full">
          {issues.length} issue{issues.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-4">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border ${colorClasses[color]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className={`font-semibold ${textColorClasses[color]}`}>
                {issue.type}
              </h4>
              <span className="text-xs px-2 py-1 bg-white/30 dark:bg-black/30 rounded text-black/70 dark:text-white/70">
                {issue.severity}
              </span>
            </div>
            <p className="text-black/70 dark:text-white/70 text-sm mb-3">
              {issue.description}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/60 dark:text-white/60">💡</span>
              <span className="text-black/60 dark:text-white/60">Impact:</span>
              <span className={`font-medium ${textColorClasses[color]}`}>
                {issue.impact}
              </span>
            </div>
            {issue.code && (
              <pre className="mt-4 p-3 bg-white/50 dark:bg-black/50 rounded text-xs text-black/80 dark:text-white/80 overflow-x-auto border border-white/20 dark:border-black/20">
                {issue.code}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
