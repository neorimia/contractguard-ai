"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdditionalHelpSection() {
  const router = useRouter();

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/95 dark:bg-white/95 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-black mb-4">
            Need more help?
          </h2>
          <p className="text-white/60 dark:text-black/60 mb-6 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here
            to help you with any questions about smart contract security
            analysis.
          </p>
          <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
            <div className="rounded-xl p-1 border dark:border-black/30 border-white/30 dark:hover:border-black/50 hover:border-white/50 transition-all duration-300">
              <Button
                onClick={() => window.location.href = "mailto:support@contractguard.ai"}
                className="dark:text-white text-black tracking-tight group bg-white/95 dark:bg-black rounded-lg hover:bg-white dark:hover:bg-black transition-all duration-300"
              >
                Email us
              </Button>
            </div>
            <div className="rounded-xl p-1 border dark:border-black/30 border-white/30 dark:hover:border-black/50 hover:border-white/50 transition-all duration-300">
              <Button
               onClick={() => router.push("/audit")}
                variant="outline"
                className="text-white dark:text-black tracking-tight group bg-black dark:bg-white/95 rounded-lg dark:hover:bg-white hover:bg-black/90 hover:text-white dark:hover:text-black transition-all duration-300"
              >
                Scan my contract Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

