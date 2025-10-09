import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and conditions for using ContractGuard AI. Learn about our service, user responsibilities, and legal agreements.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service - ContractGuard AI",
    description:
      "Read the terms and conditions for using ContractGuard AI. Learn about our service and legal agreements.",
    url: "/terms",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Terms of Service",
      },
    ],
  },
  twitter: {
    title: "Terms of Service - ContractGuard AI",
    description: "Read the terms and conditions for using ContractGuard AI.",
    images: [siteConfig.socialImage],
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white mb-8">
          Terms of Service
        </h1>

        <p className="text-sm text-black/60 dark:text-white/60 mb-8">
          Last updated: December 19, 2024
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              By accessing and using ContractGuard AI ("Service"), you accept
              and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              ContractGuard AI is an AI-powered smart contract security analysis
              platform that provides automated detection of security
              vulnerabilities, honeypots, rug pulls, and other malicious
              patterns in smart contracts. Our service analyzes publicly
              available blockchain data and provides risk assessments in plain
              English.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              3. User Responsibilities
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  Use the Service only for legitimate security analysis purposes
                </li>
                <li>
                  Not attempt to reverse engineer, hack, or compromise our
                  systems
                </li>
                <li>
                  Not use the Service for any illegal or unauthorized purpose
                </li>
                <li>Provide accurate information when creating an account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              4. Service Availability
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We strive to maintain high service availability but do not
              guarantee uninterrupted access. The Service may be temporarily
              unavailable due to maintenance, updates, or technical issues. We
              reserve the right to modify or discontinue the Service at any time
              with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              5. Accuracy and Limitations
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                While we strive for accuracy, our AI analysis is not infallible:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>Analysis results are for informational purposes only</li>
                <li>
                  We do not guarantee 100% accuracy in detecting all security
                  issues
                </li>
                <li>False positives and false negatives may occur</li>
                <li>
                  You should conduct additional due diligence before making
                  investment decisions
                </li>
                <li>
                  We are not responsible for any financial losses resulting from
                  our analysis
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              6. Privacy and Data Protection
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We only analyze publicly available blockchain data and do not
              store your contract addresses or personal information beyond what
              is necessary to provide the Service. Please review our Privacy
              Policy for detailed information about data collection and usage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              7. Payment and Billing
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                For paid subscriptions:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  Fees are charged in advance on a monthly or annual basis
                </li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change pricing with 30 days notice</li>
                <li>You can cancel your subscription at any time</li>
                <li>Payment processing is handled by Stripe</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              The Service and its original content, features, and functionality
              are owned by ContractGuard AI and are protected by international
              copyright, trademark, patent, trade secret, and other intellectual
              property laws. You may not copy, modify, or distribute our content
              without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              To the maximum extent permitted by law, ContractGuard AI shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from
              your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              10. Indemnification
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              You agree to defend, indemnify, and hold harmless ContractGuard AI
              and its officers, directors, employees, and agents from and
              against any claims, damages, obligations, losses, liabilities,
              costs, or debt, and expenses (including attorney's fees) arising
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              11. Termination
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
              Upon termination, your right to use the Service will cease
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              12. Changes to Terms
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will try to
              provide at least 30 days notice prior to any new terms taking
              effect. Your continued use of the Service after any such changes
              constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              13. Governing Law
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              These Terms shall be interpreted and governed by the laws of the
              State of Delaware, United States, without regard to its conflict
              of law provisions. Any disputes arising from these Terms or your
              use of the Service shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              14. Contact Information
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
              <p className="text-black/70 dark:text-white/70">
                Email: legal@contractguard.ai
                <br />
                Website: https://contractguard.ai
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
