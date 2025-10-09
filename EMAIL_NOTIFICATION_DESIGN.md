# Email Notification System - Design Specification

**Project:** ContractGuard AI
**Date:** January 2025
**Version:** 1.0.0

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Email Types](#email-types)
3. [Architecture](#architecture)
4. [Email Templates](#email-templates)
5. [Implementation Guide](#implementation-guide)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Checklist](#deployment-checklist)

---

## System Overview

### Purpose

Implement a professional email notification system for ContractGuard AI to:
- Welcome new users and guide onboarding
- Confirm payment transactions
- Alert users to failed payments
- Acknowledge subscription cancellations

### Technical Stack

- **Email Provider:** Resend (already integrated)
- **Template Engine:** React Email + custom HTML
- **Rendering:** @react-email/render
- **Integration:** EmailService class (already exists)

### Design Principles

1. **Professional & Branded** - Consistent with ContractGuard AI visual identity
2. **Mobile-Responsive** - Optimized for all devices
3. **Actionable** - Clear CTAs for each email type
4. **Informative** - Provide context and next steps
5. **Trustworthy** - Security-conscious language and design

---

## Email Types

### 1. Welcome Email

**Trigger:** User signs up (after email verification)

**Purpose:**
- Congratulate on joining
- Explain what they can do
- Guide to first scan
- Highlight free tier benefits

**CTA:** Start Your First Scan

**Timing:** Immediate (within 1 minute of verification)

---

### 2. Payment Confirmation Email

**Trigger:** Successful subscription payment (Stripe webhook: `invoice.paid`)

**Purpose:**
- Confirm payment received
- Show invoice details
- Highlight upgraded features
- Provide receipt download link

**CTA:** Access Your Pro Dashboard

**Timing:** Immediate (within 1 minute of payment)

---

### 3. Failed Payment Notification

**Trigger:** Payment failure (Stripe webhook: `invoice.payment_failed`)

**Purpose:**
- Alert user to payment issue
- Explain consequences (downgrade timeline)
- Provide update payment method link
- Offer support contact

**CTA:** Update Payment Method

**Timing:** Immediate (within 1 minute of failure)

**Urgency:** High (clear but not alarmist)

---

### 4. Subscription Cancellation Email

**Trigger:** User cancels subscription (Stripe webhook: `customer.subscription.deleted`)

**Purpose:**
- Acknowledge cancellation
- Confirm what happens next
- Share what they'll miss
- Offer easy reactivation

**CTA:** Reactivate Subscription (optional)

**Timing:** Immediate (within 1 minute of cancellation)

**Tone:** Understanding but encouraging retention

---

## Architecture

### Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Trigger Events                        │
├─────────────────────────────────────────────────────────────┤
│  • User signs up (auth flow)                                │
│  • Payment succeeds (Stripe webhook)                        │
│  • Payment fails (Stripe webhook)                           │
│  • Subscription cancelled (Stripe webhook)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    EmailService Class                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • sendWelcomeEmail()                                │  │
│  │  • sendPaymentConfirmation()                         │  │
│  │  • sendPaymentFailedNotification()                   │  │
│  │  • sendCancellationEmail()                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Email Templates                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • WelcomeEmail.tsx                                  │  │
│  │  • PaymentConfirmationEmail.tsx                      │  │
│  │  • PaymentFailedEmail.tsx                            │  │
│  │  • CancellationEmail.tsx                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Resend API                               │
│  • Delivers emails to recipients                            │
│  • Handles bounces and failures                             │
│  • Provides delivery tracking                               │
└─────────────────────────────────────────────────────────────┘
```

### Service Integration Points

**1. Auth Flow (Welcome Email)**
```typescript
// After email verification
await emailService.sendWelcomeEmail(user.email, {
  firstName: user.firstName,
  scansRemaining: 3
});
```

**2. Stripe Webhooks (Payment Emails)**
```typescript
// In /api/stripe/webhook
switch (event.type) {
  case 'invoice.paid':
    await emailService.sendPaymentConfirmation(customer.email, {
      amount: invoice.amount_paid,
      invoiceId: invoice.id,
      tier: subscription.metadata.tier
    });
    break;

  case 'invoice.payment_failed':
    await emailService.sendPaymentFailedNotification(customer.email, {
      amount: invoice.amount_due,
      nextAttempt: invoice.next_payment_attempt
    });
    break;

  case 'customer.subscription.deleted':
    await emailService.sendCancellationEmail(customer.email, {
      tier: subscription.metadata.tier,
      endDate: subscription.current_period_end
    });
    break;
}
```

### Error Handling

**Strategy:**
- Log all email failures
- Don't block main flow if email fails
- Implement retry queue for failed emails (future)
- Alert admins for persistent failures

**Implementation:**
```typescript
try {
  await emailService.sendWelcomeEmail(email, context);
} catch (error) {
  console.error('[Email] Failed to send welcome email:', error);
  // Don't throw - continue with main flow
  // TODO: Add to retry queue
}
```

---

## Email Templates

### Common Design Elements

**Color Palette:**
- Primary: `#3b82f6` (Blue)
- Secondary: `#2563eb` (Dark Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Text: `#333333` (Dark Gray)
- Background: `#f5f5f5` (Light Gray)

**Typography:**
- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`
- Heading: 28px, bold
- Body: 16px, regular
- Small: 14px, regular

**Layout:**
- Max Width: 600px
- Container Padding: 40px 30px
- Border Radius: 8px
- Button Height: 48px

### 1. Welcome Email Template

**Subject:** Welcome to ContractGuard AI! 🛡️

**Preview Text:** Start scanning smart contracts for scams and rug pulls

**Structure:**

```
┌─────────────────────────────────────────────────┐
│          HEADER (Gradient Blue)                 │
│   🛡️ Welcome to ContractGuard AI!               │
└─────────────────────────────────────────────────┘
│                                                 │
│  Hi [First Name],                               │
│                                                 │
│  Welcome to ContractGuard AI! You're now        │
│  protected against smart contract scams.        │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │   [Start Your First Scan] (Button)  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  What You Can Do:                               │
│  ✓ Scan 3 contracts per day (Free tier)        │
│  ✓ Get AI-powered risk assessments             │
│  ✓ Detect honeypots and rug pulls              │
│  ✓ Share results on social media               │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  💡 Pro Tip: Upgrade to Pro for     │       │
│  │  100 scans/day at $29/month         │       │
│  │  [Upgrade Now] (Link)               │       │
│  └─────────────────────────────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
│          FOOTER (Gray Background)               │
│   Questions? support@contractguard.ai           │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Friendly greeting with personalization
- Clear benefit statements
- Primary CTA (Start Scanning)
- Secondary CTA (Upgrade)
- Support contact

---

### 2. Payment Confirmation Email

**Subject:** Payment Received - Thank You! 💳

**Preview Text:** Your Pro subscription is now active

**Structure:**

```
┌─────────────────────────────────────────────────┐
│          HEADER (Gradient Green)                │
│   ✅ Payment Confirmed!                          │
└─────────────────────────────────────────────────┘
│                                                 │
│  Hi [First Name],                               │
│                                                 │
│  Thank you for upgrading to Pro! Your payment   │
│  has been successfully processed.               │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  Invoice Details                    │       │
│  │  Amount: $29.00                     │       │
│  │  Plan: Pro (100 scans/day)          │       │
│  │  Billed: Monthly                    │       │
│  │  Date: Jan 8, 2025                  │       │
│  │  Invoice #: INV-12345               │       │
│  │  [Download Receipt] (Link)          │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │   [Access Your Pro Dashboard]       │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Your Pro Features:                             │
│  ✓ 100 scans per day                            │
│  ✓ Advanced AI analysis                         │
│  ✓ Historical analysis                          │
│  ✓ Priority support                             │
│  ✓ No ads                                       │
│                                                 │
│  Next Payment: Feb 8, 2025                      │
│  [Manage Subscription] (Link)                   │
│                                                 │
└─────────────────────────────────────────────────┘
│          FOOTER                                 │
│   Questions? support@contractguard.ai           │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Clear payment confirmation
- Invoice details box
- Download receipt link
- Feature list
- Next billing date
- Manage subscription link

---

### 3. Failed Payment Notification

**Subject:** Action Required: Payment Failed ⚠️

**Preview Text:** Update your payment method to continue your subscription

**Structure:**

```
┌─────────────────────────────────────────────────┐
│          HEADER (Gradient Amber)                │
│   ⚠️ Payment Failed                              │
└─────────────────────────────────────────────────┘
│                                                 │
│  Hi [First Name],                               │
│                                                 │
│  We weren't able to process your payment for    │
│  ContractGuard AI Pro subscription.             │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  ⏰ Your subscription will be       │       │
│  │  downgraded to Free tier in 3 days  │       │
│  │  if payment is not updated.         │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │   [Update Payment Method] (Button)  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Failed Payment Details:                        │
│  • Amount: $29.00                               │
│  • Reason: Card declined                        │
│  • Next Attempt: Jan 10, 2025                   │
│                                                 │
│  What Happens Next:                             │
│  1. We'll retry in 2 days                       │
│  2. If unsuccessful, downgrade to Free          │
│  3. You'll lose Pro features                    │
│                                                 │
│  Need Help?                                     │
│  Contact support@contractguard.ai               │
│                                                 │
└─────────────────────────────────────────────────┘
│          FOOTER                                 │
│   This is an automated notification             │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Clear but not alarmist tone
- Prominent warning box
- Primary CTA (Update Payment)
- Failure reason
- Timeline of consequences
- Support contact

---

### 4. Subscription Cancellation Email

**Subject:** We're Sorry to See You Go 😢

**Preview Text:** Your subscription has been cancelled successfully

**Structure:**

```
┌─────────────────────────────────────────────────┐
│          HEADER (Gradient Gray)                 │
│   Subscription Cancelled                        │
└─────────────────────────────────────────────────┘
│                                                 │
│  Hi [First Name],                               │
│                                                 │
│  Your ContractGuard AI Pro subscription has     │
│  been cancelled as requested.                   │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  Your Pro access continues until:   │       │
│  │  February 8, 2025                   │       │
│  │  After that, you'll return to Free  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  What You'll Miss:                              │
│  ✗ 100 scans per day (back to 3/day)           │
│  ✗ Advanced AI analysis                         │
│  ✗ Historical analysis                          │
│  ✗ Priority support                             │
│                                                 │
│  Changed Your Mind?                             │
│  You can reactivate anytime!                    │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │   [Reactivate Subscription] (Button)│       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  We'd love to hear why you left:                │
│  [Share Feedback] (Link) (2 min survey)         │
│                                                 │
│  Thank you for using ContractGuard AI! 🙏       │
│                                                 │
└─────────────────────────────────────────────────┘
│          FOOTER                                 │
│   Questions? support@contractguard.ai           │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Acknowledges cancellation
- Shows access end date
- Lists what they'll lose
- Reactivation CTA
- Feedback survey link
- Grateful tone

---

## Implementation Guide

### Phase 1: React Email Templates (Recommended Approach)

**Benefits:**
- Type-safe components
- Reusable design system
- Preview in development
- Version control for templates

**1. Create Email Components**

```bash
mkdir -p emails/components
```

**File Structure:**
```
emails/
├── components/
│   ├── EmailLayout.tsx       # Shared layout
│   ├── EmailHeader.tsx       # Header component
│   ├── EmailButton.tsx       # CTA button
│   ├── EmailFooter.tsx       # Footer component
│   └── InfoBox.tsx           # Info/warning boxes
├── WelcomeEmail.tsx
├── PaymentConfirmationEmail.tsx
├── PaymentFailedEmail.tsx
└── CancellationEmail.tsx
```

**2. Example: EmailLayout Component**

```tsx
// emails/components/EmailLayout.tsx
import { Html, Head, Body, Container, Preview } from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <title>ContractGuard AI</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    margin: 0,
    padding: '40px 0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
};
```

**3. Example: Welcome Email**

```tsx
// emails/WelcomeEmail.tsx
import { EmailLayout } from './components/EmailLayout';
import { EmailHeader } from './components/EmailHeader';
import { EmailButton } from './components/EmailButton';
import { EmailFooter } from './components/EmailFooter';
import { Text, Section } from '@react-email/components';

interface WelcomeEmailProps {
  firstName?: string;
  scansRemaining: number;
}

export function WelcomeEmail({
  firstName = 'there',
  scansRemaining
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Start scanning smart contracts for scams and rug pulls">
      <EmailHeader
        title="🛡️ Welcome to ContractGuard AI!"
        color="blue"
      />

      <Section style={{ padding: '40px 30px' }}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          Welcome to ContractGuard AI! You're now protected against smart contract scams, honeypots, and rug pulls.
        </Text>

        <EmailButton
          href={`${process.env.NEXT_PUBLIC_SITE_URL}/`}
          text="Start Your First Scan"
        />

        <Text style={styles.heading}>What You Can Do:</Text>
        <ul style={styles.list}>
          <li>Scan {scansRemaining} contracts per day (Free tier)</li>
          <li>Get AI-powered risk assessments</li>
          <li>Detect honeypots and rug pulls</li>
          <li>Share results on social media</li>
        </ul>

        <div style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 <strong>Pro Tip:</strong> Upgrade to Pro for 100 scans/day at just $29/month
          </Text>
          <EmailButton
            href={`${process.env.NEXT_PUBLIC_SITE_URL}/pricing`}
            text="Upgrade Now"
            variant="secondary"
            style={{ marginTop: '16px' }}
          />
        </div>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}

const styles = {
  greeting: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 20px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    margin: '0 0 20px',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '32px 0 16px',
  },
  list: {
    lineHeight: '1.8',
    paddingLeft: '20px',
    margin: '0 0 24px',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '32px',
  },
  infoText: {
    margin: 0,
    fontSize: '15px',
  },
};
```

**4. Render in EmailService**

```typescript
// lib/services/email.service.ts
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { PaymentConfirmationEmail } from '@/emails/PaymentConfirmationEmail';
import { PaymentFailedEmail } from '@/emails/PaymentFailedEmail';
import { CancellationEmail } from '@/emails/CancellationEmail';

export class EmailService {
  async sendWelcomeEmail(
    to: string,
    context: {
      firstName?: string;
      scansRemaining: number;
    }
  ): Promise<void> {
    const html = render(<WelcomeEmail {...context} />);

    await resend.emails.send({
      from: 'ContractGuard AI <noreply@contractguard.ai>',
      to,
      subject: 'Welcome to ContractGuard AI! 🛡️',
      html,
    });
  }
}
```

### Phase 2: Enhanced EmailService Methods

**Add new email methods:**

```typescript
// lib/services/email.service.ts

export class EmailService {
  private serviceName = 'EmailService';

  /**
   * Send welcome email after email verification
   */
  async sendWelcomeEmail(
    to: string,
    context: {
      firstName?: string;
      scansRemaining: number;
    }
  ): Promise<void> {
    try {
      const html = render(<WelcomeEmail {...context} />);

      await resend.emails.send({
        from: 'ContractGuard AI <noreply@contractguard.ai>',
        to,
        subject: 'Welcome to ContractGuard AI! 🛡️',
        html,
      });

      console.log(`[${this.serviceName}] Welcome email sent to ${to}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send welcome email:`, error);
      // Don't throw - email failure shouldn't block main flow
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    to: string,
    context: {
      firstName?: string;
      amount: number;
      invoiceId: string;
      tier: string;
      nextPaymentDate: Date;
      receiptUrl: string;
    }
  ): Promise<void> {
    try {
      const html = render(<PaymentConfirmationEmail {...context} />);

      await resend.emails.send({
        from: 'ContractGuard AI <billing@contractguard.ai>',
        to,
        subject: 'Payment Received - Thank You! 💳',
        html,
      });

      console.log(`[${this.serviceName}] Payment confirmation sent to ${to}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send payment confirmation:`, error);
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(
    to: string,
    context: {
      firstName?: string;
      amount: number;
      failureReason: string;
      nextAttemptDate: Date;
      updatePaymentUrl: string;
    }
  ): Promise<void> {
    try {
      const html = render(<PaymentFailedEmail {...context} />);

      await resend.emails.send({
        from: 'ContractGuard AI <billing@contractguard.ai>',
        to,
        subject: 'Action Required: Payment Failed ⚠️',
        html,
        priority: 'high', // Mark as important
      });

      console.log(`[${this.serviceName}] Payment failed notification sent to ${to}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send payment failed notification:`, error);
    }
  }

  /**
   * Send subscription cancellation email
   */
  async sendCancellationEmail(
    to: string,
    context: {
      firstName?: string;
      tier: string;
      accessEndDate: Date;
      reactivateUrl: string;
      feedbackUrl: string;
    }
  ): Promise<void> {
    try {
      const html = render(<CancellationEmail {...context} />);

      await resend.emails.send({
        from: 'ContractGuard AI <noreply@contractguard.ai>',
        to,
        subject: "We're Sorry to See You Go 😢",
        html,
      });

      console.log(`[${this.serviceName}] Cancellation email sent to ${to}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send cancellation email:`, error);
    }
  }
}
```

### Phase 3: Integration Points

**1. Welcome Email - After Email Verification**

```typescript
// app/handler/email-verification/route.ts (or wherever verification happens)

// After successful verification
const user = await db.query.users.findFirst({
  where: eq(users.email, email)
});

if (user) {
  const emailService = new EmailService();
  await emailService.sendWelcomeEmail(user.email, {
    firstName: user.firstName,
    scansRemaining: 3
  });
}
```

**2. Payment Emails - Stripe Webhooks**

```typescript
// app/api/stripe/webhook/route.ts

switch (event.type) {
  case 'invoice.paid': {
    const invoice = event.data.object as Stripe.Invoice;
    const customer = await stripe.customers.retrieve(invoice.customer as string);

    const emailService = new EmailService();
    await emailService.sendPaymentConfirmation(
      customer.email!,
      {
        firstName: customer.name?.split(' ')[0],
        amount: invoice.amount_paid / 100,
        invoiceId: invoice.id,
        tier: invoice.subscription?.metadata?.tier || 'pro',
        nextPaymentDate: new Date(invoice.subscription?.current_period_end * 1000),
        receiptUrl: invoice.hosted_invoice_url || ''
      }
    );
    break;
  }

  case 'invoice.payment_failed': {
    const invoice = event.data.object as Stripe.Invoice;
    const customer = await stripe.customers.retrieve(invoice.customer as string);

    const emailService = new EmailService();
    await emailService.sendPaymentFailedNotification(
      customer.email!,
      {
        firstName: customer.name?.split(' ')[0],
        amount: invoice.amount_due / 100,
        failureReason: invoice.last_finalization_error?.message || 'Card declined',
        nextAttemptDate: new Date(invoice.next_payment_attempt * 1000),
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?update_payment=true`
      }
    );
    break;
  }

  case 'customer.subscription.deleted': {
    const subscription = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    const emailService = new EmailService();
    await emailService.sendCancellationEmail(
      customer.email!,
      {
        firstName: customer.name?.split(' ')[0],
        tier: subscription.metadata.tier || 'pro',
        accessEndDate: new Date(subscription.current_period_end * 1000),
        reactivateUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
        feedbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/feedback?reason=cancellation`
      }
    );
    break;
  }
}
```

---

## Testing Strategy

### 1. Email Preview (Development)

**Setup React Email Dev Server:**

```bash
# Add script to package.json
"scripts": {
  "email:dev": "email dev"
}

# Run preview server
npm run email:dev
```

**Preview at:** `http://localhost:3000/preview`

### 2. Test Email Sends (Development)

**Create Test Script:**

```typescript
// scripts/test-emails.ts
import { EmailService } from '@/lib/services/email.service';

async function testEmails() {
  const emailService = new EmailService();
  const testEmail = 'your-email@example.com';

  console.log('Testing Welcome Email...');
  await emailService.sendWelcomeEmail(testEmail, {
    firstName: 'Test',
    scansRemaining: 3
  });

  console.log('Testing Payment Confirmation...');
  await emailService.sendPaymentConfirmation(testEmail, {
    firstName: 'Test',
    amount: 29.00,
    invoiceId: 'inv_test_123',
    tier: 'pro',
    nextPaymentDate: new Date('2025-02-08'),
    receiptUrl: 'https://example.com/receipt'
  });

  console.log('Testing Payment Failed Notification...');
  await emailService.sendPaymentFailedNotification(testEmail, {
    firstName: 'Test',
    amount: 29.00,
    failureReason: 'Card declined',
    nextAttemptDate: new Date('2025-01-10'),
    updatePaymentUrl: 'https://example.com/update-payment'
  });

  console.log('Testing Cancellation Email...');
  await emailService.sendCancellationEmail(testEmail, {
    firstName: 'Test',
    tier: 'pro',
    accessEndDate: new Date('2025-02-08'),
    reactivateUrl: 'https://example.com/pricing',
    feedbackUrl: 'https://example.com/feedback'
  });

  console.log('All test emails sent!');
}

testEmails().catch(console.error);
```

**Run:**
```bash
tsx scripts/test-emails.ts
```

### 3. Stripe Webhook Testing

**Use Stripe CLI:**

```bash
# Listen to webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

### 4. Email Deliverability Testing

**Tools:**
- [Mail Tester](https://www.mail-tester.com/) - Spam score
- [Litmus](https://litmus.com/) - Email client compatibility
- [Email on Acid](https://www.emailonacid.com/) - Comprehensive testing

**Checklist:**
- [ ] Test in Gmail
- [ ] Test in Outlook
- [ ] Test in Apple Mail
- [ ] Test on mobile devices
- [ ] Check spam score
- [ ] Verify all links work
- [ ] Test with/without images
- [ ] Check dark mode rendering

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables Set:**
  - [ ] `RESEND_API_KEY` configured
  - [ ] `NEXT_PUBLIC_SITE_URL` correct for production

- [ ] **Email Templates Tested:**
  - [ ] Welcome email renders correctly
  - [ ] Payment confirmation renders correctly
  - [ ] Payment failed renders correctly
  - [ ] Cancellation email renders correctly

- [ ] **Integration Points Verified:**
  - [ ] Welcome email triggers after verification
  - [ ] Payment emails trigger on Stripe webhooks
  - [ ] Error handling works (email failures don't block flow)

- [ ] **Resend Configuration:**
  - [ ] Domain verified (if using custom domain)
  - [ ] SPF/DKIM records configured
  - [ ] Sender email approved

### Post-Deployment

- [ ] **Monitor Email Delivery:**
  - [ ] Check Resend dashboard for delivery rates
  - [ ] Monitor bounce rates
  - [ ] Check spam complaints

- [ ] **Test Production Flow:**
  - [ ] Send test welcome email
  - [ ] Complete test payment (test mode)
  - [ ] Trigger test payment failure
  - [ ] Test cancellation flow

- [ ] **Set Up Alerts:**
  - [ ] Email delivery failure alerts
  - [ ] High bounce rate alerts
  - [ ] Spam complaint alerts

---

## Best Practices

### Email Design

1. **Keep it Simple** - One primary CTA per email
2. **Mobile-First** - 60% of emails opened on mobile
3. **Alt Text** - Always include for images
4. **Plain Text Version** - Fallback for email clients
5. **Unsubscribe Link** - Include for marketing emails (not transactional)

### Email Copy

1. **Clear Subject Lines** - Under 50 characters
2. **Personalization** - Use first name when available
3. **Actionable** - Tell users what to do next
4. **Scannable** - Use bullets, bold, and short paragraphs
5. **Friendly Tone** - Professional but approachable

### Technical

1. **Error Handling** - Never block main flow on email failure
2. **Logging** - Log all email sends for debugging
3. **Rate Limiting** - Respect Resend limits (100 emails/day free tier)
4. **Idempotency** - Don't send duplicate emails
5. **Testing** - Test all email types before launch

---

## Metrics to Track

### Email Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Delivery Rate | >95% | <90% |
| Open Rate | >30% | <20% |
| Click-Through Rate | >15% | <10% |
| Bounce Rate | <2% | >5% |
| Spam Complaint Rate | <0.1% | >0.5% |

### Business Impact

- Welcome email → First scan conversion rate
- Payment confirmation → Satisfaction score
- Payment failed → Update success rate
- Cancellation → Reactivation rate

---

## Future Enhancements

### Phase 4: Advanced Features (Post-MVP)

1. **Email Personalization:**
   - Dynamic content based on user behavior
   - Scan history in emails
   - Personalized recommendations

2. **Email Automation:**
   - Onboarding drip campaign
   - Re-engagement emails
   - Upgrade reminder emails

3. **Email Analytics:**
   - PostHog integration for email events
   - A/B testing for subject lines
   - Conversion tracking

4. **Email Preferences:**
   - User email notification settings
   - Frequency controls
   - Opt-out management

5. **Additional Email Types:**
   - Weekly scan summary
   - Security alerts for monitored contracts
   - Feature announcements
   - Referral program emails

---

## Resources

### Documentation

- [Resend Docs](https://resend.com/docs)
- [React Email Docs](https://react.email/docs)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)

### Tools

- [React Email Preview](https://react.email)
- [Resend Dashboard](https://resend.com/dashboard)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)

### Design Inspiration

- [Really Good Emails](https://reallygoodemails.com/)
- [Mailchimp Templates](https://mailchimp.com/email-templates/)
- [Stripe Email Examples](https://www.stripe.com)

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Ready for Implementation

---

## Summary

This email notification system design provides:

✅ **4 Professional Email Templates** (Welcome, Payment Confirmation, Failed Payment, Cancellation)
✅ **Complete Architecture** with integration points
✅ **React Email Implementation** for maintainable templates
✅ **Enhanced EmailService** with new methods
✅ **Testing Strategy** for development and production
✅ **Deployment Checklist** for launch readiness
✅ **Best Practices** for email design and delivery
✅ **Metrics & Monitoring** for ongoing optimization

**Implementation Time:** 4-6 hours
**Dependencies:** Resend account, React Email setup
**Risk:** Low (email failures won't block main flows)
