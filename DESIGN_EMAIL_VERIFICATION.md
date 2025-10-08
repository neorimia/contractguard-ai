# Email Verification System Design - ContractGuard AI

## Overview

This document outlines the email verification system for ContractGuard AI to ensure valid email addresses and improve security. The system integrates with the existing Stack Auth authentication while maintaining control over verification flow and user experience.

**Design Date**: 2025-10-06
**Status**: Design Complete - Ready for Implementation
**Integration**: Stack Auth + Custom Verification Handler

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Signup Flow                             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. User signs up via Stack Auth                                │
│     • Email/password OR OAuth (Google, GitHub)                  │
│     • Stack Auth creates user in neon_auth.users_sync           │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. AuthService.syncUser() creates ContractGuard user           │
│     • Sets emailVerified = false (for email/password)           │
│     • Sets emailVerified = true (for OAuth - pre-verified)      │
│     • Generates verification token (32 chars, secure random)    │
│     • Sets token expiry (24 hours from generation)              │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Email Verification Service sends email                      │
│     • Template: Welcome + verification link                     │
│     • Link: https://contractguard.ai/handler/email-verification│
│            ?code={verificationToken}                            │
│     • Provider: Resend.com (recommended) or SendGrid            │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. User clicks verification link in email                      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. GET /handler/email-verification?code={token}                │
│     • Validate token format                                     │
│     • Check token exists in database                            │
│     • Verify token not expired (< 24 hours)                     │
│     • Check token not already used                              │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ├─────────── Valid Token ─────────────┐
                    │                                      │
                    ▼                                      ▼
