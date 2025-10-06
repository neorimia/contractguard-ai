import { siteConfig } from "@/config/site";

export const jsonLdScript = (data: object) => JSON.stringify(data, null, 0);

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.company.name,
  url: siteConfig.siteUrl.toString(),
  logo: new URL(siteConfig.company.logo, siteConfig.siteUrl).toString(),
  description: siteConfig.siteDescription,
  contactPoint: {
    "@type": "ContactPoint",
    email: siteConfig.contactEmail,
    contactType: "customer service",
  },
  sameAs: [
    siteConfig.links.twitter,
    siteConfig.links.github,
    siteConfig.links.discord,
  ],
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: siteConfig.siteUrl.toString(),
  name: siteConfig.siteName,
  description: siteConfig.siteDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.siteUrl.toString()}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: new URL(it.url, siteConfig.siteUrl).toString(),
  })),
});

export const articleLd = (p: {
  url: string;
  title: string;
  description: string;
  image?: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  mainEntityOfPage: p.url,
  headline: p.title,
  description: p.description,
  image: p.image
    ? [new URL(p.image, siteConfig.siteUrl).toString()]
    : undefined,
  author: p.authorName
    ? [{ "@type": "Person", name: p.authorName }]
    : undefined,
  datePublished: p.datePublished,
  dateModified: p.dateModified ?? p.datePublished,
  publisher: {
    "@type": "Organization",
    name: siteConfig.company.name,
    logo: {
      "@type": "ImageObject",
      url: new URL(siteConfig.company.logo, siteConfig.siteUrl).toString(),
    },
  },
});

export const faqPageLd = (
  faqs: Array<{ question: string; answer: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const softwareApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.siteName,
  description: siteConfig.siteDescription,
  url: siteConfig.siteUrl.toString(),
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier with 3 scans per day",
  },
  featureList: [
    "AI-powered smart contract analysis",
    "Honeypot detection",
    "Rug pull detection",
    "Plain English explanations",
    "Real-time security scanning",
    "Multi-chain support",
  ],
  screenshot: new URL("/dashboard.png", siteConfig.siteUrl).toString(),
});

export const howToLd = (steps: Array<{ name: string; text: string }>) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Analyze a Smart Contract with ContractGuard AI",
  description:
    "Step-by-step guide to using ContractGuard AI for smart contract security analysis",
  step: steps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
  totalTime: "PT2M",
  estimatedCost: {
    "@type": "MonetaryAmount",
    currency: "USD",
    value: "0",
  },
});
