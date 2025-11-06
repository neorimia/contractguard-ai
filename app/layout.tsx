import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/seo/jsonld";
// Generate static JSON-LD data to avoid hydration mismatches
const staticOrganizationLd = organizationLd();
const staticWebsiteLd = websiteLd();
import { Suspense } from "react";
import { HeaderClient } from "@/components/HeaderClient";
import { Footer } from "@/components/footer";
import CookieBanner from "@/components/CookieBanner";
import { ClientProviders } from "@/components/ClientProviders";
import {
  PerformanceMonitor,
  LoadingOptimizer,
} from "@/components/PerformanceOptimizer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteConfig.siteUrl,
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.siteDescription,
  keywords: [
    "smart contract security",
    "AI contract analysis",
    "crypto security scanner",
    "honeypot detection",
    "rug pull detection",
    "blockchain security",
    "DeFi security",
    "smart contract audit",
    "crypto scam detection",
    "Web3 security",
    "EVM contract scanner",
    "contract address analysis",
    "smart contract vulnerability",
    "crypto investment protection",
    "blockchain audit tool",
    "contract security check",
    "DeFi risk assessment",
    "crypto safety scanner",
    "smart contract review",
    "blockchain security analysis",
    "contract verification",
    "crypto security tool",
    "smart contract scanner",
    "honeypot detection tool",
    "scan EVM chain contract address",
    "contract security analysis",
    "crypto scam scanner",
    "blockchain vulnerability detection",
    "smart contract security audit",
    "DeFi security scanner",
  ],
  authors: [{ name: "ContractGuard AI", url: siteConfig.siteUrl.toString() }],
  creator: "ContractGuard AI",
  publisher: "ContractGuard AI",
  applicationName: siteConfig.siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.siteUrl.toString(),
    siteName: siteConfig.siteName,
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [
      {
        url: siteConfig.socialImage,
        width: 1280,
        height: 720,
        alt: siteConfig.siteName,
      },
    ],
    locale: siteConfig.defaultLocale,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [siteConfig.socialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
      sizes: "16x16 32x32",
      type: "image/x-icon",
    },
    { rel: "icon", url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    {
      rel: "icon",
      url: "/favicon-32x32.png",
      sizes: "32x32",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
    { rel: "mask-icon", url: "/favicon.svg", color: "#000000" },
  ],
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#000000",
    "msapplication-TileColor": "#000000",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "ContractGuard",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <JsonLd data={staticOrganizationLd} />
        <JsonLd data={staticWebsiteLd} />
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.etherscan.io" />
        <link rel="dns-prefetch" href="https://eth-mainnet.alchemyapi.io" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistSans.className} antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <PerformanceMonitor />
          <LoadingOptimizer />
          <main className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
            <div className="relative bg-white/95 dark:bg-black/5 pt-14">
              <HeaderClient />
              {children}
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
            </div>
          </main>
          <CookieBanner />
        </ClientProviders>
      </body>
    </html>
  );
}
