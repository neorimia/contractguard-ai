"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import Link from "next/link";
import { motion } from "motion/react";
import { Shield, ArrowRight, Clock, Zap } from "lucide-react";

interface ScanLimitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scansRemaining: number;
  resetAt: string;
  upgradeUrl?: string;
}

const drawerVariants = {
  hidden: {
    y: "100%",
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 10,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
};

export default function ScanLimitDrawer({
  isOpen,
  onClose,
  scansRemaining,
  resetAt,
  upgradeUrl = "/pricing",
}: ScanLimitDrawerProps) {
  const formatResetTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = date.getTime() - now.getTime();

      // If the reset time has already passed, show "now"
      if (diff <= 0) {
        return "now";
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch {
      return "soon";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-fit mx-auto p-6 rounded-xl border border-black/10 dark:border-white/10">
        <motion.div
          variants={drawerVariants as any}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-[420px] space-y-6"
        >
          <motion.div variants={itemVariants as any}>
            <DrawerHeader className="px-0 space-y-4">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <Shield className="w-7 h-7 text-black dark:text-white" />
                </div>
              </div>

              <DrawerTitle className="text-2xl font-semibold text-center tracking-tight text-black dark:text-white">
                Daily Scan Limit Reached
              </DrawerTitle>

              <DrawerDescription className="text-sm tracking-tight text-black/60 dark:text-white/60 text-center">
                You've used all your free scans for today. Upgrade to Pro for
                100 scans per day and advanced features.
              </DrawerDescription>
            </DrawerHeader>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants as any}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div className="text-xs tracking-tight text-black/60 dark:text-white/60 mb-1.5">
                Scans Remaining
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {scansRemaining}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div className="text-xs tracking-tight text-black/60 dark:text-white/60 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Resets in
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {formatResetTime(resetAt)}
              </div>
            </div>
          </motion.div>

          {/* Pro Features */}
          <motion.div
            variants={itemVariants as any}
            className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
          >
            <h4 className="text-sm font-semibold tracking-tight text-black dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Pro Features
            </h4>
            <ul className="space-y-2.5 text-sm tracking-tight text-black/70 dark:text-white/70">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                100 scans per day
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                Advanced AI analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                API access (500 calls/day)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-black dark:bg-white" />
                Priority support
              </li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants as any}>
            <DrawerFooter className="flex flex-col gap-3 px-0 pt-2">
              <Link href={upgradeUrl} className="w-full">
                <Button className="w-full h-11 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-sm font-medium tracking-tight transition-all duration-300 group">
                  <span className="flex items-center gap-2">
                    Upgrade to Pro — $29/month
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Button>
              </Link>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full h-11 rounded-lg text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium tracking-tight transition-colors"
                >
                  Continue with Free Tier
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </motion.div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
