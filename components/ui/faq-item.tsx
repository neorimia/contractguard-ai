"use client";

import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
  index?: number;
  variant?: "default" | "inverted";
}

export function FAQItem({
  question,
  answer,
  index = 0,
  variant = "default",
}: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const isInverted = variant === "inverted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
      }}
      className={`border rounded-lg overflow-hidden shadow-sm transition-colors ${
        isInverted
          ? "backdrop-blur-sm border-white/10 dark:border-black/10 bg-white/[0.03] dark:bg-black/[0.03] shadow-white/5 dark:shadow-black/5 hover:border-white/15 dark:hover:border-black/15"
          : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
      }`}
    >
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleToggle()}
        type="button"
      >
        <h3
          className={`text-base font-medium ${
            isInverted
              ? "text-white dark:text-black"
              : "text-black dark:text-white"
          }`}
        >
          {question}
        </h3>
        <div
          className={`flex-shrink-0 ml-4 flex items-center justify-center h-6 w-6 rounded-full border transition-colors ${
            isInverted
              ? "bg-white/5 dark:bg-black/5 border-white/10 dark:border-black/10"
              : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
          }`}
        >
          {isOpen ? (
            <Minus
              className={`h-3.5 w-3.5 ${
                isInverted
                  ? "text-white/80 dark:text-black/80"
                  : "text-black/80 dark:text-white/80"
              }`}
            />
          ) : (
            <Plus
              className={`h-3.5 w-3.5 ${
                isInverted
                  ? "text-white/80 dark:text-black/80"
                  : "text-black/80 dark:text-white/80"
              }`}
            />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 0.2,
                  delay: 0.1,
                },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
                opacity: { duration: 0.2 },
              },
            }}
          >
            <div className="px-5 pb-4">
              <div
                className={`w-10 h-px border-t border-dashed mb-3 ${
                  isInverted
                    ? "border-white/10 dark:border-black/10"
                    : "border-black/10 dark:border-white/10"
                }`}
              />
              <p
                className={`text-sm ${
                  isInverted
                    ? "text-white/70 dark:text-black/70"
                    : "text-black/60 dark:text-white/60"
                }`}
              >
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
