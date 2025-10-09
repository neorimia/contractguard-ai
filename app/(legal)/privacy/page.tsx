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
  title: "Privacy Policy",
  description:
    "Learn how ContractGuard AI protects your privacy and handles your data. Our commitment to data security and user privacy in smart contract analysis.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy - ContractGuard AI",
    description:
      "Learn how ContractGuard AI protects your privacy and handles your data. Our commitment to data security and user privacy.",
    url: "/privacy",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Privacy Policy",
      },
    ],
  },
  twitter: {
    title: "Privacy Policy - ContractGuard AI",
    description:
      "Learn how ContractGuard AI protects your privacy and handles your data.",
    images: [siteConfig.socialImage],
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white mb-8">
          Privacy Policy
        </h1>

        <p className="text-sm text-black/60 dark:text-white/60 mb-8">
          Last updated: December 19, 2024
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              ContractGuard AI ("we," "our," or "us") is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our smart
              contract security analysis service. Please read this privacy
              policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              2. Information We Collect
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  2.1 Information You Provide
                </h3>
                <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Account Information:</strong> Email address,
                    password, and profile information when you create an account
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Billing details
                    processed securely through Stripe (we don't store payment
                    card information)
                  </li>
                  <li>
                    <strong>Communication Data:</strong> Messages you send to
                    our support team
                  </li>
                  <li>
                    <strong>Contract Addresses:</strong> Smart contract
                    addresses you submit for analysis (stored temporarily for
                    processing only)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  2.2 Information We Collect Automatically
                </h3>
                <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Usage Data:</strong> How you interact with our
                    service, features used, and time spent
                  </li>
                  <li>
                    <strong>Device Information:</strong> IP address, browser
                    type, operating system, and device identifiers
                  </li>
                  <li>
                    <strong>Log Data:</strong> Server logs, error reports, and
                    performance data
                  </li>
                  <li>
                    <strong>Cookies and Tracking:</strong> Essential cookies for
                    functionality and optional analytics cookies
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  2.3 Blockchain Data
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed">
                  We analyze publicly available blockchain data including smart
                  contract code, transaction history, and on-chain events. This
                  data is already public and accessible to anyone on the
                  blockchain.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              3. How We Use Your Information
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  Provide and maintain our smart contract security analysis
                  service
                </li>
                <li>
                  Process your contract analysis requests and deliver results
                </li>
                <li>Manage your account and process payments</li>
                <li>Improve our AI models and analysis accuracy</li>
                <li>Send you service-related communications and updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Analyze usage patterns to improve our service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              4. Information Sharing and Disclosure
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  4.1 We Do Not Sell Your Data
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed">
                  We do not sell, trade, or rent your personal information to
                  third parties for marketing purposes.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  4.2 When We May Share Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Service Providers:</strong> Trusted third parties
                    who help us operate our service (hosting, analytics, payment
                    processing)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law,
                    court order, or to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a
                    merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <strong>Consent:</strong> When you explicitly consent to
                    sharing your information
                  </li>
                  <li>
                    <strong>Aggregated Data:</strong> Anonymous, aggregated
                    statistics that cannot identify you
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              5. Data Security
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                We implement appropriate security measures to protect your
                information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers with physical security measures</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response procedures for data breaches</li>
              </ul>
              <p className="text-black/70 dark:text-white/70 leading-relaxed mt-4">
                However, no method of transmission over the internet or
                electronic storage is 100% secure. While we strive to protect
                your information, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              6. Data Retention
            </h2>
            <div className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  <strong>Account Data:</strong> Retained while your account is
                  active and for 30 days after deletion
                </li>
                <li>
                  <strong>Contract Addresses:</strong> Deleted immediately after
                  analysis completion (typically within 10 seconds)
                </li>
                <li>
                  <strong>Analysis Results:</strong> Cached for 24 hours to
                  improve performance, then deleted
                </li>
                <li>
                  <strong>Usage Logs:</strong> Retained for 90 days for security
                  and debugging purposes
                </li>
                <li>
                  <strong>Payment Records:</strong> Retained as required by law
                  (typically 7 years)
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              7. Your Rights and Choices
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  <strong>Access:</strong> Request a copy of your personal
                  information
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured, machine-readable format
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your
                  information
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain types of
                  processing
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw consent for data
                  processing where applicable
                </li>
              </ul>
              <p className="text-black/70 dark:text-white/70 leading-relaxed mt-4">
                To exercise these rights, contact us at
                privacy@contractguard.ai. We will respond within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              8. Cookies and Tracking Technologies
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  <strong>Essential Cookies:</strong> Required for basic website
                  functionality
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  users interact with our service
                </li>
                <li>
                  <strong>Preference Cookies:</strong> Remember your settings
                  and preferences
                </li>
                <li>
                  <strong>Security Cookies:</strong> Protect against fraud and
                  abuse
                </li>
              </ul>
              <p className="text-black/70 dark:text-white/70 leading-relaxed mt-4">
                You can control cookies through your browser settings. Note that
                disabling certain cookies may affect service functionality.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              9. Third-Party Services
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>
                  <strong>Stripe:</strong> Payment processing (see Stripe's
                  privacy policy)
                </li>
                <li>
                  <strong>Vercel:</strong> Website hosting and analytics
                </li>
                <li>
                  <strong>OpenAI/Anthropic:</strong> AI analysis services (data
                  processed according to their policies)
                </li>
                <li>
                  <strong>Etherscan/Alchemy:</strong> Blockchain data providers
                </li>
              </ul>
              <p className="text-black/70 dark:text-white/70 leading-relaxed mt-4">
                These services have their own privacy policies. We encourage you
                to review them.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              for such transfers, including standard contractual clauses and
              adequacy decisions where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              11. Children's Privacy
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected personal information
              from a child under 13, we will take steps to delete such
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date. We encourage you
              to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              13. Contact Us
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
              <p className="text-black/70 dark:text-white/70">
                <strong>Privacy Officer</strong>
                <br />
                Email: privacy@contractguard.ai
                <br />
                General Support: support@contractguard.ai
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
