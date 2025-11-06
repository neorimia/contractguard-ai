"use client";

import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import Anthropic from "@/components/icons/anthropic";
import Deepseek from "@/components/icons/deepseek";
import Gemini from "@/components/icons/gemini";
import Mistral from "@/components/icons/mistral";
import OpenAI from "@/components/icons/open-ai";
import OpenAIDark from "./icons/open-ai-dark";
import AnthropicDark from "./icons/anthropic-dark";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const [activeAgentIndex, setActiveAgentIndex] = useState(2); // Start with Research Assistant active
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [autoRotate, setAutoRotate] = useState(true); // Track if automatic rotation should continue
  const router = useRouter();

  useEffect(() => {
    if (!autoRotate) return; // Skip setting up interval if autoRotate is false

    const interval = setInterval(() => {
      setActiveAgentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 4;
        setDirection(1); // Moving forward/right
        return nextIndex;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [autoRotate]); // Add autoRotate to dependency array

  // Security analysis types with colors
  const analysisTypes = [
    {
      name: "Honeypot Detection",
      color: "#FF3366",
    },
    {
      name: "Rug Pull Analysis",
      color: "#8B5CF6",
    },
    {
      name: "Scam Detection",
      color: "#3B82F6",
    },
    {
      name: "Security Audit",
      color: "#F97316", // Orange-500 from Tailwind color palette
    },
  ];

  // Handle manual selection with direction
  const handleAnalysisSelect = (index: number) => {
    if (index !== activeAgentIndex) {
      setDirection(index > activeAgentIndex ? 1 : -1);
      setActiveAgentIndex(index);
      setAutoRotate(false); // Stop automatic rotation when user selects an analysis type
    }
  };

  // Shared transition settings
  const sharedTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

  return (
    <section className="min-h-[calc(100vh-5.5rem)] flex flex-col justify-center py-6 sm:py-10 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
      <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 px-4">
        {/* Main Content (Title, Desc, Buttons) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white dark:text-black">
          Never get rugged{" "}
          <span className="bg-gradient-to-r from-white to-white/70 dark:from-black dark:to-black/70 bg-clip-text text-transparent">
            again.
          </span>
        </h1>
        <p className="text-base sm:text-lg tracking-tight text-white/60 dark:text-black/60 max-w-2xl mx-auto">
          AI scans any contract in 10 seconds across 5+ EVM chains with
          plain-English risk flags so you can decide fast.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:pt-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="rounded-xl p-1 border dark:border-black/30 border-white/30 dark:hover:border-black/50 hover:border-white/50 transition-all duration-300">
            <Button
              size="lg" 
              onClick={() => router.push("/audit")}
              className="dark:text-white text-black tracking-tight group bg-white/95 dark:bg-black rounded-lg hover:bg-white dark:hover:bg-black transition-all duration-300"
            >
              Scan my contract Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
           
          </div>
          <Button
              size="lg"
              onClick={() => router.push("/how-it-works")}
              variant="outline"
              className="text-white dark:text-black tracking-tight group bg-black dark:bg-white/95 rounded-lg dark:hover:bg-white hover:bg-black/90 hover:text-white dark:hover:text-black transition-all duration-300"
            >
              See how it works
              </Button>
            </div>
          <p className="text-sm text-white/70 dark:text-black/70 text-center">
            <span className="font-medium">Free, no card required</span> • Scan
            up to 3 contracts daily
          </p>
        </div>

        {/* Cards Section with Connector */}
        <div className="mt-12 sm:mt-16 relative">
          {/* Parent Card Container */}
          <div className="max-w-[900px] mx-auto p-4 sm:p-8 rounded-2xl relative backdrop-blur-sm border border-white/[0.05] dark:border-black/[0.05] bg-gradient-to-b from-white/[0.05] to-white/[0.02] dark:from-black/[0.05] dark:to-black/[0.02]">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-medium bg-gradient-to-br from-white to-white/70 dark:from-black dark:to-black/70 bg-clip-text text-transparent mb-6 sm:mb-8">
              Security analysis powered by AI
            </h3>

            {/* Cards Container */}
            <div className="flex flex-col sm:flex-row justify-center items-center  gap-6 sm:gap-x-32">
              {/* Card 1: Models Overview */}
              <div className="w-full sm:w-72 p-5 rounded-xl relative group/card backdrop-blur-sm border border-white/[0.05] dark:border-black/[0.05] bg-gradient-to-b from-white/[0.08] to-white/[0.02] dark:from-black/[0.08] dark:to-black/[0.02]">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />

                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white dark:text-black">
                    Analysis Types
                  </h4>
                  <div className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 dark:bg-black/10 text-white/80 dark:text-black/80 border border-white/10 dark:border-black/10">
                    Select Type
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Analysis Type Selector Items */}
                  {analysisTypes.map((analysisType, index) => (
                    <motion.button
                      key={analysisType.name}
                      className={`w-full text-left flex items-center gap-x-2 p-2 rounded-lg relative group cursor-pointer
                                                ${
                                                  index === activeAgentIndex
                                                    ? "bg-white/[0.03] dark:bg-black/[0.03] border border-white/5 dark:border-black/5"
                                                    : "border border-transparent"
                                                }
                                                hover:bg-white/[0.04] dark:hover:bg-black/[0.04] transition-all duration-300
                                            `}
                      onClick={() => handleAnalysisSelect(index)}
                      aria-pressed={index === activeAgentIndex}
                      type="button"
                    >
                      {/* Dot indicator */}
                      <motion.div
                        className="w-1 h-1 rounded-xl shrink-0 bg-white/20 dark:bg-black/20"
                        style={{
                          backgroundColor:
                            index === activeAgentIndex
                              ? analysisType.color
                              : undefined,
                        }}
                        animate={{
                          scale: index === activeAgentIndex ? 1.2 : 1,
                        }}
                        transition={sharedTransition}
                      />

                      {/* Analysis type name */}
                      <div className="flex-1 overflow-hidden">
                        <motion.span
                          className="text-xs block truncate text-white/80 dark:text-black/80 hover:text-white dark:hover:text-black"
                          transition={sharedTransition}
                        >
                          {analysisType.name}
                        </motion.span>
                      </div>

                      {/* Border & Underline effects */}
                      <motion.div
                        className="absolute -inset-px rounded-lg border pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: index === activeAgentIndex ? 1 : 0,
                        }}
                        style={{
                          borderColor: `${analysisType.color}20`,
                        }}
                        transition={sharedTransition}
                      />

                      <motion.div
                        className="absolute left-0 right-0 bottom-0 h-px pointer-events-none"
                        style={{
                          backgroundImage: `linear-gradient(to right, transparent, ${analysisType.color}20, transparent)`,
                        }}
                        initial={{ scaleX: 0 }}
                        whileHover={{
                          scaleX: index !== activeAgentIndex ? 1 : 0,
                        }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  ))}

                  {/* Details Card */}
                  <div className="mt-2 relative overflow-hidden rounded-lg">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 dark:via-black/10 to-transparent" />

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeAgentIndex}
                        initial={{
                          opacity: 0,
                          y: direction * 20,
                        }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          y: -direction * 20,
                        }}
                        transition={{
                          y: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          },
                          opacity: { duration: 0.2 },
                        }}
                        className="py-3 px-2"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                analysisTypes[activeAgentIndex].color,
                            }}
                          />
                          <p className="text-xs text-white/90 dark:text-black/90">
                            {activeAgentIndex === 0 &&
                              "Detect contracts that trap users and prevent selling"}
                            {activeAgentIndex === 1 &&
                              "Identify contracts designed to drain liquidity"}
                            {activeAgentIndex === 2 &&
                              "Spot malicious contracts and phishing attempts"}
                            {activeAgentIndex === 3 &&
                              "Comprehensive security analysis and risk assessment"}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Enhanced Animated Connector - Hide on mobile */}
                <div className="hidden sm:block absolute -right-[8rem] top-1/2 -translate-y-1/2">
                  <svg
                    width="130"
                    height="80"
                    viewBox="0 0 130 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible"
                    aria-labelledby="connectorTitle"
                  >
                    <title id="connectorTitle">
                      Connector lines between AI agent selection and model
                      options
                    </title>
                    {/* Top curved connector */}
                    <path
                      d="M5 20 C40 0, 80 10, 125 15"
                      className="stroke-[#FF3366]/60 dark:stroke-[#FF3366]/60"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="2 3"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="100"
                        to="0"
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </path>

                    {/* Bottom curved connector */}
                    <path
                      d="M5 60 C40 70, 80 75, 125 65"
                      className="stroke-[#3B82F6]/60 dark:stroke-[#3B82F6]/60"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="4 6"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="100"
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </div>
              </div>

              {/* Card 2: Models List */}
              <div className="w-full sm:w-96 p-5 rounded-xl relative group/card backdrop-blur-sm border border-white/[0.05] dark:border-black/[0.05] bg-gradient-to-b from-white/[0.12] to-white/[0.03] dark:from-black/[0.12] dark:to-black/[0.03]">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent" />

                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-white dark:text-black">
                    AI Models
                  </h4>
                  <div className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 dark:bg-black/10 text-white/80 dark:text-black/80 border border-white/10 dark:border-black/10">
                    2 Models
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-x-3 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-black/[0.02] transition-colors">
                    <Anthropic className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors hidden dark:block" />
                    <AnthropicDark className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors block dark:hidden" />
                    <span className="text-sm text-white/80 dark:text-black/80 group-hover:text-white dark:group-hover:text-black transition-colors">
                      Anthropic
                    </span>
                  </div>
                  <div className="flex items-center gap-x-3 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-black/[0.02] transition-colors">
                    <OpenAI className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors hidden dark:block" />
                    <OpenAIDark className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors block dark:hidden" />
                    <span className="text-sm text-white/80 dark:text-black/80 group-hover:text-white dark:group-hover:text-black transition-colors">
                      OpenAI
                    </span>
                  </div>
                  {/*<div className="flex items-center gap-x-3 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-black/[0.02] transition-colors">*/}
                  {/*  <Deepseek className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors" />*/}
                  {/*  <span className="text-sm text-white/80 dark:text-black/80 group-hover:text-white dark:group-hover:text-black transition-colors">*/}
                  {/*    Deepseek*/}
                  {/*  </span>*/}
                  {/*</div>*/}
                  {/*<div className="flex items-center gap-x-3 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-black/[0.02] transition-colors">*/}
                  {/*  <Gemini className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors" />*/}
                  {/*  <span className="text-sm text-white/80 dark:text-black/80 group-hover:text-white dark:group-hover:text-black transition-colors">*/}
                  {/*    Gemini*/}
                  {/*  </span>*/}
                  {/*</div>*/}
                  {/*<div className="flex items-center gap-x-3 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-black/[0.02] transition-colors">*/}
                  {/*  <Mistral className="h-5 w-5 text-white/80 dark:text-black/80 flex-shrink-0 group-hover:text-white dark:group-hover:text-black transition-colors" />*/}
                  {/*  <span className="text-sm text-white/80 dark:text-black/80 group-hover:text-white dark:group-hover:text-black transition-colors">*/}
                  {/*    Mistral*/}
                  {/*  </span>*/}
                  {/*</div>*/}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-12 sm:mt-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative w-[96%] mx-auto"
          >
            {/* Background Decorations */}
            <div className="absolute -inset-x-4 -inset-y-4 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] dark:to-transparent rounded-2xl" />
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 sm:mt-20">
          <motion.div
            className="flex flex-col items-center gap-2 cursor-pointer group"
            onClick={() =>
              window.scrollTo({
                top: window.innerHeight,
                behavior: "smooth",
              })
            }
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <span className="text-sm text-white/40 group-hover:text-white/60 dark:text-black/40 dark:group-hover:text-black/60 transition-colors">
              Scroll to see features
            </span>
            <motion.div
              animate={{
                y: [0, 8, 0],
                scale: [1, 0.9, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-gradient-to-b from-white/[0.03] dark:from-black/[0.03] to-transparent rounded-full blur-sm" />
              <ChevronDown className="h-6 w-6 text-white/60 group-hover:text-white dark:text-black/60 dark:group-hover:text-black transition-colors relative" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