┌─────────────────────────────────────┐  ┌──────────────────────────────┐
│  6a. SUCCESS                        │  │  6b. FAILURE                 │
│  • Set emailVerified = true         │  │  • Show error message        │
│  • Clear verificationToken fields   │  │  • Offer resend option       │
│  • Redirect to dashboard with       │  │  • Log failed attempt        │
│    success message                  │  │                              │
└─────────────────────────────────────┘  └──────────────────────────────┘
```

---

## Database Schema Changes

### Updated `users` Table

Add three new fields to `db/schema.ts`:

```typescript
export const users = pgTable('users', {
    id: serial('id').primaryKey(),

    // Stack Auth Integration (existing)
    stackUserId: text('stack_user_id').notNull().unique(),
    email: text('email').notNull().unique(),

    // Email Verification (NEW)
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token').unique(),
    verificationTokenExpires: timestamp('verification_token_expires'),

    // Profile (existing)
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),

    // Business Logic (existing)
    tier: text('tier').notNull().default('free'),
    scansToday: integer('scans_today').default(0),
    scansResetAt: timestamp('scans_reset_at').defaultNow(),

    // Billing (existing)
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    subscriptionStatus: text('subscription_status'),

    // Timestamps (existing)
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
});
```

### Field Specifications

| Field | Type | Purpose | Constraints |
|-------|------|---------|-------------|
| `emailVerified` | boolean | Verification status | NOT NULL, default false |
| `verificationToken` | text | Single-use token | UNIQUE, nullable |
| `verificationTokenExpires` | timestamp | Token expiry | nullable |

### Indexes for Performance

```sql
-- Existing indexes
CREATE INDEX idx_users_stack_user_id ON public.users(stack_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- New index for verification
CREATE INDEX idx_users_verification_token ON public.users(verification_token)
WHERE verification_token IS NOT NULL;
```

---

## Token Management

### Token Generation

**Requirements**:
- Cryptographically secure random generation
- 32 characters, lowercase alphanumeric
- Unique across all users
- Single-use only

**Implementation**:
```typescript
import crypto from 'crypto';

function generateVerificationToken(): string {
    return crypto
        .randomBytes(16)
        .toString('hex')
        .toLowerCase();
}
```

**Example Token**: `caqg5425rw6txa4q946e5yejssq16jee84brvj6fxa4a0`

### Token Expiry

- **Default TTL**: 24 hours
- **Configurable**: Can extend to 48/72 hours if needed
- **Timezone**: UTC for consistency
- **Calculation**: `new Date(Date.now() + 24 * 60 * 60 * 1000)`

### Token Validation Rules

```typescript
interface TokenValidationResult {
    valid: boolean;
    error?: 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_ALREADY_USED' | 'INVALID_FORMAT';
    user?: User;
}

async function validateVerificationToken(token: string): Promise<TokenValidationResult> {
    // 1. Format validation
    if (!/^[a-z0-9]{32,}$/.test(token)) {
        return { valid: false, error: 'INVALID_FORMAT' };
    }

    // 2. Database lookup
    const user = await getUserByVerificationToken(token);
    if (!user) {
        return { valid: false, error: 'TOKEN_NOT_FOUND' };
    }

    // 3. Already verified check
    if (user.emailVerified) {
        return { valid: false, error: 'TOKEN_ALREADY_USED' };
    }

    // 4. Expiry check
    if (new Date() > new Date(user.verificationTokenExpires)) {
        return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    return { valid: true, user };
}
```

---

## Handler Route Design

### Route: `app/handler/email-verification/page.tsx`

**Type**: Server-Side Rendered Page (Next.js App Router)
**Method**: GET with query parameters
**URL Format**: `/handler/email-verification?code={token}`

### Implementation

```typescript
// app/handler/email-verification/page.tsx
import { redirect } from 'next/navigation';
import { AuthService } from '@/lib/services/auth.service';
import { VerificationSuccess } from '@/components/auth/VerificationSuccess';
import { VerificationError } from '@/components/auth/VerificationError';

interface PageProps {
    searchParams: {
        code?: string;
    };
}

export default async function EmailVerificationHandler({ searchParams }: PageProps) {
    const { code } = searchParams;

    // Missing code parameter
    if (!code) {
        return (
            <VerificationError
                error="MISSING_CODE"
                message="Verification link is invalid. Please check your email for the correct link."
            />
        );
    }

    const authService = new AuthService();

    try {
        // Validate and verify token
        const result = await authService.verifyEmail(code);

        if (result.success) {
            return (
                <VerificationSuccess
                    email={result.email}
                    redirectUrl="/dashboard"
                    redirectDelay={3000}
                />
            );
        } else {
            return (
                <VerificationError
                    error={result.error}
                    message={getErrorMessage(result.error)}
                    showResendButton={result.error === 'TOKEN_EXPIRED'}
                    email={result.email}
                />
            );
        }

    } catch (error) {
        console.error('Email verification error:', error);
        return (
            <VerificationError
                error="SERVER_ERROR"
                message="An unexpected error occurred. Please try again or contact support."
            />
        );
    }
}

function getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
        'TOKEN_NOT_FOUND': 'This verification link is invalid or has already been used.',
        'TOKEN_EXPIRED': 'This verification link has expired. Please request a new one.',
        'TOKEN_ALREADY_USED': 'This email has already been verified. You can log in now.',
        'INVALID_FORMAT': 'The verification link format is invalid.',
    };
    return messages[error] || 'Verification failed. Please try again.';
}
```

### Success Page Component

```typescript
// components/auth/VerificationSuccess.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    email: string;
    redirectUrl: string;
    redirectDelay: number;
}

export function VerificationSuccess({ email, redirectUrl, redirectDelay }: Props) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(redirectDelay / 1000);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(redirectUrl);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router, redirectUrl]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Email Verified Successfully!
                </h1>
                <p className="mt-2 text-gray-600">
                    Your email <span className="font-semibold">{email}</span> has been verified.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    Redirecting to dashboard in {countdown} seconds...
                </p>
                <Button
                    onClick={() => router.push(redirectUrl)}
                    className="mt-6 w-full"
                >
                    Go to Dashboard Now
                </Button>
            </div>
        </div>
    );
}
```

### Error Page Component

```typescript
// components/auth/VerificationError.tsx
'use client';

import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
    error: string;
    message: string;
    showResendButton?: boolean;
    email?: string;
}

