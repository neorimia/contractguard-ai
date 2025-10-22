import { PricingSectionHybridClient } from "@/components/PricingSectionHybridClient";
import PageHero from "@/components/PageHero";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Pricing - Simple, Transparent Plans for Smart Contract Security",
  description:
    "Start free with 3 scans per day. Upgrade to Pro for unlimited scans at $29/month or choose Enterprise for advanced features. No hidden fees, cancel anytime.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - Simple, Transparent Plans for Smart Contract Security",
    description:
      "Start free with 3 scans per day. Upgrade to Pro for unlimited scans at $29/month or choose Enterprise for advanced features.",
    url: "/pricing",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Pricing - Smart Contract Security Scanner",
      },
    ],
  },
  twitter: {
    title: "Pricing - Simple, Transparent Plans for Smart Contract Security",
    description:
      "Start free with 3 scans per day. Upgrade to Pro for unlimited scans at $29/month. No hidden fees, cancel anytime.",
    images: [siteConfig.socialImage],
  },
};

// Pricing structured data with all tiers
const pricingLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pricing - ContractGuard AI",
  description:
    "Simple, transparent pricing for AI-powered smart contract security analysis. Free tier, Pro tier, and Enterprise plans available.",
  url: `${siteConfig.siteUrl.href}pricing`,
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "ContractGuard AI",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free Tier",
        price: "0",
        priceCurrency: "USD",
        description: "Perfect for casual traders and contract exploration",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: "3",
          unitText: "scans per day",
        },
        itemOffered: {
          "@type": "Service",
          name: "Basic Smart Contract Security Analysis",
          description:
            "3 scans per day with basic risk analysis and honeypot detection",
        },
      },
      {
        "@type": "Offer",
        name: "Pro Tier",
        price: "29",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "29",
          priceCurrency: "USD",
          billingDuration: "P1M",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
        description: "Unlimited scans with advanced security features",
        itemOffered: {
          "@type": "Service",
          name: "Advanced Smart Contract Security Analysis",
          description:
            "Unlimited scans with API access, priority processing, and advanced features",
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "API Access",
              value: "500 calls per day",
            },
            {
              "@type": "PropertyValue",
              name: "Historical Analysis",
              value: "Available",
            },
            {
              "@type": "PropertyValue",
              name: "PDF Exports",
              value: "Included",
            },
          ],
        },
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "199",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "199",
          priceCurrency: "USD",
          billingDuration: "P1M",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
        description:
          "Advanced features for professional traders and institutions",
        itemOffered: {
          "@type": "Service",
          name: "Enterprise Smart Contract Security Analysis",
          description:
            "Unlimited API calls, white-label option, custom AI training, and dedicated support",
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "API Access",
              value: "Unlimited",
            },
            {
              "@type": "PropertyValue",
              name: "White Label",
              value: "Available",
            },
            {
              "@type": "PropertyValue",
              name: "Custom AI Training",
              value: "Included",
            },
            {
              "@type": "PropertyValue",
              name: "SLA",
              value: "Guaranteed",
            },
          ],
        },
        availability: "https://schema.org/InStock",
      },
    ],
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.siteUrl.href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: `${siteConfig.siteUrl.href}pricing`,
      },
    ],
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={pricingLd} />
      <PageHero
        title="Simple pricing,"
        highlightedText="powerful protection"
        description="Pay per scan or subscribe for unlimited access. One-time audits or professional monitoring — transparent pricing that fits your needs."
      />

      <PricingSectionHybridClient />

      {/* Additional Value Props */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">💳</div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                No Credit Card Required
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                Start scanning immediately with our free tier. No payment
                information needed.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Cancel Anytime
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                Change or cancel your plan at any time. No long-term commitments
                required.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Instant Activation
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                Upgrade instantly and start using Pro features right away. No
                waiting period.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
