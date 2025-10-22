import { HeaderClient } from "@/components/HeaderClient";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={geist.className}>
      <HeaderClient />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