export function VerificationError({ error, message, showResendButton, email }: Props) {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        if (!email) return;

        setResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResent(true);
            }
        } catch (error) {
            console.error('Resend error:', error);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Verification Failed
                </h1>
                <p className="mt-2 text-gray-600">{message}</p>

                {showResendButton && !resent && (
                    <Button
                        onClick={handleResend}
                        disabled={resending}
                        className="mt-6 w-full"
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                )}

                {resent && (
                    <p className="mt-4 text-sm text-green-600">
                        ✓ Verification email sent! Check your inbox.
                    </p>
                )}

                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/login'}
                    className="mt-4 w-full"
                >
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
```

---

## AuthService Extensions

### New Methods

Add to `lib/services/auth.service.ts`:

```typescript
/**
 * Generate and store email verification token
 */
async generateVerificationToken(userId: number): Promise<string> {
    try {
        // Generate secure token
        const token = crypto.randomBytes(16).toString('hex').toLowerCase();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store in database
        await db
            .update(users)
            .set({
                verificationToken: token,
                verificationTokenExpires: expires,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return token;

    } catch (error) {
        console.error('Error generating verification token:', error);
        throw new Error('Failed to generate verification token');
    }
}

/**
 * Verify email with token
 */
async verifyEmail(token: string): Promise<{
    success: boolean;
    error?: string;
    email?: string;
}> {
    try {
        // Validate format
        if (!/^[a-z0-9]{32,}$/.test(token)) {
            return { success: false, error: 'INVALID_FORMAT' };
        }

        // Find user by token
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.verificationToken, token))
            .limit(1);

        if (!user) {
            return { success: false, error: 'TOKEN_NOT_FOUND' };
        }

        // Check if already verified
        if (user.emailVerified) {
            return { success: false, error: 'TOKEN_ALREADY_USED', email: user.email };
        }

        // Check expiry
        if (new Date() > new Date(user.verificationTokenExpires!)) {
            return { success: false, error: 'TOKEN_EXPIRED', email: user.email };
        }

        // Mark as verified and clear token
        await db
            .update(users)
            .set({
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        return { success: true, email: user.email };

    } catch (error) {
        console.error('Error verifying email:', error);
        throw error;
    }
}

/**
 * Resend verification email
 */
async resendVerificationEmail(email: string): Promise<boolean> {
    try {
        const user = await this.getUserByEmail(email);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.emailVerified) {
            throw new Error('Email already verified');
        }

        // Generate new token
        const token = await this.generateVerificationToken(user.id);

        // Send email
        const emailService = new EmailService();
        await emailService.sendVerificationEmail(user.email, token, {
            firstName: user.firstName || '',
        });

        return true;

    } catch (error) {
        console.error('Error resending verification email:', error);
        throw error;
    }
}

/**
 * Check if user email is verified
 */
async isEmailVerified(userId: number): Promise<boolean> {
    try {
        const user = await this.getUserById(userId);
        return user?.emailVerified ?? false;

    } catch (error) {
        console.error('Error checking email verification:', error);
        return false;
    }
}

/**
 * Invalidate verification token (security)
 */
async invalidateVerificationToken(userId: number): Promise<void> {
    try {
        await db
            .update(users)
            .set({
                verificationToken: null,
                verificationTokenExpires: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

    } catch (error) {
        console.error('Error invalidating verification token:', error);
    }
}
```

---

## Email Integration

### Provider Recommendation: Resend.com

**Why Resend?**
- Free tier: 3,000 emails/month (perfect for MVP)
- Next.js native integration
- Simple API, excellent developer experience
- Domain verification for production
- React Email templates support

### Setup Instructions

```bash
npm install resend
```

Add to `.env.local`:
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Email Service Implementation

```typescript
// lib/services/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
    /**
     * Send email verification link
     */
    async sendVerificationEmail(
        to: string,
        token: string,
        context: { firstName?: string }
    ): Promise<void> {
        try {
            const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/handler/email-verification?code=${token}`;

            await resend.emails.send({
                from: 'ContractGuard AI <noreply@contractguard.ai>',
                to,
                subject: 'Verify your email - ContractGuard AI',
                html: this.getVerificationEmailTemplate(verificationUrl, context),
            });

        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    /**
     * Email template for verification
     */
    private getVerificationEmailTemplate(
        verificationUrl: string,
        context: { firstName?: string }
    ): string {
        const greeting = context.firstName ? `Hi ${context.firstName}` : 'Hello';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Welcome to ContractGuard AI!</h1>
        <p>${greeting},</p>
        <p>Thank you for signing up! Please verify your email address to activate your account and start scanning smart contracts.</p>

        <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </p>

        <p style="font-size: 14px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
        </p>

        <p style="font-size: 14px; color: #666;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>

        <div class="footer">
            <p>ContractGuard AI - AI-Powered Smart Contract Security Scanner</p>
            <p>Questions? Contact us at support@contractguard.ai</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }
}
```

### Alternative Provider: SendGrid

If using SendGrid instead:

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
    to,
    from: 'noreply@contractguard.ai',
    subject: 'Verify your email - ContractGuard AI',
    html: template,
});
```

---

## Security Considerations

### 1. Token Security

**Generation**:
- Use `crypto.randomBytes()` for cryptographically secure tokens
- Never use Math.random() or predictable sequences
- Minimum 128 bits of entropy (16 bytes = 32 hex chars)

**Storage**:
- Store tokens in database, NOT in JWT or cookies
- Use unique constraint to prevent duplicates
- Clear tokens after successful verification

**Transmission**:
- Always use HTTPS in production
- Tokens sent via email only, never logged or displayed

### 2. Rate Limiting

Prevent abuse with rate limits:

```typescript
// lib/middleware/verification-rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function checkVerificationRateLimit(email: string): Promise<boolean> {
    const key = `verification_rate_limit:${email}`;
    const count = await redis.get<number>(key) || 0;

    // Max 3 requests per hour
    if (count >= 3) {
        return false;
    }

    await redis.set(key, count + 1, { ex: 3600 }); // 1 hour expiry
    return true;
}
```

### 3. Replay Attack Prevention

- Tokens are single-use only
- Clear token immediately after verification
- Check `emailVerified` status before processing

### 4. Timing Attack Mitigation

```typescript
// Constant-time comparison
function safeTokenCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
```

### 5. Email Enumeration Protection

- Don't reveal if email exists when resending
- Use same response for found/not-found emails
- Log suspicious verification attempts

---

## User Flows

### Flow 1: Email/Password Signup with Verification

```
1. User visits /signup
2. User fills form: email, password, name
3. Click "Create account"
   ↓
4. Stack Auth creates user
   ↓
5. AuthService.syncUser():
   • Creates user in public.users
   • Sets emailVerified = false
   • Generates verification token
   • Calls EmailService.sendVerificationEmail()
   ↓
6. User sees message: "Check your email to verify"
7. Redirect to /verify-email-sent page
   ↓
8. User opens email
9. Clicks "Verify Email Address" button
   ↓
10. GET /handler/email-verification?code={token}
    • Validate token
    • Set emailVerified = true
    • Clear token
    ↓
11. Show success page with 3-second countdown
12. Auto-redirect to /dashboard
```

### Flow 2: OAuth Signup (Google/GitHub)

```
1. User clicks "Sign up with Google"
   ↓
2. Google OAuth flow
   ↓
3. Stack Auth creates user
   ↓
4. AuthService.syncUser():
   • Creates user in public.users
   • Sets emailVerified = true (OAuth emails are pre-verified)
   • NO verification email sent
   ↓
5. Redirect directly to /dashboard
6. User can start using app immediately
```

### Flow 3: Expired Token - Resend Flow

```
1. User clicks verification link after 24 hours
   ↓
2. GET /handler/email-verification?code={expired_token}
   ↓
3. Token validation fails: TOKEN_EXPIRED
   ↓
4. Show error page with "Resend" button
   ↓
5. User clicks "Resend Verification Email"
   ↓
6. POST /api/auth/resend-verification
   • Check rate limit (3 per hour)
   • Generate new token
   • Send new email
   ↓
7. Show "Email sent! Check your inbox"
8. User repeats verification flow with new link
```

### Flow 4: Protected Route Access (Unverified User)

```
1. Unverified user tries to access /dashboard
   ↓
2. authMiddleware checks session ✓
3. authMiddleware checks emailVerified ✗
   ↓
4. Redirect to /verify-email-reminder
5. Show message: "Please verify your email to continue"
6. Options:
   • "Resend verification email" button
   • "Use different email" link → /settings
   ↓
7. After verification, user can access all features
```

---

## API Routes

### 1. Resend Verification Email

```typescript
// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { checkVerificationRateLimit } from '@/lib/middleware/verification-rate-limit';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Rate limiting
        const allowed = await checkVerificationRateLimit(email);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const authService = new AuthService();
        await authService.resendVerificationEmail(email);

        return NextResponse.json({
            success: true,
            message: 'Verification email sent',
        });

    } catch (error: any) {
        console.error('Resend verification error:', error);

        // Don't reveal if user exists
        return NextResponse.json({
            success: true,
            message: 'If an account exists, verification email has been sent',
        });
    }
}
```

### 2. Check Verification Status

```typescript
// app/api/user/verification-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getUserFromRequest } from '@/lib/middleware/auth.middleware';
import { AuthService } from '@/lib/services/auth.service';

export async function GET(request: NextRequest) {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) return authResult;

    const user = getUserFromRequest(request);

    try {
        const authService = new AuthService();
        const verified = await authService.isEmailVerified(user.id);

        return NextResponse.json({
            verified,
            email: user.email,
        });

    } catch (error) {
        console.error('Error checking verification status:', error);
        return NextResponse.json(
            { error: 'Failed to check verification status' },
            { status: 500 }
        );
    }
}
```

---

## UI Components

### 1. Email Verification Reminder Banner

```typescript
// components/auth/VerificationBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VerificationBanner() {
    const [verified, setVerified] = useState<boolean | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        // Check verification status
        fetch('/api/user/verification-status')
            .then(res => res.json())
            .then(data => setVerified(data.verified))
            .catch(() => setVerified(true)); // Fail safe
    }, []);

    const handleResend = async () => {
        setResending(true);
        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            alert('Verification email sent! Check your inbox.');
        } finally {
            setResending(false);
        }
    };

    if (verified === null || verified === true || dismissed) {
        return null;
    }

    return (
        <div className="relative bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                        Please verify your email address to unlock all features.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? 'Sending...' : 'Resend Email'}
                    </Button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-yellow-600 hover:text-yellow-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
```

Usage in layout:
```typescript
// app/layout.tsx
import { VerificationBanner } from '@/components/auth/VerificationBanner';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <StackProvider>
                    <VerificationBanner />
                    {children}
                </StackProvider>
            </body>
        </html>
    );
}
```

### 2. Email Sent Confirmation Page

```typescript
// app/verify-email-sent/page.tsx
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailSentPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <Mail className="mx-auto h-16 w-16 text-blue-500" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Check Your Email
                </h1>
                <p className="mt-2 text-gray-600">
                    We've sent a verification link to your email address.
                    Please click the link to verify your account.
                </p>
                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-semibold">Didn't receive the email?</p>
                    <ul className="mt-2 text-left space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure you entered the correct email</li>
                        <li>• Wait a few minutes for delivery</li>
                    </ul>
                </div>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/api/auth/resend-verification'}
                    className="mt-6 w-full"
                >
                    Resend Verification Email
                </Button>
            </div>
        </div>
    );
}
```

---

## Updated Signup Flow Integration

Update `app/signup/page.tsx` to trigger verification email:

```typescript
const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    try {
        // Create Stack Auth user
        await stackApp.signUpWithCredential({
            email,
            password,
            profile: { firstName, lastName }
        });

        // AuthService will automatically:
        // 1. Create user in database
        // 2. Generate verification token
        // 3. Send verification email

        // Redirect to email sent page
        router.push('/verify-email-sent');

    } catch (err: any) {
        setError(err.message || 'Signup failed');
    } finally {
        setLoading(false);
    }
};
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here

