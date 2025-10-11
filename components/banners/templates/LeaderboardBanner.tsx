"use client";

import { X } from "lucide-react";
import { BannerProps } from "../types/banner.types";
import { Button } from "@/components/ui/button";

export function LeaderboardBanner({
  banner,
  onClick,
  onDismiss,
}: BannerProps) {
  return (
    <div
      className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg my-4 transition-all hover:shadow-xl"
      style={{
        backgroundColor: banner.backgroundColor || "#1F2937",
        color: banner.textColor || "#FFFFFF",
      }}
    >
      {/* Desktop: 728x90 */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 min-h-[90px]">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{banner.headline}</h3>
          {banner.body && (
            <p className="text-sm opacity-80">{banner.body}</p>
          )}
        </div>
        <div className="flex items-center gap-4 ml-6">
          <Button
            onClick={onClick}
            className="bg-white text-black hover:bg-gray-100 px-6 py-2 font-semibold"
          >
            {banner.ctaText}
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: 320x50 */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 min-h-[50px]">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{banner.headline}</h3>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Button
            onClick={onClick}
            size="sm"
            className="bg-white text-black hover:bg-gray-100 text-xs px-3 py-1"
          >
            {banner.ctaText}
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded"
              aria-label="Dismiss banner"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
