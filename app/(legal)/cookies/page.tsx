import { Geist } from "next/font/google";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about how ContractGuard AI uses cookies to improve your experience. Our cookie policy explains what cookies we use and how you can control them.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    title: "Cookie Policy - ContractGuard AI",
    description:
      "Learn about how ContractGuard AI uses cookies to improve your experience and how you can control them.",
    url: "/cookies",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Cookie Policy",
      },
    ],
  },
  twitter: {
    title: "Cookie Policy - ContractGuard AI",
    description:
      "Learn about how ContractGuard AI uses cookies to improve your experience.",
    images: [siteConfig.socialImage],
  },
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white mb-8">
          Cookie Policy
        </h1>

        <p className="text-sm text-black/60 dark:text-white/60 mb-8">
          Last updated: December 19, 2024
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              1. What Are Cookies?
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              Cookies are small text files that are stored on your device when
              you visit our website. They help us provide you with a better
              experience by remembering your preferences, analyzing how you use
              our site, and improving our services. Cookies are widely used by
              websites to make them work more efficiently and provide
              information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              2. How We Use Cookies
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              ContractGuard AI uses cookies to enhance your experience on our
              smart contract security analysis platform. We use cookies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70 mt-4">
              <li>Remember your preferences and settings</li>
              <li>Keep you logged in to your account</li>
              <li>Analyze how our website is used to improve performance</li>
              <li>Provide personalized content and features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Remember your theme preferences (dark/light mode)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              3. Types of Cookies We Use
            </h2>

            <div className="space-y-6">
              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Essential Cookies
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  These cookies are necessary for the website to function
                  properly and cannot be disabled.
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Session Management:</strong> Keep you logged in
                    during your visit
                  </li>
                  <li>
                    <strong>Security:</strong> Protect against cross-site
                    request forgery (CSRF)
                  </li>
                  <li>
                    <strong>Load Balancing:</strong> Distribute traffic across
                    our servers
                  </li>
                  <li>
                    <strong>Form Data:</strong> Remember form inputs to prevent
                    data loss
                  </li>
                </ul>
                <p className="text-sm text-black/60 dark:text-white/60 mt-3">
                  <strong>Duration:</strong> Session cookies (deleted when you
                  close your browser)
                </p>
              </div>

              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Functional Cookies
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  These cookies enhance functionality and personalization but
                  are not essential for basic website operation.
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Theme Preference:</strong> Remember your dark/light
                    mode choice
                  </li>
                  <li>
                    <strong>Language Settings:</strong> Store your preferred
                    language
                  </li>
                  <li>
                    <strong>User Preferences:</strong> Remember your dashboard
                    layout and settings
                  </li>
                  <li>
                    <strong>Cookie Consent:</strong> Remember your cookie
                    preferences
                  </li>
                </ul>
                <p className="text-sm text-black/60 dark:text-white/60 mt-3">
                  <strong>Duration:</strong> Up to 1 year
                </p>
              </div>

              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Analytics Cookies
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  These cookies help us understand how visitors interact with
                  our website to improve performance and user experience.
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Usage Statistics:</strong> Track page views, time
                    spent, and user journeys
                  </li>
                  <li>
                    <strong>Performance Monitoring:</strong> Identify slow pages
                    and technical issues
                  </li>
                  <li>
                    <strong>Feature Usage:</strong> Understand which features
                    are most popular
                  </li>
                  <li>
                    <strong>Error Tracking:</strong> Monitor and fix bugs and
                    errors
                  </li>
                </ul>
                <p className="text-sm text-black/60 dark:text-white/60 mt-3">
                  <strong>Duration:</strong> Up to 2 years
                </p>
              </div>

              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Marketing Cookies
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  These cookies are used to deliver relevant advertisements and
                  measure the effectiveness of our marketing campaigns.
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Ad Targeting:</strong> Show relevant ads based on
                    your interests
                  </li>
                  <li>
                    <strong>Campaign Tracking:</strong> Measure the
                    effectiveness of our marketing
                  </li>
                  <li>
                    <strong>Social Media Integration:</strong> Enable sharing on
                    social platforms
                  </li>
                  <li>
                    <strong>Retargeting:</strong> Show ads to users who have
                    visited our site
                  </li>
                </ul>
                <p className="text-sm text-black/60 dark:text-white/60 mt-3">
                  <strong>Duration:</strong> Up to 1 year
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              4. Third-Party Cookies
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                We use third-party services that may set their own cookies:
              </p>

              <div className="space-y-4">
                <div className="p-4 border border-black/10 dark:border-white/10 rounded-lg">
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    Google Analytics
                  </h4>
                  <p className="text-sm text-black/70 dark:text-white/70 mb-2">
                    Helps us understand website traffic and user behavior
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      className="underline hover:no-underline"
                    >
                      https://policies.google.com/privacy
                    </a>
                  </p>
                </div>

                <div className="p-4 border border-black/10 dark:border-white/10 rounded-lg">
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    Stripe
                  </h4>
                  <p className="text-sm text-black/70 dark:text-white/70 mb-2">
                    Payment processing and fraud prevention
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://stripe.com/privacy"
                      className="underline hover:no-underline"
                    >
                      https://stripe.com/privacy
                    </a>
                  </p>
                </div>

                <div className="p-4 border border-black/10 dark:border-white/10 rounded-lg">
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    Vercel Analytics
                  </h4>
                  <p className="text-sm text-black/70 dark:text-white/70 mb-2">
                    Website performance and usage analytics
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    <strong>Privacy Policy:</strong>{" "}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      className="underline hover:no-underline"
                    >
                      https://vercel.com/legal/privacy-policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              5. Managing Your Cookie Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Cookie Consent Banner
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed">
                  When you first visit our website, you'll see a cookie consent
                  banner. You can choose which types of cookies to accept:
                </p>
                <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70 mt-3">
                  <li>
                    <strong>Accept All:</strong> Allow all cookies for the best
                    experience
                  </li>
                  <li>
                    <strong>Essential Only:</strong> Only allow necessary
                    cookies
                  </li>
                  <li>
                    <strong>Customize:</strong> Choose specific cookie
                    categories
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Browser Settings
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  You can also manage cookies through your browser settings:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white mb-2">
                      Chrome
                    </h4>
                    <p className="text-sm text-black/70 dark:text-white/70">
                      Settings → Privacy and security → Cookies and other site
                      data
                    </p>
                  </div>

                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white mb-2">
                      Firefox
                    </h4>
                    <p className="text-sm text-black/70 dark:text-white/70">
                      Settings → Privacy & Security → Cookies and Site Data
                    </p>
                  </div>

                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white mb-2">
                      Safari
                    </h4>
                    <p className="text-sm text-black/70 dark:text-white/70">
                      Preferences → Privacy → Manage Website Data
                    </p>
                  </div>

                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white mb-2">
                      Edge
                    </h4>
                    <p className="text-sm text-black/70 dark:text-white/70">
                      Settings → Cookies and site permissions → Cookies and site
                      data
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  Opt-Out Links
                </h3>
                <p className="text-black/70 dark:text-white/70 leading-relaxed mb-3">
                  You can opt out of specific third-party cookies:
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/70 dark:text-white/70">
                  <li>
                    <strong>Google Analytics:</strong>{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      className="underline hover:no-underline"
                    >
                      Google Analytics Opt-out Browser Add-on
                    </a>
                  </li>
                  <li>
                    <strong>Google Ads:</strong>{" "}
                    <a
                      href="https://adssettings.google.com/"
                      className="underline hover:no-underline"
                    >
                      Google Ad Settings
                    </a>
                  </li>
                  <li>
                    <strong>Facebook:</strong>{" "}
                    <a
                      href="https://www.facebook.com/settings?tab=ads"
                      className="underline hover:no-underline"
                    >
                      Facebook Ad Preferences
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              6. Impact of Disabling Cookies
            </h2>
            <div className="space-y-4">
              <p className="text-black/70 dark:text-white/70 leading-relaxed">
                If you disable cookies, some features of our website may not
                work properly:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/70 dark:text-white/70">
                <li>You may need to log in repeatedly</li>
                <li>Your preferences won't be remembered</li>
                <li>Some features may not function correctly</li>
                <li>We won't be able to provide personalized content</li>
                <li>
                  Our analytics won't track your usage (which helps us improve)
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              7. Updates to This Cookie Policy
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will notify you of any material changes by
              posting the updated policy on this page and updating the "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              8. Contact Us
            </h2>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
            </p>
            <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
              <p className="text-black/70 dark:text-white/70">
                <strong>Data Protection Officer</strong>
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
