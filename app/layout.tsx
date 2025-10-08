import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { Geist } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "next-themes";
import JsonLd from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/seo/jsonld";
import { StackAuthProvider } from "@/lib/stack";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { UserIdentifier } from "@/components/analytics/UserIdentifier";
import { Suspense } from "react";

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
        width: 1200,
        height: 630,
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
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-icon.png" },
  ],
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#000000",
    "msapplication-TileColor": "#000000",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
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
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
      </head>
      <body
        className={`${geistSans.variable} ${geistSans.className} antialiased`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <StackAuthProvider>
              <PostHogProvider>
                <Suspense fallback={null}>
                  <UserIdentifier />
                </Suspense>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <AuthErrorBoundary>{children}</AuthErrorBoundary>
                </ThemeProvider>
              </PostHogProvider>
            </StackAuthProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
