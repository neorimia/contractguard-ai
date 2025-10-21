🎯 Paywall System Design Specification

Executive Summary

Design for implementing a tiered paywall system in CryptoScanInterface that shows summary results to free users while encouraging upgrades through Instant Reports ($4.99/contract) or Pro Subscription ($29/month).

  ---
📊 User Access Tiers

Access Level Matrix

| Tier             | Scan Limit   | Report Access | Features                                |
  |------------------|--------------|---------------|-----------------------------------------|
| Anonymous        | 3 total      | Summary only  | Basic risk score, top 3 issues          |
| Free Auth        | 3/day        | Summary only  | Same as anonymous + saved scans         |
| Soft Account     | Limited      | Summary only  | Same as free + migration path           |
| Instant Report   | Pay-per-scan | Full (24hr)   | Complete analysis for specific contract |
| Pro Subscription | Unlimited    | Full (all)    | All features + PDF export + API access  |

Access Decision Logic

type AccessLevel = 'summary' | 'full';

interface ReportAccess {
level: AccessLevel;
reason: 'subscription' | 'instant_credit' | 'free_tier';
expiresAt?: Date;
}

async function determineReportAccess(
userId: string,
contractAddress: string
): Promise<ReportAccess> {
// 1. Check subscription tier
if (user.tier === 'pro' || user.tier === 'enterprise') {
return { level: 'full', reason: 'subscription' };
}

    // 2. Check instant report purchase for this contract
    const instantReport = await db.query.instantReports.findFirst({
      where: and(
        eq(instantReports.userId, userId),
        eq(instantReports.contractAddress, contractAddress.toLowerCase()),
        eq(instantReports.isActive, true),
        gt(instantReports.expiresAt, new Date())
      )
    });

    if (instantReport) {
      return {
        level: 'full',
        reason: 'instant_credit',
        expiresAt: instantReport.expiresAt
      };
    }

    // 3. Default to summary
    return { level: 'summary', reason: 'free_tier' };
}

  ---
🗂️ Database Schema Changes

New Table: instantReports

