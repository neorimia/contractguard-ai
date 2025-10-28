import HowItWorks from "@/components/HowItWorks";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "How It Works - ContractGuard AI",
  description:
    "Learn how ContractGuard AI works in 3 simple steps. Get instant security analysis for smart contracts without any signup required.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works - ContractGuard AI",
    description:
      "Learn how ContractGuard AI works in 3 simple steps. Get instant security analysis for smart contracts without any signup required.",
    url: "/how-it-works",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "How It Works - ContractGuard AI",
      },
    ],
  },
  twitter: {
    title: "How It Works - ContractGuard AI",
    description:
      "Learn how ContractGuard AI works in 3 simple steps. Get instant security analysis for smart contracts.",
    images: [siteConfig.socialImage],
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How It Works"
        highlightedText="in 3 steps"
        description="Get instant security analysis in 3 simple steps. Start free scan up to 3 contracts daily. Pay per scan or subscribe for unlimited access. From one-time
                  audits to professional monitoring transparent pricing, no
                  surprises."
      />
      <HowItWorks hideTitle hideDescription />
    </>
  );
}
