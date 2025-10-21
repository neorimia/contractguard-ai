"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LockedSectionPreviewProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onUnlock: () => void;
  children: ReactNode;
  className?: string;
  unlockButtonText?: string;
  lockedHeight?: string;
}

export function LockedSectionPreview({
  title,
  description,
  icon: Icon,
  onUnlock,
  children,
  className = "",
  unlockButtonText = "Unlock to view",
  lockedHeight = "200px",
}: LockedSectionPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Content with blur effect */}
      <div className="relative">
        <div
          className="filter blur-sm pointer-events-none select-none overflow-hidden"
          style={{ maxHeight: lockedHeight }}
        >
          {children}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm mx-4 pointer-events-auto"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                {Icon ? (
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Lock className="h-6 w-6 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Title and description */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 mb-4">{description}</p>
              )}

              {/* Unlock button */}
              <Button
                onClick={onUnlock}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Lock className="h-4 w-4 mr-2" />
                {unlockButtonText}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Alternative compact version for inline use
interface CompactLockedPreviewProps {
  title: string;
  onUnlock: () => void;
  children: ReactNode;
  className?: string;
}

export function CompactLockedPreview({
  title,
  onUnlock,
  children,
  className = "",
}: CompactLockedPreviewProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay with compact unlock */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
            <Lock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{title}</span>
            <Button
              onClick={onUnlock}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Unlock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card-based locked section
interface LockedCardProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onUnlock: () => void;
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

export function LockedCard({
  title,
  description,
  icon: Icon,
  onUnlock,
  children,
  className = "",
  variant = "default",
}: LockedCardProps) {
  if (variant === "compact") {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div className="relative">
            <div className="filter blur-sm pointer-events-none">{children}</div>
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center p-4">
                <div className="flex justify-center mb-2">
                  {Icon ? (
                    <Icon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  {title}
                </h4>
                {description && (
                  <p className="text-xs text-gray-500 mb-2">{description}</p>
                )}
                <Button
                  onClick={onUnlock}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Unlock
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="relative">
          <div
            className="filter blur-sm pointer-events-none"
            style={{ minHeight: "200px" }}
          >
            {children}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mx-4 shadow-lg max-w-sm"
            >
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  {Icon ? (
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-gray-600 mb-4">{description}</p>
                )}

                <Button
                  onClick={onUnlock}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {title}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
