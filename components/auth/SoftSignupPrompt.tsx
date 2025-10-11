// components/auth/SoftSignupPrompt.tsx
"use client";

import { useState } from "react";
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
import { CheckCircle, Sparkles, Mail } from "lucide-react";
import { MagicLinkSignIn } from "@stackframe/stack";
import { motion } from "motion/react";

interface SoftSignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  scansPerformed: number;
  scansRemaining: number;
  anonymousSessionId: string;
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

export function SoftSignupPrompt({
  isOpen,
  onClose,
  scansPerformed,
  scansRemaining,
  anonymousSessionId,
}: SoftSignupPromptProps) {
  const [submitted, setSubmitted] = useState(false);

  // Success state - email sent (drawer version)
  if (submitted) {
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
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Mail className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <DrawerTitle className="text-2xl font-semibold text-center tracking-tight">
                  ✉️ Check Your Email
                </DrawerTitle>

                <DrawerDescription className="text-sm tracking-tight text-muted-foreground text-center">
                  We've sent you a magic link to verify your email and save your
                  scans.
                </DrawerDescription>
              </DrawerHeader>
            </motion.div>

            {/* Success Checklist */}
            <motion.div
              variants={itemVariants as any}
              className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Click the link in your email to continue
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Link expires in 1 hour
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Your scan history will be preserved
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants as any}>
              <DrawerFooter className="px-0 pt-2">
                <DrawerClose asChild>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-11 rounded-lg text-sm font-medium tracking-tight"
                  >
                    Got it, thanks!
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </motion.div>
          </motion.div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Main signup drawer
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
                <div className="p-3 rounded-lg bg-primary/10">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
              </div>

              <DrawerTitle className="text-2xl font-semibold text-center tracking-tight">
                💾 Save Your Scans & Get More
              </DrawerTitle>

              <DrawerDescription className="text-sm tracking-tight text-muted-foreground text-center">
                Great start! You've completed{" "}
                <strong className="text-foreground">{scansPerformed}</strong>{" "}
                scan
                {scansPerformed > 1 ? "s" : ""}. Create a free account to save
                your results and get 3 free scans daily
                {scansRemaining > 0 &&
                  ` — you have ${scansRemaining} more scan${scansRemaining > 1 ? "s" : ""} left today`}
                .
              </DrawerDescription>
            </DrawerHeader>
          </motion.div>

          {/* Benefits List */}
          <motion.div
            variants={itemVariants as any}
            className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
          >
            <h4 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              What You Get
            </h4>
            <ul className="space-y-2.5 text-sm tracking-tight text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Save unlimited scan history
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                3 free scans every day
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                No password required (magic link)
              </li>
            </ul>
          </motion.div>

          {/* Stack Auth Magic Link Component */}
          <motion.div variants={itemVariants as any}>
            <MagicLinkSignIn />
          </motion.div>

          {/* Footer with Sign In Link */}
          <motion.div variants={itemVariants as any}>
            <DrawerFooter className="px-0 pt-2 space-y-3">
              <div className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/handler/sign-in"
                  className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
                >
                  Sign in
                </a>
              </div>
              <DrawerClose asChild>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full h-11 rounded-lg text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium tracking-tight transition-colors"
                >
                  Maybe Later
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </motion.div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
