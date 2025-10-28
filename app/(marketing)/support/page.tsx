import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import {
  Mail,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support & Help Center - ContractGuard AI",
  description:
    "Get help with ContractGuard AI smart contract security analysis. Find answers, contact support, access documentation, and learn how to protect your crypto investments.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Support & Help Center - ContractGuard AI",
    description:
      "Get help with ContractGuard AI smart contract security analysis. Find answers and contact support.",
    url: "/support",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Support Center",
      },
    ],
  },
  twitter: {
    title: "Support & Help Center - ContractGuard AI",
    description:
      "Get help with ContractGuard AI smart contract security analysis.",
    images: [siteConfig.socialImage],
  },
};

export default function SupportPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white mb-6">
          Support & Help Center
        </h1>
        <p className="text-xl text-black/70 dark:text-white/70 max-w-3xl mx-auto">
          Get help with ContractGuard AI, find answers to common questions, and
          learn how to protect your crypto investments with smart contract
          security analysis.
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Link
          href="/faq"
          className="group p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl hover:border-black/20 dark:hover:border-white/20 transition-all"
        >
          <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            FAQ
          </h3>
          <p className="text-black/60 dark:text-white/60">
            Find answers to frequently asked questions about smart contract
            security analysis.
          </p>
        </Link>

        <Link
          href="mailto:support@contractguard.ai"
          className="group p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl hover:border-black/20 dark:hover:border-white/20 transition-all"
        >
          <Mail className="h-8 w-8 text-green-600 dark:text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            Email Support
          </h3>
          <p className="text-black/60 dark:text-white/60">
            Get personalized help from our support team via email.
          </p>
        </Link>

        <Link
          href="/docs"
          className="group p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl hover:border-black/20 dark:hover:border-white/20 transition-all"
        >
          <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Documentation
          </h3>
          <p className="text-black/60 dark:text-white/60">
            Comprehensive guides and API documentation for developers.
          </p>
        </Link>
      </div>

      {/* Contact Information */}
      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              General Support
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-black/60 dark:text-white/60" />
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Email
                  </p>
                  <a
                    href="mailto:support@contractguard.ai"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@contractguard.ai
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-black/60 dark:text-white/60" />
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Response Time
                  </p>
                  <p className="text-black/60 dark:text-white/60">
                    Within 24 hours (usually faster)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Technical Issues
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-black/60 dark:text-white/60" />
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Security Concerns
                  </p>
                  <a
                    href="mailto:security@contractguard.ai"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    security@contractguard.ai
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-black/60 dark:text-white/60" />
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Bug Reports
                  </p>
                  <a
                    href="mailto:bugs@contractguard.ai"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    bugs@contractguard.ai
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Common Issues & Solutions
        </h2>

        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              "Contract not found" error
            </h3>
            <p className="text-black/70 dark:text-white/70 mb-3">
              This usually means the contract address is invalid or the contract
              isn't verified on the blockchain.
            </p>
            <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
              <li>Double-check the contract address</li>
              <li>Ensure the contract is verified on Etherscan</li>
              <li>
                Make sure you're using the correct network (Ethereum mainnet)
              </li>
            </ul>
          </div>

          <div className="p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Analysis taking too long
            </h3>
            <p className="text-black/70 dark:text-white/70 mb-3">
              Complex contracts may take longer to analyze. Here's what you can
              do:
            </p>
            <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
              <li>Wait up to 30 seconds for complex contracts</li>
              <li>Try refreshing the page if it's been over 1 minute</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>

          <div className="p-6 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Scan limit reached
            </h3>
            <p className="text-black/70 dark:text-white/70 mb-3">
              Free users get 3 scans per day. To get unlimited scans:
            </p>
            <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
              <li>Upgrade to Pro tier ($29/month)</li>
              <li>Wait 24 hours for free scans to reset</li>
              <li>Contact us for enterprise solutions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust & Security */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4">
          Your Privacy & Security
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-3">
              Data Protection
            </h3>
            <ul className="space-y-2 text-green-700 dark:text-green-300">
              <li>• We don't store your contract addresses</li>
              <li>• All analysis is encrypted</li>
              <li>• No private keys required</li>
              <li>• Read-only blockchain access</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-3">
              Security Features
            </h3>
            <ul className="space-y-2 text-green-700 dark:text-green-300">
              <li>• SSL encryption for all data</li>
              <li>• Enterprise-grade security</li>
              <li>• Regular security audits</li>
              <li>• GDPR compliant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
