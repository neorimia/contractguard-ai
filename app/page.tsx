import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import Feature from "@/components/Feature";
import FAQSection from "@/components/FAQSection";

const geist = Geist({
    weight: ["400", "600"],
    subsets: ["latin"],
});

export default function Home() {
    return (
        <main
            className={`relative min-h-screen w-full bg-white dark:bg-black ${geist.className} overflow-hidden`}
        >
            <div className="relative bg-white/95 dark:bg-black/5 pt-14">
                <Header />
                <HeroSection />
                <Feature />
                <PricingSection />
                <FAQSection />
                <Footer />
            </div>
        </main>
    );
}
