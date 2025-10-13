import { Metadata } from "next";
import { CryptoScanInterface } from "@/components/crypto/CryptoScanInterface";

export const metadata: Metadata = {
  title: "Crypto Contract Scanner | CryptoGuard AI",
  description:
    "Analyze smart contracts for scams, honeypots, and rug pulls. Multi-chain security analysis for Ethereum and BSC.",
  openGraph: {
    title: "Crypto Contract Scanner | CryptoGuard AI",
    description:
      "Detect crypto scams in seconds. AI-powered smart contract security analysis.",
    images: ["/og-crypto.jpg"],
  },
};

export default function CryptoPage() {
  return <CryptoScanInterface />;
}