# Site URL for verification links
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change in production

# Alternative: SendGrid
# SENDGRID_API_KEY=SG.your_api_key_here
```

---

## Implementation Checklist

### Phase 1: Database Schema (Day 1 - 1 hour)
- [ ] Update `db/schema.ts` with email verification fields
- [ ] Run `npm run db:generate` to create migration
- [ ] Run `npm run db:push` to apply to database
- [ ] Verify fields in Drizzle Studio

### Phase 2: Email Service Setup (Day 1 - 2 hours)
- [ ] Install Resend: `npm install resend`
- [ ] Create Resend account and get API key
- [ ] Add RESEND_API_KEY to `.env.local`
- [ ] Create `lib/services/email.service.ts`
- [ ] Implement `sendVerificationEmail()` method
- [ ] Test email sending with sample token

### Phase 3: AuthService Extensions (Day 1-2 - 3 hours)
- [ ] Add token generation method to AuthService
- [ ] Add email verification method
- [ ] Add resend verification method
- [ ] Add email verification check method
- [ ] Update `syncUser()` to generate token on signup
- [ ] Write unit tests for new methods

### Phase 4: Handler Route (Day 2 - 2 hours)
- [ ] Create `app/handler/email-verification/page.tsx`
- [ ] Implement token validation logic
- [ ] Create `VerificationSuccess` component
- [ ] Create `VerificationError` component
- [ ] Test all error scenarios

### Phase 5: API Routes (Day 2 - 2 hours)
- [ ] Create resend verification endpoint
- [ ] Create verification status check endpoint
- [ ] Implement rate limiting middleware
- [ ] Test API routes with Postman

### Phase 6: UI Integration (Day 2-3 - 3 hours)
- [ ] Create `VerificationBanner` component
- [ ] Create `/verify-email-sent` page
- [ ] Update signup page to redirect after registration
- [ ] Add verification check to protected routes
- [ ] Update Header to show verification status

### Phase 7: Testing & Polish (Day 3 - 2 hours)
- [ ] Test complete signup → verify flow
- [ ] Test expired token scenario
- [ ] Test resend functionality
- [ ] Test OAuth signup (should skip verification)
- [ ] Test rate limiting (3 requests/hour)
- [ ] Verify email template renders correctly
- [ ] Check mobile responsiveness

### Phase 8: Production Deployment (Day 3-4)
- [ ] Configure production domain in Resend
- [ ] Update NEXT_PUBLIC_SITE_URL for production
- [ ] Test verification emails in production
- [ ] Monitor error logs for first week
- [ ] Set up alerts for failed verifications

---

## Testing Scenarios

### 1. Happy Path Testing

```bash
# Test flow
1. Sign up with email: test@example.com
2. Check email inbox for verification link
3. Click link
4. Verify redirect to dashboard
5. Check database: emailVerified = true
6. Verify token cleared from database
```

### 2. Error Testing

```bash
# Expired token
1. Sign up
2. Wait 25 hours (or manually set token expiry to past)
3. Click link
4. Should show "Token expired" error
5. Click "Resend" button
6. Should receive new email

