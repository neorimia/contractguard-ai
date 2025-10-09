// app/ref/[code]/page.tsx

import { ReferralService } from "@/lib/services/referral.service";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Validate code and get referrer info
  // Note: Cookie is already set by middleware
  const referralService = new ReferralService();
  const validation = await referralService.validateReferralCode(code);

  if (!validation.valid) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Referral Link</h1>
          <p className="mt-2 text-muted-foreground">
            This referral link is not valid or has expired.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { referrer } = validation;

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <div className="max-w-2xl text-center">
        {/* Referrer info */}
        {referrer?.displayName && (
          <div className="mb-6 flex items-center justify-center gap-3">
            {referrer.avatarUrl && (
              <img
                src={referrer.avatarUrl}
                alt={referrer.displayName}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div className="text-lg">
              <span className="font-semibold">{referrer.displayName}</span>
              {" invited you to join"}
            </div>
          </div>
        )}

        {/* Hero */}
        <h1 className="text-4xl font-bold sm:text-5xl">
          AI-Powered Smart Contract Security
        </h1>

        <p className="mt-4 text-xl text-muted-foreground">
          Detect scams, honeypots, and rug pulls before you invest
        </p>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-center gap-3 text-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle
                className="text-green-600 dark:text-green-400"
                size={24}
              />
            </div>
            <span>
              Get <strong>+3 free scans</strong> when you sign up
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 text-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Zap className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <span>Instant AI-powered security analysis</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <Shield
                className="text-purple-600 dark:text-purple-400"
                size={24}
              />
            </div>
            <span>Protect your crypto investments</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <TrendingUp
                className="text-orange-600 dark:text-orange-400"
                size={24}
              />
            </div>
            <span>Join 10,000+ savvy crypto traders</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">Learn More</Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Special Offer:</strong> Sign up through this link and get +3
            bonus scans instantly
          </p>
          <p className="text-xs text-muted-foreground">
            No credit card required • Start protecting your investments today
          </p>
        </div>
      </div>
    </div>
  );
}
