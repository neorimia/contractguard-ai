"use client";

import { X } from "lucide-react";
import { BannerProps } from "../types/banner.types";
import { Button } from "@/components/ui/button";

export function RectangleBanner({ banner, onClick, onDismiss }: BannerProps) {
  return (
    <div
      className="relative w-full max-w-[300px] rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl"
      style={{
        backgroundColor: banner.backgroundColor || "#1F2937",
        color: banner.textColor || "#FFFFFF",
        minHeight: "250px",
      }}
    >
      <div className="p-6 flex flex-col h-full">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-colors z-10"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center mb-4">
          <h3 className="text-xl font-bold mb-3">{banner.headline}</h3>
          {banner.body && (
            <p className="text-sm opacity-90 leading-relaxed">{banner.body}</p>
          )}
        </div>

        <Button
          onClick={onClick}
          className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
        >
          {banner.ctaText}
        </Button>
      </div>
    </div>
  );
}