# Invalid token
1. Visit /handler/email-verification?code=invalid123
2. Should show "Invalid token" error

# Already verified
1. Complete verification once
2. Click same link again
3. Should show "Already verified" message

# Rate limiting
1. Request resend 4 times in 1 hour
2. 4th request should fail with 429 status
```

### 3. OAuth Testing

```bash
# Google OAuth should skip verification
1. Sign up with "Continue with Google"
2. Should NOT receive verification email
3. Database: emailVerified = true immediately
4. No banner shown in dashboard
```

---

## Monitoring & Analytics

### Key Metrics to Track

```typescript
// Track in analytics
{
    event: 'email_verification_sent',
    user_id: userId,
    email: email,
    signup_method: 'email' | 'oauth',
}

{
    event: 'email_verification_success',
    user_id: userId,
    time_to_verify: seconds, // Time between signup and verification
}

{
    event: 'email_verification_failed',
    user_id: userId,
    error: 'TOKEN_EXPIRED' | 'TOKEN_NOT_FOUND' | ...,
}

{
    event: 'verification_resend',
    user_id: userId,
    attempt_count: number,
}
```

### Success Metrics

- **Verification Rate**: % of users who verify within 24 hours
- **Time to Verify**: Average time from signup to verification
- **Resend Rate**: % of users who need to resend
- **Error Rate**: % of verification attempts that fail

### Alerts

- Email delivery failures > 5% → Check Resend status
- Verification rate < 70% → Review email template/deliverability
- Token expiry errors > 20% → Consider extending TTL

---

## Cost Analysis

### Email Sending Costs (Resend)

| Tier | Monthly Emails | Cost | Notes |
|------|----------------|------|-------|
| Free | 3,000 | $0 | Perfect for MVP |
| Growth | 50,000 | $20/mo | Scales with user growth |
| Pro | 100,000 | $50/mo | At $10k MRR scale |

### Projected Costs

**Month 1-2 (MVP)**:
- Estimated signups: 100-200
- Verification emails: 200-400 (including resends)
- **Cost**: $0 (Free tier)

**Month 3 ($5k MRR)**:
- Estimated signups: 500-1,000
- Verification emails: 1,000-2,000
- **Cost**: $0 (Free tier)

**Month 6 ($10k MRR)**:
- Estimated signups: 2,000-3,000
- Verification emails: 4,000-6,000
- **Cost**: $20/mo (Growth tier)

**Conclusion**: Email costs negligible compared to AI API costs ($100/mo).

---

## Alternative Approaches Considered

### 1. Use Stack Auth's Built-In Verification

✅ **Pros**:
- Zero implementation time
- Maintained by Stack Auth
- Integrated with their UI

❌ **Cons**:
- Less control over UX
- Can't customize email templates easily
- Verification status not in our database

**Decision**: Rejected - Need full control for branding and data ownership

### 2. Magic Link Authentication (No Password)

✅ **Pros**:
- Passwordless, better security
- Implicit email verification
- Better UX (no password to remember)

❌ **Cons**:
- Requires email for every login
- User friction if email is slow
- Different mental model for users

**Decision**: Consider for future, stick with standard email/password for MVP

### 3. Phone Verification Instead

❌ **Rejected**:
- Higher costs (SMS ~$0.01-0.05 per message)
- International issues
- Not required for crypto tools
- Unnecessary friction for MVP

---

## Production Considerations

### 1. Domain Authentication

For production email sending:

```
1. Add DNS records to verify domain ownership
2. Configure SPF, DKIM, DMARC records
3. Warm up sending reputation gradually
4. Monitor deliverability metrics
```

### 2. Email Deliverability

Best practices:
- Use professional "from" address: `noreply@contractguard.ai`
- Include plain text version of email
- Add unsubscribe link (required for marketing, optional for transactional)
- Monitor spam complaints

### 3. Graceful Degradation

If email service is down:
```typescript
try {
    await emailService.sendVerificationEmail(...);
} catch (error) {
    // Log error but don't block signup
    console.error('Email sending failed:', error);

    // Store in retry queue
    await queueVerificationEmail(userId, email);

    // Continue with signup
}
```

### 4. Webhook for Email Events

Resend provides webhooks for:
- Email delivered
- Email bounced
- Email opened (optional tracking)

Use to update user verification status automatically.

---

## Support & Troubleshooting

### Common Issues

**Issue**: Verification emails not arriving

**Solutions**:
1. Check spam/junk folder
2. Verify Resend API key is correct
3. Check Resend dashboard for delivery status
4. Verify domain authentication (production)

**Issue**: Tokens expiring too quickly

**Solutions**:
1. Increase TTL from 24h to 48h
2. Check server timezone settings
3. Verify database timestamp fields use UTC

**Issue**: Rate limiting too strict

**Solutions**:
1. Increase limit from 3 to 5 per hour
2. Use exponential backoff
3. Add cooldown period between resends

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

- [ ] Email change flow with re-verification
- [ ] Support for React Email templates
- [ ] A/B testing different email designs
- [ ] Verification reminder emails (24h, 72h)
- [ ] Admin panel to manually verify users
- [ ] Bulk verification status export
- [ ] Email verification analytics dashboard
- [ ] Multi-language email templates

### Phase 3 Features (Scale)

- [ ] Queue system for email sending (Bull MQ)
- [ ] Retry logic for failed deliveries
- [ ] Email reputation monitoring
- [ ] Advanced fraud detection
- [ ] SMS verification as backup option
- [ ] Email verification API for partners

---

## Conclusion

This email verification system provides:

✅ **Security**: Cryptographically secure tokens, single-use, expiry, rate limiting
✅ **User Experience**: Clear success/error pages, resend functionality, auto-redirect
✅ **Reliability**: Error handling, graceful degradation, monitoring
✅ **Scalability**: Free tier covers MVP, scales to enterprise
✅ **Maintainability**: Clean service layer, testable, documented
✅ **Cost-Effective**: $0-20/month vs. $100/month for AI APIs

**Implementation Time**: 3-4 days for complete system
**Next Steps**: Begin Phase 1 - Database schema updates

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Author**: Claude Code Design System
**Status**: ✅ Ready for Implementation
