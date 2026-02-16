"use client";

import Link from "next/link";
import {
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  HelpCircle,
  BookOpen,
  Mail,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { TrustIndicators } from "@/components/TrustBadge";

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", href: "/support" },
      { name: "Contact Us", href: "mailto:support@contractguard.ai" },
      { name: "API Docs", href: "/docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [iconSrc, setIconSrc] = useState<string>("");
  useEffect(() => {
    setIconSrc(theme === "dark" ? "/logo-white.svg" : "/logo.svg");
  }, [theme]);

  // Wait until after client-side hydration to show theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <footer className="sticky bottom-0 w-full mt-auto bg-white dark:bg-black border-t border-black/5 dark:border-white/5 backdrop-blur-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-shrink-0 max-w-xs">
            <Link
              href="/"
              className="text-4xl font-bold tracking-tighter text-black dark:text-white hover:opacity-90 transition-opacity"
            >
              <Image
                src={iconSrc || "/logo.svg"}
                alt="ContractGuard AI"
                width={130}
                height={50}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo.svg";
                  if (target.src.includes("/logo-white.svg")) {
                    target.src = "/logo.svg";
                  } else if (target.src.includes("/logo.svg")) {
                    target.src = "/logo1.png";
                  } else {
                    target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMTMwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iNTAiIHJ4PSI0IiBmaWxsPSIjMDAwMDAwIi8+CiAgPHRleHQgeD0iNjUiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DPC90ZXh0PgogPC9zdmc+";
                  }
                }}
              />
            </Link>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              AI-powered smart contract security scanner.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-12 lg:gap-16">
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-sm font-medium text-black dark:text-white">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* <div className="flex-shrink-0 space-y-3 max-w-xs">
            <h3 className="text-sm font-medium text-black dark:text-white">
              Stay updated
            </h3>
            <p className="text-sm text-black/60 dark:text-white/60">
              Get notified about new security features and contract analysis
              updates.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
              />
              <Button
                size="sm"
                className="h-9 px-3 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div> */}
        </div>

        {/* Founder Note */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
          <div className="max-w-2xl">
            <p className="text-sm tracking-tight text-black/80 dark:text-white/80 leading-relaxed">
              <span className="font-medium text-black dark:text-white">I got burned once.</span>{" "}
              I built ContractGuard so you don't. We read code so you don't have to in seconds.
            </p>
            <p className="text-xs text-black/40 dark:text-white/40">
              <span className="font-medium text-black dark:text-white">Gabriel Cruceanu</span>, Founder of ContractGuard AI
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-5 border-t border-black/5 dark:border-white/5 text-xs text-black/50 dark:text-white/50">
          <div className="flex flex-col gap-3">
            <p>© {currentYear} ContractGuard AI. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built & maintained by{" "}
              <a
                href="https://neorimia.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-black dark:hover:text-white transition-colors underline underline-offset-2"
              >
                Neorimia
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-4 sm:mt-0">
            {/* <div className="flex flex-wrap gap-4">
              <Link
                href="/terms"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                Cookies
              </Link>
            </div> */}

            <TrustIndicators />
            <p className="text-xs text-black/40 dark:text-white/40">
              Not financial advice. Always DYOR.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
