import { Metadata } from "next";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";
import { Leaderboard } from "@/components/referrals/Leaderboard";
import { SocialProof } from "@/components/referrals/SocialProof";
import { REFERRAL_TIERS } from "@/lib/referrals/gamification-config";
import { FAQItem } from "@/components/ui/faq-item";
import { ReferralCTA } from "@/components/referrals/ReferralCTA";

export const metadata: Metadata = {
  title: "Referrals - ContractGuard AI",
  description:
    "Invite friends, climb the tiers, and earn rewards. Join our gamified referral program.",
};

export default async function ReferralsPage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/handler/sign-in?redirect=/referrals");
  }

  return (
    <div className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-black dark:text-white">
            Referral Program
          </h1>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Share ContractGuard AI with friends and unlock exclusive rewards as
            you climb through our gamified tier system
          </p>
        </div>

        {/* Social Proof Banner */}
        <div className="mb-8 sm:mb-12">
          <SocialProof variant="banner" />
        </div>

        {/* User's Referral Dashboard */}
        <div className="mb-8 sm:mb-12">
          <ReferralDashboard />
        </div>

        {/* Tier Information */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white mb-4 text-center">
            Referral Tiers & Rewards
          </h2>
          <p className="text-sm sm:text-base text-black/60 dark:text-white/60 text-center mb-6 sm:mb-8 max-w-2xl mx-auto">
            Progress through tiers by referring users. Each tier unlocks better
            rewards and exclusive perks!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Object.values(REFERRAL_TIERS)
              .filter((tier) => tier.id !== "none")
              .map((tier) => (
                <div
                  key={tier.id}
                  className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4 sm:p-6 hover:border-black/20 dark:hover:border-white/20 transition-colors"
                >
                  {/* Tier Header */}
                  <div
                    className={`flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r ${tier.bgGradient}`}
                  >
                    <div className="text-3xl sm:text-4xl">{tier.badge}</div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        {tier.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80">
                        {tier.referralsRequired} referral
                        {tier.referralsRequired !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="mb-4">
                    <div className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-1">
                      Reward
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                      {tier.reward.description}
                    </div>
                    <div className="text-xs sm:text-sm text-black/50 dark:text-white/50 mt-1">
                      {tier.reward.details}
                    </div>
                  </div>

                  {/* Perks */}
                  <div>
                    <div className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-2">
                      Perks
                    </div>
                    <div className="space-y-2">
                      {tier.perks.map((perk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs sm:text-sm text-black/70 dark:text-white/70"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mt-1.5 flex-shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commission Rate */}
                  {tier.commissionRate && (
                    <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-black/60 dark:text-white/60">
                          Commission Rate
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {Math.round(tier.commissionRate * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8 sm:mb-12 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-black dark:text-white mb-4 sm:mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl sm:text-2xl">🔗</span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-black dark:text-white mb-2">
                1. Share Link
              </h3>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                Copy your unique referral link from your dashboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl sm:text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-black dark:text-white mb-2">
                2. Friends Join
              </h3>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                They sign up using your link and complete their first scan
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl sm:text-2xl">🎁</span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-black dark:text-white mb-2">
                3. Earn Rewards
              </h3>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                Get instant rewards when they sign up and upgrade
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-black dark:text-white mb-2">
                4. Climb Tiers
              </h3>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                Unlock better rewards as you refer more users
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white mb-2 sm:mb-3">
              Community Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-black/60 dark:text-white/60">
              See who's leading the pack! Compete with other referrers for the
              top spot.
            </p>
          </div>
          <Leaderboard limit={50} />
        </div>

        {/* FAQ Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white mb-4 sm:mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2.5 max-w-3xl mx-auto">
            <FAQItem
              question="When do I get my reward?"
              answer="You receive rewards automatically when your referred user completes their first scan (signup bonus) and when they upgrade to a paid plan (upgrade bonus + commission)."
              index={0}
            />
            <FAQItem
              question="What's the commission system?"
              answer="When your referred users upgrade to Pro or Team, you earn 10% recurring commission on their subscription. As an Ambassador (100+ referrals), this increases to 20%!"
              index={1}
            />
            <FAQItem
              question="How are tiers calculated?"
              answer="Tiers are based on confirmed referrals (users who sign up AND complete their first scan). Your tier updates automatically as you hit milestones."
              index={2}
            />
            <FAQItem
              question="Can I lose my tier?"
              answer="No! Once you reach a tier, you keep it forever along with all its perks. Your referral count only goes up."
              index={3}
            />
            <FAQItem
              question="What happens if someone uses my link but doesn't sign up?"
              answer="The referral is tracked but remains 'pending' until they complete signup and their first scan. Only confirmed referrals count toward your tier progression."
              index={4}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <ReferralCTA
          title="Ready to Start Earning?"
          subtitle="Copy your referral link and start sharing"
        />
      </div>
    </div>
  );
}
