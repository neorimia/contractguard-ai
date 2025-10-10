// components/CookieBanner.tsx
"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface BannerProps {
  message?: string;
  privacyPolicyLink?: string;
  className?: string;
  onAccept?: () => void;
  onReject?: () => void;
}

function BannerContent({
  message,
  privacyPolicyLink,
  onAccept,
  onReject,
}: BannerProps) {
  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {message ||
            "We use cookies to enhance your browsing experience and analyze site traffic. By accepting, you agree to our use of cookies. See our "}{" "}
          <a
            href={privacyPolicyLink || "/privacy"}
            className="font-semibold text-gray-900 transition-colors hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cookie Policy
          </a>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onReject}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          aria-label="Reject all cookies"
        >
          Reject All
        </button>
        <button
          onClick={onAccept}
          className="rounded-md bg-gray-900 px-2 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          aria-label="Accept all cookies"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}

const COOKIE_CONSENT_KEY = "cookie_consent";

export default function CookieBanner({
  message,
  privacyPolicyLink,
  className,
  onAccept,
  onReject,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
    onAccept?.();

    // Enable analytics if available
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.opt_in_capturing();
    }
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setIsVisible(false);
    onReject?.();

    // Disable analytics if available
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:p-6"
        >
          <div
            className={cn(
              "max-w-xl rounded-xl bg-white/95 p-1 ring-1 ring-gray-200/50 backdrop-blur-sm dark:bg-black/95 dark:ring-white/5",
              className
            )}
          >
            <div className="p-6">
              <BannerContent
                message={message}
                privacyPolicyLink={privacyPolicyLink}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
