"use client";

import { X } from "lucide-react";
import { BannerProps } from "../types/banner.types";
import { Button } from "@/components/ui/button";

export function StickyBanner({ banner, onClick, onDismiss }: BannerProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 shadow-2xl border-t md:hidden"
      style={{
        backgroundColor: banner.backgroundColor || "#1F2937",
        color: banner.textColor || "#FFFFFF",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-sm font-semibold truncate">{banner.headline}</h3>
          {banner.body && (
            <p className="text-xs opacity-80 truncate">{banner.body}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClick}
            size="sm"
            className="bg-white text-black hover:bg-gray-100 text-xs px-4 py-2 font-semibold whitespace-nowrap"
          >
            {banner.ctaText}
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