// db/schema.ts
import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const instantReports = pgTable('instant_reports', {
id: serial('id').primaryKey(),
userId: varchar('user_id', { length: 255 }).notNull(),
contractAddress: varchar('contract_address', { length: 42 }).notNull(),
chain: varchar('chain', { length: 50 }).default('ethereum').notNull(),

    // Purchase details
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(), // 24 hours from purchase

    // Payment tracking
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    amountPaid: integer('amount_paid').notNull(), // In cents
    currency: varchar('currency', { length: 3 }).default('usd').notNull(),

    // Status
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Indexes for performance
export const instantReportsUserIdx = pgIndex('instant_reports_user_idx')
.on(instantReports.userId);
export const instantReportsContractIdx = pgIndex('instant_reports_contract_idx')
.on(instantReports.contractAddress);

Migration Command: npm run db:push

  ---
📡 API Response Structure

Modified /api/audit Response

// For PAID users (Pro subscription or valid instant report)
{
status: 'success',
data: {
// Full analysis data (unchanged)
riskScore: 85,
riskCategory: 'high',
summary: "Detailed AI-generated summary...",
issues: [...], // All security issues with full details
heuristicResults: [...], // Complete heuristic analysis
holderData: {...}, // Full holder distribution
liquidityData: {...}, // Complete liquidity analysis
recommendation: "Detailed recommendation..."
},
metadata: {
accessType: 'pro' | 'instant_credit',
hasFullAccess: true,
reportExpiresAt?: Date, // For instant credits only
scansRemaining: number
}
}

// For FREE users (Anonymous, free auth, soft account)
{
status: 'success',
data: {
// Limited preview data
riskScore: 85,
riskCategory: 'high',
summary: "This contract has been flagged as HIGH RISK. Unlock the full report to see detailed analysis.",

      topIssues: [
        {
          title: "Honeypot Function Detected",
          severity: "critical",
          category: "scam_pattern"
        },
        {
          title: "Ownership Not Renounced",
          severity: "high",
          category: "centralization"
        },
        {
          title: "No Liquidity Lock Found",
          severity: "high",
          category: "rug_pull_risk"
        }
      ], // Only top 3 critical issues (titles only)

      basicInfo: {
        contractVerified: true,
        holderCountRange: "1,000 - 5,000",
        liquidityStatus: "Unlocked",
        tokenAge: "3 days"
      },

      previewMessage: "🔒 Unlock full report to see: Detailed issue analysis • Holder distribution charts • Liquidity timeline • AI recommendations • PDF export"
    },
    metadata: {
      accessType: 'free' | 'anonymous',
      hasFullAccess: false,

      upgradeOptions: {
        instantReport: {
          price: 4.99,
          currency: 'USD',
          description: 'One-time unlock for this contract (24hr access)',
          features: ['Full security analysis', 'All heuristic results', 'Holder charts', 'Liquidity data']
        },
        subscription: {
          price: 29,
          currency: 'USD',
          interval: 'month',
          description: 'Unlimited scans with full reports',
          features: ['Unlimited full reports', 'PDF export', 'Priority analysis', 'API access']
        }
      },

      scansRemaining: number
    }
}

  ---
🎨 Component Architecture

Component Hierarchy

CryptoScanInterface (existing - modified)
└── CryptoResultsDisplay (modified)
├── SummaryReportView (new)
│   ├── RiskScoreCard
│   ├── TopIssuesPreview
│   ├── LockedSectionPreview (repeatable)
│   └── UpgradeCTA (multiple placements)
└── FullReportView (refactored from existing)
├── Complete risk analysis
├── All heuristic results
├── Charts and visualizations
└── Export/share features

1. Modified CryptoScanInterface

Changes:
- Pass reportAccess metadata to CryptoResultsDisplay
- Handle upgrade modal state
- Track conversion events

// New state additions
const [reportAccess, setReportAccess] = useState<{
level: 'summary' | 'full';
reason: string;
expiresAt?: Date;
} | null>(null);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);

// In analyzeContract() after successful response:
setReportAccess(data.metadata);

// Pass to results:
<CryptoResultsDisplay
result={result}
contractAddress={address}
reportAccess={reportAccess}
onUpgradeClick={() => setShowUpgradeModal(true)}
/>

2. New Component: SummaryReportView

Purpose: Show limited preview with upgrade CTAs

File: components/crypto/SummaryReportView.tsx

interface SummaryReportViewProps {
riskScore: number;
riskCategory: string;
topIssues: Array<{
title: string;
severity: string;
category: string;
}>;
basicInfo: {
contractVerified: boolean;
holderCountRange: string;
liquidityStatus: string;
tokenAge: string;
};
previewMessage: string;
upgradeOptions: {
instantReport: { price: number; currency: string; description: string; features: string[] };
subscription: { price: number; currency: string; interval: string; description: string; features: string[] };
};
onUpgradeClick: (type: 'instant' | 'subscription') => void;
}

export function SummaryReportView({ ... }: SummaryReportViewProps) {
return (
<div className="space-y-8">
{/* Risk Score - Fully visible */}
<RiskScoreCard score={riskScore} category={riskCategory} />

        {/* Primary CTA */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Limited Preview - Unlock Full Analysis
                </h3>
                <p className="text-neutral-300 text-sm mb-4">
                  {previewMessage}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => onUpgradeClick('instant')}
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    Unlock This Report - ${upgradeOptions.instantReport.price}
                  </Button>
                  <Button 
                    onClick={() => onUpgradeClick('subscription')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Subscribe - ${upgradeOptions.subscription.price}/mo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Issues Preview */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Top Security Issues</h3>
          <div className="space-y-3">
            {topIssues.map((issue, idx) => (
              <Card key={idx} className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      issue.severity === 'critical' ? 'bg-red-500' :
                      issue.severity === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-white font-medium">{issue.title}</span>
                  </div>
                  <Badge variant="outline" className="text-neutral-400">
                    {issue.severity.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-neutral-400 text-sm mt-3 text-center">
            🔒 Unlock full report to see detailed explanations and {result.issues.length - 3} more issues
          </p>
        </div>

        {/* Locked Sections Preview */}
        <LockedSectionPreview 
          title="Holder Distribution Analysis"
          description="See who owns this token and detect whale concentration"
          icon="📊"
          onUnlock={() => onUpgradeClick('instant')}
        />

        <LockedSectionPreview 
          title="Liquidity & Lock Analysis"
          description="Track liquidity pools, lock status, and rug pull risk"
          icon="💧"
          onUnlock={() => onUpgradeClick('instant')}
        />

        <LockedSectionPreview 
          title="AI Security Assessment"
          description="Detailed AI-generated recommendations and risk mitigation strategies"
          icon="🤖"
          onUnlock={() => onUpgradeClick('instant')}
        />

        {/* Bottom CTA */}
        <Card className="bg-white text-black">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Don't Risk Your Investment</h3>
            <p className="text-neutral-700 mb-4">
              Join 1,000+ traders who protect themselves with full security analysis
            </p>
            <Button 
              onClick={() => onUpgradeClick('instant')}
              size="lg"
              className="bg-black text-white hover:bg-neutral-800"
            >
              Unlock Full Report Now - ${upgradeOptions.instantReport.price}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
}

3. New Component: LockedSectionPreview

Purpose: Reusable locked content preview with blur effect

File: components/crypto/LockedSectionPreview.tsx

interface LockedSectionPreviewProps {
title: string;
description: string;
icon: string;
onUnlock: () => void;
}

export function LockedSectionPreview({ title, description, icon, onUnlock }: LockedSectionPreviewProps) {
return (
<div className="relative">
<Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
<CardContent className="p-6">
{/* Blurred content */}
<div className="filter blur-sm select-none pointer-events-none opacity-50">
<div className="flex items-center gap-3 mb-4">
<span className="text-3xl">{icon}</span>
<h3 className="text-xl font-semibold text-white">{title}</h3>
</div>
<div className="h-48 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg" />
</div>

            {/* Unlock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center max-w-md px-6">
                <Lock className="h-12 w-12 text-white mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
                <p className="text-neutral-300 text-sm mb-4">{description}</p>
                <Button 
                  onClick={onUnlock}
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  Unlock Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
}

4. New Component: ReportUpgradeModal

Purpose: Payment modal with two purchase options

File: components/crypto/ReportUpgradeModal.tsx

interface ReportUpgradeModalProps {
isOpen: boolean;
onClose: () => void;
contractAddress: string;
chain: string;
upgradeOptions: {
instantReport: { price: number; currency: string; description: string; features: string[] };
subscription: { price: number; currency: string; interval: string; description: string; features: string[] };
};
}

export function ReportUpgradeModal({ isOpen, onClose, contractAddress, chain, upgradeOptions }: ReportUpgradeModalProps) {
const [loading, setLoading] = useState(false);
const [selectedOption, setSelectedOption] = useState<'instant' | 'subscription'>('instant');

    const handlePurchase = async () => {
      setLoading(true);
      try {
        if (selectedOption === 'instant') {
          // Create Stripe payment for instant report
          const response = await fetch('/api/payments/instant-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractAddress, chain })
          });
          const { checkoutUrl } = await response.json();
          window.location.href = checkoutUrl;
        } else {
          // Redirect to subscription checkout
          window.location.href = '/pricing?checkout=pro';
        }
      } catch (error) {
        console.error('Purchase error:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Unlock Full Security Analysis
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Choose how you want to access detailed contract analysis
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 my-6">
            {/* Instant Report Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedOption === 'instant' 
                  ? 'bg-white border-white' 
                  : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
              }`}
              onClick={() => setSelectedOption('instant')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={selectedOption === 'instant' ? 'default' : 'outline'}>
                    One-Time
                  </Badge>
                  {selectedOption === 'instant' && <Check className="h-5 w-5" />}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${
                  selectedOption === 'instant' ? 'text-black' : 'text-white'
                }`}>
                  Instant Report
                </h3>

                <div className="mb-4">
                  <span className={`text-4xl font-bold ${
                    selectedOption === 'instant' ? 'text-black' : 'text-white'
                  }`}>
                    ${upgradeOptions.instantReport.price}
                  </span>
                </div>

                <p className={`text-sm mb-4 ${
                  selectedOption === 'instant' ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  {upgradeOptions.instantReport.description}
                </p>

                <ul className="space-y-2">
                  {upgradeOptions.instantReport.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${
                      selectedOption === 'instant' ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      <Check className="h-4 w-4 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Subscription Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedOption === 'subscription' 
                  ? 'bg-white border-white' 
                  : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
              }`}
              onClick={() => setSelectedOption('subscription')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={selectedOption === 'subscription' ? 'default' : 'outline'}>
                    Best Value
                  </Badge>
                  {selectedOption === 'subscription' && <Check className="h-5 w-5" />}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${
                  selectedOption === 'subscription' ? 'text-black' : 'text-white'
                }`}>
                  Pro Subscription
                </h3>

                <div className="mb-4">
                  <span className={`text-4xl font-bold ${
                    selectedOption === 'subscription' ? 'text-black' : 'text-white'
                  }`}>
                    ${upgradeOptions.subscription.price}
                  </span>
                  <span className={`text-sm ${
                    selectedOption === 'subscription' ? 'text-neutral-700' : 'text-neutral-400'
                  }`}>
                    /month
                  </span>
                </div>

                <p className={`text-sm mb-4 ${
                  selectedOption === 'subscription' ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  {upgradeOptions.subscription.description}
                </p>

                <ul className="space-y-2">
                  {upgradeOptions.subscription.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${
                      selectedOption === 'subscription' ? 'text-neutral-700' : 'text-neutral-300'
                    }`}>
                      <Check className="h-4 w-4 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={loading}
              className="flex-1 bg-white text-black hover:bg-neutral-200"
            >
              {loading ? 'Processing...' : `Continue to Checkout`}
            </Button>
          </div>

          <p className="text-xs text-neutral-500 text-center mt-2">
            Secure payment powered by Stripe
          </p>
        </DialogContent>
      </Dialog>
    );
}

  ---
🔌 API Endpoints

1. New: /api/payments/instant-report

Purpose: Create Stripe checkout session for instant report purchase

// app/api/payments/instant-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth'; // Stack Auth

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: '2024-11-20.acacia'
});

export async function POST(req: NextRequest) {
try {
const user = await auth();
if (!user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

      const { contractAddress, chain } = await req.json();

      // Validate inputs
      if (!contractAddress || !chain) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Instant Contract Report',
              description: `Full security analysis for ${contractAddress.slice(0, 10)}...`,
            },
            unit_amount: 499, // $4.99 in cents
          },
          quantity: 1,
        }],
        metadata: {
          userId: user.id,
          contractAddress: contractAddress.toLowerCase(),
          chain,
          type: 'instant_report'
        },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/scan?success=true&contract=${contractAddress}&chain=${chain}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/scan?contract=${contractAddress}&chain=${chain}`,
      });

      return NextResponse.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error('Instant report payment error:', error);
      return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
    }
}

2. New: /api/webhooks/stripe

Purpose: Handle successful payments and create instant report records

// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { instantReports } from '@/db/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: '2024-11-20.acacia'
});

export async function POST(req: NextRequest) {
const body = await req.text();
const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === 'instant_report') {
        // Create instant report record
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour access

        await db.insert(instantReports).values({
          userId: session.metadata.userId,
          contractAddress: session.metadata.contractAddress,
          chain: session.metadata.chain,
          purchasedAt: new Date(),
          expiresAt,
          stripePaymentIntentId: session.payment_intent as string,
          amountPaid: session.amount_total!,
          currency: session.currency!,
          isActive: true
        });
      }
    }

    return NextResponse.json({ received: true });
}

3. Modified: /api/audit/route.ts

Changes: Add access level detection and conditional response

// Add this helper function at the top
async function determineReportAccess(userId: string, contractAddress: string) {
// Check subscription tier
const user = await db.query.users.findFirst({
where: eq(users.id, userId)
});

    if (user?.tier === 'pro' || user?.tier === 'enterprise') {
      return { level: 'full', reason: 'subscription' };
    }

    // Check instant report purchase
    const instantReport = await db.query.instantReports.findFirst({
      where: and(
        eq(instantReports.userId, userId),
        eq(instantReports.contractAddress, contractAddress.toLowerCase()),
        eq(instantReports.isActive, true),
        gt(instantReports.expiresAt, new Date())
      )
    });

    if (instantReport) {
      return {
        level: 'full',
        reason: 'instant_credit',
        expiresAt: instantReport.expiresAt
      };
    }

    return { level: 'summary', reason: 'free_tier' };
}

// In the main POST handler, after getting analysis results:
const reportAccess = user
? await determineReportAccess(user.id, contractAddress)
: { level: 'summary', reason: 'anonymous' };

if (reportAccess.level === 'summary') {
// Return limited data
return NextResponse.json({
status: 'success',
data: {
riskScore: result.riskScore,
riskCategory: result.riskCategory,
summary: "This contract has been flagged as " + result.riskCategory.toUpperCase() + " RISK. Unlock the full report to see detailed analysis.",
topIssues: result.issues
.sort((a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity))
.slice(0, 3)
.map(issue => ({
title: issue.title,
severity: issue.severity,
category: issue.category
})),
basicInfo: {
contractVerified: result.verified,
holderCountRange: getHolderRange(result.holderCount),
liquidityStatus: result.liquidityLocked ? 'Locked' : 'Unlocked',
tokenAge: calculateTokenAge(result.deployedAt)
},
previewMessage: "🔒 Unlock full report to see: Detailed issue analysis • Holder distribution charts • Liquidity timeline • AI recommendations • PDF export"
},
metadata: {
accessType: reportAccess.reason,
hasFullAccess: false,
upgradeOptions: {
instantReport: {
price: 4.99,
currency: 'USD',
description: 'One-time unlock for this contract (24hr access)',
features: ['Full security analysis', 'All heuristic results', 'Holder charts', 'Liquidity data']
},
subscription: {
price: 29,
currency: 'USD',
interval: 'month',
description: 'Unlimited scans with full reports',
features: ['Unlimited full reports', 'PDF export', 'Priority analysis', 'API access']
}
},
scansRemaining: user?.scansRemaining || 0
}
});
}

// For full access, return complete data (existing logic)

  ---
📈 Success Metrics & Analytics

Track These Events

// In analyzeContract() when summary shown
trackEvent('report_summary_viewed', {
contractAddress,
chain,
riskScore: result.riskScore,
userId: user?.id,
accessType: reportAccess.reason
});

// When upgrade CTA clicked
trackEvent('upgrade_cta_clicked', {
contractAddress,
chain,
ctaLocation: 'primary' | 'inline' | 'bottom',
optionType: 'instant' | 'subscription'
});

// When purchase completed
trackEvent('instant_report_purchased', {
contractAddress,
chain,
amountPaid: 4.99,
userId: user.id
});

Key Performance Indicators

1. Conversion Rates:
   - Summary view → Instant report purchase
   - Summary view → Subscription signup
   - Target: 5-10% conversion
2. Revenue Metrics:
   - Average revenue per user (ARPU)
   - Instant report revenue vs subscription revenue
   - Target: $5-10k MRR
3. User Behavior:
   - Time spent on summary vs full reports
   - CTA click rates by placement
   - Upgrade modal abandonment rate

  ---
🚀 Implementation Plan

⏺ Phase 1: Database & Backend (Days 1-2)

1. Add instantReports table to db/schema.ts
2. Run npm run db:push to apply schema
3. Create /api/payments/instant-report endpoint
4. Create /api/webhooks/stripe endpoint
5. Modify /api/audit to detect access level and return appropriate data

Phase 2: Core Components (Days 3-4)

1. Create SummaryReportView.tsx
2. Create LockedSectionPreview.tsx
3. Create ReportUpgradeModal.tsx
4. Modify CryptoResultsDisplay.tsx to route to appropriate view
5. Update CryptoScanInterface.tsx with upgrade modal state

Phase 3: Stripe Integration (Day 5)

1. Configure Stripe webhook endpoint
2. Test payment flow in Stripe test mode
3. Verify instant report record creation
4. Test 24-hour expiration logic
5. Add error handling for failed payments

Phase 4: Polish & Testing (Days 6-7)

1. Add loading states and animations
2. Mobile responsive testing
3. A/B test different CTA copy
4. Analytics integration
5. User acceptance testing
6. Production deployment

  ---
💰 Pricing Strategy

Instant Report: $4.99

- Positioning: "Know before you buy"
- Value: Saves potential losses of $100-$1000+
- Psychology: Low friction, immediate value
- Access: 24-hour window for specific contract

Pro Subscription: $29/month

- Positioning: "For serious traders"
- Value: Unlimited scans = cost effective after 6+ scans
- Psychology: Professional tool, recurring value
- Access: All contracts, all features, unlimited

Conversion Funnel

1. Free scan → See risk score + top issues
2. Realize need for details → Click upgrade
3. Choose instant ($4.99) vs subscription ($29)
4. Complete payment → Unlock full report
5. Get value → Convert to subscription for ongoing use

  ---
🎨 UX Principles

1. Transparency: Clearly show what's locked and why
2. Value First: Give enough free value to build trust
3. FOMO: Use blur effects and "what you're missing" messaging
4. Urgency: Emphasize immediate risk and need for details
5. Social Proof: Show user count and testimonials
6. Friction Reduction: One-click upgrades, saved payment methods
7. Mobile Optimized: 60%+ of crypto users on mobile

  ---
This design specification provides a complete blueprint for implementing a freemium paywall system that balances user value with revenue generation. The summary view provides enough information to demonstrate value while creating strong incentive to upgrade for detailed analysis.
