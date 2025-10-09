"use client";

import { useState, useEffect, useRef } from "react";
import { Shield } from "lucide-react";
import { LoadingAnimation } from "./LoadingAnimation";
import { TASK_SEQUENCES } from "./taskSequences";

export function AILoadingState() {
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
      <div className="space-y-6 w-full max-w-2xl">
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
