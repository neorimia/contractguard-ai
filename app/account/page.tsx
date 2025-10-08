"use client";

import { AccountSettings } from "@stackframe/stack";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountPage() {
  const user = useUser();
  const router = useRouter();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
      <div className="relative bg-white/95 dark:bg-black/5 pt-14">
        <Header />

        {/* Account Settings Section */}
        <section className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
          <div className="w-full max-w-5xl mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8 space-y-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
                Account Settings
              </h1>
              <p className="text-sm sm:text-base tracking-tight text-black/60 dark:text-white/60">
                Manage your account preferences and settings
              </p>
            </div>

            {/* Account Settings Component */}
            <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-black">
              <AccountSettings fullPage={false} />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
