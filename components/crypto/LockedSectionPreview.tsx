"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LockedSectionPreviewProps {
  children: ReactNode;
  className?: string;
  lockedHeight?: string;
}

export function LockedSectionPreview({
  children,
  className = "",
  lockedHeight = "200px",
}: LockedSectionPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div
          className="pointer-events-auto select-auto opacity-100 overflow-hidden"
          style={{ maxHeight: lockedHeight }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Alternative compact version for inline use
interface CompactLockedPreviewProps {
  children: ReactNode;
  className?: string;
}

export function CompactLockedPreview({
  children,
  className = "",
}: CompactLockedPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="pointer-events-auto select-auto opacity-100">
          {children}
        </div>
      </div>
    </div>
  );
}

// Card-based locked section
interface LockedCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

export function LockedCard({
  children,
  className = "",
  variant = "default",
}: LockedCardProps) {
  if (variant === "compact") {
    return (
      <Card
        className={`relative overflow-hidden bg-black border-white/20 ${className}`}
      >
        <CardContent className="p-0">
          <div className="relative">
            <div className="pointer-events-auto select-auto opacity-100">
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`relative overflow-hidden bg-black border-white/20 ${className}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <div
            className="pointer-events-auto select-auto opacity-100"
            style={{ minHeight: "200px" }}
          >
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
