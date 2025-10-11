import { Metadata } from "next";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";
import { Leaderboard } from "@/components/referrals/Leaderboard";
import { SocialProof } from "@/components/referrals/SocialProof";
import { REFERRAL_TIERS } from "@/lib/referrals/gamification-config";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Referral Program
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Share ContractGuard AI with friends and unlock exclusive rewards as
            you climb through our gamified tier system
          </p>
        </div>

        {/* Social Proof Banner */}
        <div className="mb-12">
          <SocialProof variant="banner" />
        </div>

        {/* User's Referral Dashboard */}
        <div className="mb-12">
          <ReferralDashboard />
        </div>

        {/* Tier Information */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Referral Tiers & Rewards
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Progress through tiers by referring users. Each tier unlocks better
            rewards and exclusive perks!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(REFERRAL_TIERS)
              .filter((tier) => tier.id !== "none")
              .map((tier) => (
                <div
                  key={tier.id}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                >
                  {/* Tier Header */}
                  <div
                    className={`flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r ${tier.bgGradient}`}
                  >
                    <div className="text-4xl">{tier.badge}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {tier.name}
                      </h3>
                      <p className="text-sm text-white/80">
                        {tier.referralsRequired} referral
                        {tier.referralsRequired !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Reward</div>
                    <div className="text-lg font-semibold text-green-400">
                      {tier.reward.description}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {tier.reward.details}
                    </div>
                  </div>

                  {/* Perks */}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Perks</div>
                    <div className="space-y-2">
                      {tier.perks.map((perk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commission Rate */}
                  {tier.commissionRate && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Commission Rate</span>
                        <span className="text-purple-400 font-semibold">
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
        <div className="mb-12 bg-gray-900 border border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-semibold text-white mb-2">1. Share Link</h3>
              <p className="text-sm text-gray-400">
                Copy your unique referral link from your dashboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-white mb-2">2. Friends Join</h3>
              <p className="text-sm text-gray-400">
                They sign up using your link and complete their first scan
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="font-semibold text-white mb-2">3. Earn Rewards</h3>
              <p className="text-sm text-gray-400">
                Get instant rewards when they sign up and upgrade
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-white mb-2">4. Climb Tiers</h3>
              <p className="text-sm text-gray-400">
                Unlock better rewards as you refer more users
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Community Leaderboard
            </h2>
            <p className="text-gray-400">
              See who's leading the pack! Compete with other referrers for the
              top spot.
            </p>
          </div>
          <Leaderboard limit={50} />
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="font-semibold text-white mb-2">
                When do I get my reward?
              </h3>
              <p className="text-gray-400">
                You receive rewards automatically when your referred user
                completes their first scan (signup bonus) and when they upgrade
                to a paid plan (upgrade bonus + commission).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                What's the commission system?
              </h3>
              <p className="text-gray-400">
                When your referred users upgrade to Pro or Team, you earn 10%
                recurring commission on their subscription. As an Ambassador
                (100+ referrals), this increases to 20%!
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                How are tiers calculated?
              </h3>
              <p className="text-gray-400">
                Tiers are based on confirmed referrals (users who sign up AND
                complete their first scan). Your tier updates automatically as
                you hit milestones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Can I lose my tier?
              </h3>
              <p className="text-gray-400">
                No! Once you reach a tier, you keep it forever along with all
                its perks. Your referral count only goes up.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                What happens if someone uses my link but doesn't sign up?
              </h3>
              <p className="text-gray-400">
                The referral is tracked but remains "pending" until they
                complete signup and their first scan. Only confirmed referrals
                count toward your tier progression.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-300 mb-6">
              Copy your referral link from the dashboard above and start
              sharing!
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#top"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                View My Dashboard
              </a>
              <a
                href="https://twitter.com/intent/tweet?text=Check%20out%20ContractGuard%20AI!%20Scan%20smart%20contracts%20for%20scams%20in%20seconds."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                Share on Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
