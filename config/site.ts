export const siteConfig = {
  siteUrl: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://contractguard.ai"
  ),
  siteName: "ContractGuard AI",
  siteDescription:
    "AI-powered smart contract security scanner that detects scams, honeypots, and rug pulls in seconds. Get instant analysis in plain English.",
  defaultLocale: "en",
  locales: ["en"],
  twitterHandle: "@contractguardai",
  socialImage: "/og-default.png",
  company: {
    name: "Neorimia, Inc.",
    logo: "/logo.svg",
  },
  author: {
    name: "Neorimia",
    website: "https://neorimia.com",
  },
  contactEmail: "contact@contractguard.ai",
  links: {
    twitter: "https://twitter.com/contractguardai",
    github: "https://github.com/contractguard-ai",
    discord: "https://discord.gg/contractguard",
  },
} as const;

export type SiteConfig = typeof siteConfig;

export const META_THEME_COLORS = {
  light: "#fafafa",
  dark: "#09090b",
};
