import { CryptoScanInterface } from "@/components/crypto";
import { CompactTrustSection } from "@/components/TrustSection";

export default function Home() {
  return (
    <>
      <CryptoScanInterface />
      <CompactTrustSection />
      {/* <ReferralBannerContainer /> */}
    </>
  );
}
