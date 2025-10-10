# Phase 1 Implementation Tickets

**Timeline**: Week 1-2
**Goal**: Critical Revenue Features - Progressive Signup + STARTER Tier + Anti-Fraud
**Total Effort**: 60-80 hours
**Expected Impact**: +25-40% conversion rate

---

## Epic 1: Progressive Signup Flow (Week 1)

### Ticket 1.1: Anonymous Scan Infrastructure ✅

**Priority**: 🔴 CRITICAL | **Effort**: 8 hours | **Dependencies**: None | **Status**: ✅ COMPLETED

**Description**:
Enable anonymous users to perform scans without creating an account. Use cookie-based session tracking to store scan results temporarily and prompt account creation.

**Acceptance Criteria**:

- [x] Anonymous users can scan contracts without signup
- [x] Results stored in database with session tracking for 24 hours
- [x] Session ID tracked for migration to account
- [x] Signup prompt displayed after scan limit reached
- [x] Session expires after 24h or 3 scans

**Technical Specifications**:

```typescript
// lib/middleware/session-tracking.ts (NEW FILE)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export function getOrCreateAnonymousSession(req: NextRequest): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get("anonymous_session_id")?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("anonymous_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return sessionId;
}

export function getAnonymousScanCount(sessionId: string): number {
  const cookieStore = cookies();
  const count = cookieStore.get(`anon_scans_${sessionId}`)?.value;
  return parseInt(count || "0", 10);
}

export function incrementAnonymousScanCount(sessionId: string): void {
  const cookieStore = cookies();
  const currentCount = getAnonymousScanCount(sessionId);
  const newCount = currentCount + 1;

  cookieStore.set(`anon_scans_${sessionId}`, newCount.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}
```

```typescript
// Update db/schema.ts
export const users = pgTable("users", {
  // ... existing fields ...

  anonymousSessionId: text("anonymous_session_id").unique(),
  softSignupEmail: text("soft_signup_email"),
  accountType: text("account_type").default("anonymous"), // 'anonymous' | 'soft' | 'full'
});

export const anonymousScans = pgTable("anonymous_scans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  chain: text("chain").notNull().default("ethereum"),
  riskScore: integer("risk_score"),
  summary: text("summary"),
  issues: jsonb("issues").$type<Issue[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
```

```typescript
// Update app/api/audit/route.ts
import {
  getOrCreateAnonymousSession,
  getAnonymousScanCount,
  incrementAnonymousScanCount,
} from "@/lib/middleware/session-tracking";

export async function POST(req: NextRequest) {
  // Try to get authenticated user
  const user = await stackServerApp.getUser();

  if (!user) {
    // Anonymous flow
    const sessionId = getOrCreateAnonymousSession(req);
    const scanCount = getAnonymousScanCount(sessionId);

    if (scanCount >= 3) {
      return NextResponse.json(
        {
          status: "error",
          error: "Anonymous scan limit reached",
          message: "Create a free account to continue scanning",
          action: "signup_required",
        },
        { status: 429 }
      );
    }

    // Perform scan and store in anonymous_scans table
    const result = await performScan(contractAddress, chain);

    await db.insert(anonymousScans).values({
      sessionId,
      contractAddress,
      chain,
      riskScore: result.riskScore,
      summary: result.summary,
      issues: result.issues,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    incrementAnonymousScanCount(sessionId);

    return NextResponse.json({
      status: "success",
      data: result,
      metadata: {
        accessType: "anonymous",
        scansRemaining: 3 - (scanCount + 1),
        prompt: scanCount >= 2 ? "Create account to save your scans" : null,
      },
    });
  }

  // Existing authenticated flow...
}
```

**Files to Create**:

- `lib/middleware/session-tracking.ts`
- `app/api/anonymous-scans/route.ts` (GET endpoint for retrieving anonymous scans)

**Files to Modify**:

- `db/schema.ts` (add anonymousSessionId, accountType fields + anonymousScans table)
- `app/api/audit/route.ts` (add anonymous flow)

**Testing Checklist**:

- [x] Anonymous user can perform first scan without account
- [x] Cookie persists across page refreshes
- [x] Scan count increments correctly
- [x] 4th scan is blocked with signup prompt
- [x] Cookie expires after 24 hours
- [x] Multiple tabs share same session

**Migration**:

```bash
npm run db:push  # ✅ COMPLETED - Migration applied successfully
```

**Implementation Notes**:

- ✅ Created `lib/middleware/session-tracking.ts` with full session management
- ✅ Created `app/api/anonymous-scans/route.ts` GET endpoint
- ✅ Updated `db/schema.ts` with anonymous support fields
- ✅ Updated `app/api/audit/route.ts` with comprehensive `handleAnonymousScan()` function
- ✅ Migration applied using custom script (`scripts/apply-migration.ts`)
- ✅ All 5 SQL statements executed successfully:
  - Created `anonymous_scans` table
  - Added `anonymous_session_id`, `soft_signup_email`, `account_type` to users
  - Added unique constraint on `anonymous_session_id`

---

### Ticket 1.2: Soft Signup Flow (Email-Only Registration) ✅

**Priority**: 🔴 CRITICAL | **Effort**: 6 hours | **Dependencies**: Ticket 1.1 | **Status**: ✅ COMPLETED

**Description**:
Implement email-only "soft signup" that allows users to save their scans without full account creation. Uses magic link authentication for seamless experience.

**Acceptance Criteria**:

- [x] User prompted for email after 2-3 scans
- [x] Magic link sent to email for verification
- [x] Anonymous scans migrated to soft account
- [x] Soft accounts can perform unlimited scans (free tier)
- [x] UI shows "Complete signup" reminder

**Technical Specifications**:

```typescript
// app/api/auth/soft-signup/route.ts (NEW FILE)
import { db } from "@/db";
import { users, anonymousScans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendMagicLink } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  const { email, anonymousSessionId } = await req.json();

  // Validate email format
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return NextResponse.json(
      { error: "Email already registered. Please sign in." },
      { status: 409 }
    );
  }

  // Create soft signup user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      softSignupEmail: email,
      accountType: "soft",
      anonymousSessionId,
      emailVerified: false,
      tier: "free",
    })
    .returning();

  // Migrate anonymous scans to user account
  if (anonymousSessionId) {
    const anonScans = await db
      .select()
      .from(anonymousScans)
      .where(eq(anonymousScans.sessionId, anonymousSessionId));

    // TODO: Associate scans with user (add userId to anonymousScans or move to audits)
  }

  // Generate magic link token
  const magicToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await db
    .update(users)
    .set({
      verificationToken: magicToken,
      verificationTokenExpires: expiresAt,
    })
    .where(eq(users.id, newUser.id));

  // Send magic link email
  const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${magicToken}`;
  await sendMagicLink(email, magicLink);

  return NextResponse.json({
    status: "success",
    message: "Check your email for verification link",
    userId: newUser.id,
  });
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

```typescript
// app/api/auth/verify-magic-link/route.ts (NEW FILE)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=invalid_token`
    );
  }

  // Find user with this token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=invalid_token`
    );
  }

  // Check token expiration
  if (new Date() > new Date(user.verificationTokenExpires!)) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=expired_token`
    );
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    })
    .where(eq(users.id, user.id));

  // Create Stack Auth user (for session management)
  // This integrates with your existing Stack Auth setup
  // ... Stack Auth integration code ...

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?welcome=true`
  );
}
```

```tsx
// components/auth/SoftSignupPrompt.tsx (NEW FILE)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SoftSignupPrompt({
  scansPerformed,
  anonymousSessionId,
}: {
  scansPerformed: number;
  anonymousSessionId: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (scansPerformed < 2) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/soft-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, anonymousSessionId }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert("Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="text-lg font-bold text-green-900 mb-2">
          ✉️ Check Your Email
        </h3>
        <p className="text-green-700">
          We sent you a magic link to <strong>{email}</strong>. Click the link
          to save your scans and continue.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <h3 className="text-lg font-bold text-blue-900 mb-2">
        💾 Save Your Scans
      </h3>
      <p className="text-blue-700 mb-4">
        You've scanned {scansPerformed} contracts. Enter your email to save your
        results and continue scanning (no password needed).
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Continue"}
        </Button>
      </form>

      <p className="text-xs text-gray-600 mt-2">
        We'll send you a magic link - no password required.
      </p>
    </Card>
  );
}
```

**Files to Create**:

- `app/api/auth/soft-signup/route.ts` ✅
- `app/api/auth/verify-magic-link/route.ts` ✅
- `app/api/auth/migrate-anonymous-scans/route.ts` ✅
- `components/auth/SoftSignupPrompt.tsx` ✅
- `components/auth/CompleteAccountPrompt.tsx` ✅

**Files to Modify**:

- `db/schema.ts` (already modified in Ticket 1.1) ✅
- `components/scan/ScanInterface.tsx` (show soft signup prompt) ✅
- `lib/services/email.service.ts` (magic link template already exists) ✅

**Testing Checklist**:

- [x] Prompt appears after 2nd anonymous scan
- [x] Email validation works correctly
- [x] Magic link sent successfully
- [x] Link expires after 1 hour
- [x] Email redirects to Stack Auth signup
- [x] Anonymous session stored in Redis for migration
- [x] User can continue scanning after signup

**Implementation Notes**:

- ✅ Created soft signup API route using Redis for temporary storage
- ✅ Magic link redirects to Stack Auth signup with pre-filled email
- ✅ Anonymous session ID stored in Redis (1 hour TTL) for migration
- ✅ SoftSignupPrompt component shows after 2+ anonymous scans
- ✅ CompleteAccountPrompt for soft accounts to complete setup
- ✅ Integration with existing Stack Auth flow
- ✅ Email service already has magic link template
- ✅ Migration happens via Redis lookup when user completes Stack Auth signup

**Email Template**:

```html
<!-- emails/magic-link.html -->
<h2>Verify Your Email</h2>
<p>
  Click the link below to save your scans and continue using ContractGuard AI:
</p>
<a
  href="{magicLink}"
  style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
>
  Verify Email & Continue
</a>
<p><small>This link expires in 15 minutes.</small></p>
```

---

### Ticket 1.3: Hard Signup Trigger & Account Migration ✅

**Priority**: 🔴 CRITICAL | **Effort**: 4 hours | **Dependencies**: Ticket 1.2 | **Status**: ✅ COMPLETED

**Description**:
Implement hard paywall after 3 scans for soft accounts. Require full account creation with password/OAuth. Migrate soft account to full account.

**Acceptance Criteria**:

- [x] Soft accounts blocked after 3 scans (same as free tier)
- [x] Modal prompts full signup (password or OAuth)
- [x] Account upgraded from 'soft' → 'full' on completion
- [x] All scan history preserved
- [x] Stack Auth integration complete

**Technical Specifications**:

```typescript
// lib/services/auth.service.ts (UPDATE)
export class AuthService {
  async upgradeSoftAccountToFull(
    email: string,
    stackUserId: string
  ): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.accountType === "full") {
      return user; // Already upgraded
    }

    // Upgrade account type
    const [upgraded] = await db
      .update(users)
      .set({
        accountType: "full",
        stackUserId,
        softSignupEmail: null, // Clear soft signup marker
      })
      .where(eq(users.id, user.id))
      .returning();

    return upgraded;
  }

  async checkAccountUpgradeRequired(userId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    // Soft accounts need upgrade after 3 scans
    if (user.accountType === "soft" && (user.scansToday || 0) >= 3) {
      return true;
    }

    return false;
  }
}
```

```typescript
// app/api/audit/route.ts (UPDATE)
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser();

  if (!user) {
    // Anonymous flow (already implemented in Ticket 1.1)
    // ...
  }

  const appUser = await authService.getUserByStackUserId(user.id);

  // Check if soft account needs upgrade
  if (appUser.accountType === "soft") {
    const needsUpgrade = await authService.checkAccountUpgradeRequired(
      appUser.id
    );

    if (needsUpgrade) {
      return NextResponse.json(
        {
          status: "error",
          error: "Account upgrade required",
          message: "Complete your account setup to continue scanning",
          action: "upgrade_required",
          accountType: "soft",
        },
        { status: 403 }
      );
    }
  }

  // Continue with regular scan flow...
}
```

```tsx
// components/auth/AccountUpgradeModal.tsx (NEW FILE)
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { SignIn } from "@stackframe/stack";

export function AccountUpgradeModal({
  isOpen,
  email,
  onClose,
}: {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"password" | "oauth" | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You've reached the free tier limit. Complete your account setup to
            continue scanning (you'll still have 3 free scans per day).
          </p>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Email: {email}</p>
          </div>

          {!method && (
            <div className="space-y-2">
              <Button
                onClick={() => setMethod("oauth")}
                variant="outline"
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  {/* Google icon SVG */}
                </svg>
                Continue with Google
              </Button>

              <Button
                onClick={() => setMethod("password")}
                variant="outline"
                className="w-full"
              >
                Set Password
              </Button>
            </div>
          )}

          {method === "oauth" && (
            <div>
              {/* Stack Auth OAuth component */}
              <SignIn emailHint={email} />
            </div>
          )}

          {method === "password" && (
            <PasswordSetupForm email={email} onSuccess={onClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PasswordSetupForm({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create Stack Auth user with password
      const res = await fetch("/api/auth/upgrade-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        onSuccess();
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert("Failed to upgrade account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
          placeholder="Enter password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Setting up..." : "Complete Setup"}
      </Button>
    </form>
  );
}
```

**Files to Create**:

- `components/auth/AccountUpgradeModal.tsx` ✅
- `app/api/auth/upgrade-account/route.ts` ✅

**Files to Modify**:

- `app/api/audit/route.ts` (add upgrade check) ✅
- `components/scan/ScanInterface.tsx` (show modal when upgrade required) ✅

**Testing Checklist**:

- [x] Soft account blocked after 3 scans
- [x] Modal appears with upgrade options
- [x] Stack Auth signup completes full account
- [x] Account type upgraded to 'full'
- [x] Stack Auth integration works
- [x] Scan history preserved
- [x] User can scan after upgrade

**Implementation Notes**:

- ✅ Created AccountUpgradeModal with beautiful UI and clear benefits
- ✅ Created upgrade-account API route for account migration
- ✅ Updated audit route to detect soft accounts and trigger upgrade requirement
- ✅ Integrated upgrade modal into ScanInterface with proper state management
- ✅ Modal redirects to Stack Auth signup for full account creation
- ✅ Fixed existing linting errors in audit route (null check for updatedUser)
- ✅ Upgrade flow preserves anonymous session ID for scan migration
- ✅ Clear UX with benefits list and CTA for completing account

---

### Ticket 1.4: Access Validation Service Updates ✅

**Priority**: 🟡 HIGH | **Effort**: 6 hours | **Dependencies**: Tickets 1.1, 1.2, 1.3 | **Status**: ✅ COMPLETED

**Description**:
Update access validation service to support new account types and progressive signup flow. Implement priority logic: subscription → instant → soft → anonymous.

**Acceptance Criteria**:

- [x] Anonymous users get 3 scans (cookie-tracked)
- [x] Soft accounts get free tier access (3/day)
- [x] Full accounts follow existing logic
- [x] Priority order respected: subscription → instant → soft → anonymous
- [x] Proper error messages for each account type

**Technical Specifications**:

```typescript
// lib/services/access-validation.service.ts (UPDATE)
export type AccessType =
  | "pro"
  | "team"
  | "instant_credit"
  | "free"
  | "soft"
  | "anonymous"
  | "none";

export interface AccessValidationResult {
  hasAccess: boolean;
  accessType: AccessType;
  scansRemaining: number;
  instantCredits: number;
  accountType?: "anonymous" | "soft" | "full";
  reason?: string;
  upgradePrompt?: string;
}

export class AccessValidationService {
  /**
   * Validate anonymous user access (cookie-based)
   */
  async validateAnonymousAccess(
    sessionId: string
  ): Promise<AccessValidationResult> {
    const scanCount = getAnonymousScanCount(sessionId);
    const scansRemaining = Math.max(0, 3 - scanCount);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "anonymous",
        scansRemaining,
        instantCredits: 0,
        accountType: "anonymous",
        upgradePrompt: scanCount >= 2 ? "Create account to save scans" : null,
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: "anonymous",
      reason: "Anonymous scan limit reached",
      upgradePrompt: "Create a free account to continue scanning",
    };
  }

  /**
   * Validate soft account access
   */
  async validateSoftAccess(userId: number): Promise<AccessValidationResult> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        hasAccess: false,
        accessType: "none",
        scansRemaining: 0,
        instantCredits: 0,
        reason: "User not found",
      };
    }

    // Soft accounts follow free tier rules
    const now = new Date();
    const resetAt = user.scansResetAt ? new Date(user.scansResetAt) : null;

    if (!resetAt || now >= resetAt) {
      await this.resetDailyScans(userId);
      return {
        hasAccess: true,
        accessType: "soft",
        scansRemaining: 3,
        instantCredits: 0,
        accountType: "soft",
        upgradePrompt: "Complete account setup for more features",
      };
    }

    const scansUsed = user.scansToday || 0;
    const scansRemaining = Math.max(0, 3 - scansUsed);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "soft",
        scansRemaining,
        instantCredits: 0,
        accountType: "soft",
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: "soft",
      reason: "Daily limit reached",
      upgradePrompt: "Complete account setup or purchase instant reports",
    };
  }

  /**
   * Main access validation with account type detection
   */
  async validateAccess(
    userId?: number,
    anonymousSessionId?: string
  ): Promise<AccessValidationResult> {
    // Anonymous user
    if (!userId && anonymousSessionId) {
      return this.validateAnonymousAccess(anonymousSessionId);
    }

    // Authenticated user
    if (userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return {
          hasAccess: false,
          accessType: "none",
          scansRemaining: 0,
          instantCredits: 0,
          reason: "User not found",
        };
      }

      // Soft account
      if (user.accountType === "soft") {
        return this.validateSoftAccess(userId);
      }

      // Full account - existing logic
      // Priority: subscription → instant credits → free tier

      if (
        user.tier === "pro" ||
        user.tier === "enterprise" ||
        user.tier === "team"
      ) {
        return {
          hasAccess: true,
          accessType:
            user.tier === "enterprise" ? "team" : (user.tier as AccessType),
          scansRemaining: -1,
          instantCredits: user.instantCredits || 0,
          accountType: "full",
        };
      }

      const instantCredits = user.instantCredits || 0;
      if (instantCredits > 0) {
        return {
          hasAccess: true,
          accessType: "instant_credit",
          scansRemaining: instantCredits,
          instantCredits,
          accountType: "full",
        };
      }

      // Free tier check (same as before)
      const now = new Date();
      const resetAt = user.scansResetAt ? new Date(user.scansResetAt) : null;

      if (!resetAt || now >= resetAt) {
        await this.resetDailyScans(userId);
        return {
          hasAccess: true,
          accessType: "free",
          scansRemaining: 3,
          instantCredits: 0,
          accountType: "full",
        };
      }

      const scansUsed = user.scansToday || 0;
      const scansRemaining = Math.max(0, 3 - scansUsed);

      if (scansRemaining > 0) {
        return {
          hasAccess: true,
          accessType: "free",
          scansRemaining,
          instantCredits: 0,
          accountType: "full",
        };
      }

      return {
        hasAccess: false,
        accessType: "none",
        scansRemaining: 0,
        instantCredits: 0,
        accountType: "full",
        reason:
          "Daily limit reached. Purchase instant reports or upgrade to Pro.",
      };
    }

    // No user and no session - shouldn't happen
    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      reason: "Authentication required",
    };
  }

  /**
   * Consume scan based on access type
   */
  async consumeScan(
    userId: number | null,
    accessType: AccessType,
    anonymousSessionId?: string
  ): Promise<boolean> {
    if (accessType === "anonymous" && anonymousSessionId) {
      incrementAnonymousScanCount(anonymousSessionId);
      return true;
    }

    if (accessType === "soft" && userId) {
      await db
        .update(users)
        .set({ scansToday: sql`${users.scansToday} + 1` })
        .where(eq(users.id, userId));
      return true;
    }

    // Existing logic for other types
    if (!userId) return false;

    if (accessType === "pro" || accessType === "team") {
      return true; // Unlimited
    }

    if (accessType === "instant_credit") {
      const [result] = await db
        .update(users)
        .set({
          instantCredits: sql`GREATEST(${users.instantCredits} - 1, 0)`,
          instantCreditsUsedToday: sql`${users.instantCreditsUsedToday} + 1`,
        })
        .where(eq(users.id, userId))
        .returning({ updatedCredits: users.instantCredits });

      return result !== undefined;
    }

    if (accessType === "free") {
      await db
        .update(users)
        .set({ scansToday: sql`${users.scansToday} + 1` })
        .where(eq(users.id, userId));
      return true;
    }

    return false;
  }
}
```

**Files to Modify**:

- `lib/services/access-validation.service.ts` (major update) ✅

**Testing Checklist**:

- [x] Anonymous users validated correctly
- [x] Soft accounts get free tier access
- [x] Full accounts follow existing priority
- [x] Consumption logic works for all types
- [x] Error messages appropriate per account type
- [x] Edge cases handled (no user, no session)

**Implementation Notes**:

- ✅ Updated AccessType to include "soft" and "anonymous"
- ✅ Added AccountType to track user progression (anonymous → soft → full)
- ✅ Implemented validateAnonymousAccess() for cookie-tracked scans
- ✅ Implemented validateSoftAccess() for email-only accounts
- ✅ Updated main validateAccess() to support optional parameters
- ✅ Updated consumeScan() to handle all account types
- ✅ Added upgradePrompt field for conversion optimization
- ✅ Priority order properly enforced: Pro/Team → Instant → Soft/Free → Anonymous
- ✅ Comprehensive documentation with clear priority logic
- ✅ All edge cases handled (no user, no session, mixed states)

---

## Epic 2: STARTER Tier Implementation (Week 2)

### Ticket 2.1: Database Schema for STARTER Tier

**Priority**: 🔴 CRITICAL | **Effort**: 3 hours | **Dependencies**: None

**Description**:
Add database fields and constraints for STARTER tier monthly scan limits.

**Acceptance Criteria**:

- [ ] `tier` enum updated to include 'starter'
- [ ] Monthly scan tracking fields added
- [ ] Migration runs successfully
- [ ] Indexes created for performance

**Technical Specifications**:

```sql
-- Migration: Add STARTER tier support
-- Run via: npm run db:push

-- Update tier enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));

-- Add monthly scan tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS monthly_scans_limit INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_scans_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_reset_at TIMESTAMP;

-- Create index for monthly reset queries
CREATE INDEX IF NOT EXISTS idx_users_monthly_reset
  ON users(monthly_reset_at)
  WHERE tier = 'starter';

-- Add accountType if not exists (from Epic 1)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'full';
ALTER TABLE users ADD CONSTRAINT users_account_type_check
  CHECK (account_type IN ('anonymous', 'soft', 'full'));
```

```typescript
// Update db/schema.ts
export const users = pgTable("users", {
  // ... existing fields ...

  tier: text("tier").notNull().default("free"),
  // Values: 'free' | 'starter' | 'pro' | 'enterprise'

  // Free tier (daily)
  scansToday: integer("scans_today").default(0),
  scansResetAt: timestamp("scans_reset_at").defaultNow(),

  // STARTER tier (monthly)
  monthlyScansLimit: integer("monthly_scans_limit").default(0),
  monthlyScansUsed: integer("monthly_scans_used").default(0),
  monthlyResetAt: timestamp("monthly_reset_at"),

  // Instant credits
  instantCredits: integer("instant_credits").default(0),
  instantCreditsUsedToday: integer("instant_credits_used_today").default(0),

  // Account progression
  accountType: text("account_type").default("full"), // 'anonymous' | 'soft' | 'full'

  // ... rest of fields ...
});

// Type helpers
export type UserTier = "free" | "starter" | "pro" | "enterprise";
export type AccountType = "anonymous" | "soft" | "full";
```

**Files to Modify**:

- `db/schema.ts`

**Testing Checklist**:

- [ ] Migration runs without errors
- [ ] New fields exist in database
- [ ] Constraints work correctly
- [ ] Indexes created successfully
- [ ] TypeScript types updated

**Migration Command**:

```bash
npm run db:push
```

---

### Ticket 2.2: STARTER Tier Pricing Configuration

**Priority**: 🔴 CRITICAL | **Effort**: 2 hours | **Dependencies**: Ticket 2.1

**Description**:
Add STARTER tier to pricing configuration with Stripe integration.

**Acceptance Criteria**:

- [ ] STARTER tier added to PRICING_CONFIG
- [ ] Monthly and annual options configured
- [ ] Stripe price IDs added to env variables
- [ ] Pricing helpers updated

**Technical Specifications**:

```typescript
// lib/config/pricing.ts (UPDATE)
export const PRICING_CONFIG = {
  instant: {
    // ... existing instant pricing ...
  },

  starter: {
    id: "starter",
    label: "Starter Plan",
    type: "subscription" as const,
    monthly: {
      id: "starter_monthly",
      price: 9,
      stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
      interval: "month" as const,
      scansPerMonth: 30,
    },
    annual: {
      id: "starter_annual",
      price: 89,
      stripePriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
      interval: "year" as const,
      scansPerMonth: 30,
      monthlyEquivalent: 7.42,
      savings: "€19 (17% off)",
    },
    perks: [
      "30 scans per month",
      "Detailed risk reports",
      "Scan history",
      "Email alerts",
      "No ads",
      "Priority support",
    ],
  },

  pro: {
    id: "pro",
    label: "Pro Plan",
    type: "subscription" as const,
    monthly: {
      id: "pro_monthly",
      price: 29,
      stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
      interval: "month" as const,
    },
    annual: {
      id: "pro_annual",
      price: 249,
      stripePriceId: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
      interval: "year" as const,
      monthlyEquivalent: 20.75,
      savings: "€99 (28% off)",
    },
    perks: [
      "Unlimited scans",
      "Advanced risk scoring",
      "Contract monitoring",
      "Email alerts",
      "PDF export",
      "AI chat assistant",
      "Priority support",
    ],
  },

  team: {
    id: "team",
    label: "Team/API Plan",
    type: "subscription" as const,
    monthly: {
      id: "team_monthly",
      price: 99,
      stripePriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
      interval: "month" as const,
    },
    annual: {
      id: "team_annual",
      price: 999,
      stripePriceId: process.env.STRIPE_PRICE_TEAM_ANNUAL || "",
      interval: "year" as const,
      monthlyEquivalent: 83.25,
      savings: "€189 (16% off)",
    },
    perks: [
      "Everything in Pro",
      "Multi-user dashboard",
      "Shared report library",
      "API access (€0.15/scan)",
      "White-label options",
      "Dedicated account manager",
    ],
  },
} as const;

// Updated type helpers
export type PricingTier = keyof typeof PRICING_CONFIG;
export type SubscriptionTier = "starter" | "pro" | "team";
export type BillingInterval = "month" | "year";

// Helper functions
export function getSubscriptionPlan(
  tier: SubscriptionTier,
  interval: BillingInterval = "month"
) {
  const config = PRICING_CONFIG[tier];
  return interval === "month" ? config.monthly : config.annual;
}

export function getTierLimits(tier: UserTier) {
  return {
    free: { daily: 3, monthly: null },
    starter: { daily: null, monthly: 30 },
    pro: { daily: null, monthly: null }, // Unlimited
    enterprise: { daily: null, monthly: null }, // Unlimited
  }[tier];
}
```

**Environment Variables**:

```bash
# Add to .env.local
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_TEAM_ANNUAL=price_xxxxx
```

**Stripe Setup Instructions**:

1. Go to Stripe Dashboard → Products
2. Create new product: "ContractGuard AI - Starter Plan"
3. Add price: €9/month recurring
4. Add price: €89/year recurring
5. Copy price IDs to .env.local
6. Repeat for Pro Annual and Team Annual

**Files to Modify**:

- `lib/config/pricing.ts`
- `.env.local` (add Stripe price IDs)

**Testing Checklist**:

- [ ] Pricing config exports correctly
- [ ] Helper functions return correct values
- [ ] Stripe price IDs configured
- [ ] TypeScript types valid

---

### Ticket 2.3: STARTER Tier Access Validation Logic

**Priority**: 🔴 CRITICAL | **Effort**: 5 hours | **Dependencies**: Tickets 2.1, 2.2

**Description**:
Implement monthly scan limit validation for STARTER tier users. Update access validation service with monthly reset logic.

**Acceptance Criteria**:

- [ ] STARTER users get 30 scans/month
- [ ] Monthly counter resets on 1st of each month
- [ ] Validation respects priority: subscription → STARTER → instant → free
- [ ] Consumption logic tracks monthly usage
- [ ] Reset job scheduled via cron

**Technical Specifications**:

```typescript
// lib/services/access-validation.service.ts (UPDATE)
export class AccessValidationService {
  async validateAccess(
    userId?: number,
    anonymousSessionId?: string
  ): Promise<AccessValidationResult> {
    // ... anonymous and soft account logic from Epic 1 ...

    if (userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return this.noAccessResult("User not found");
      }

      // Priority 1: Pro/Team/Enterprise - Unlimited
      if (["pro", "enterprise", "team"].includes(user.tier)) {
        return {
          hasAccess: true,
          accessType:
            user.tier === "enterprise" ? "team" : (user.tier as AccessType),
          scansRemaining: -1, // Unlimited
          instantCredits: user.instantCredits || 0,
          accountType: user.accountType as AccountType,
        };
      }

      // Priority 2: STARTER tier - Monthly limit
      if (user.tier === "starter") {
        return this.validateStarterAccess(user);
      }

      // Priority 3: Instant credits
      const instantCredits = user.instantCredits || 0;
      if (instantCredits > 0) {
        return {
          hasAccess: true,
          accessType: "instant_credit",
          scansRemaining: instantCredits,
          instantCredits,
          accountType: user.accountType as AccountType,
        };
      }

      // Priority 4: Free tier (daily limit)
      return this.validateFreeAccess(user);
    }

    return this.noAccessResult("Authentication required");
  }

  private async validateStarterAccess(
    user: User
  ): Promise<AccessValidationResult> {
    const now = new Date();
    const monthlyResetAt = user.monthlyResetAt
      ? new Date(user.monthlyResetAt)
      : null;

    // Check if monthly reset needed
    if (!monthlyResetAt || now >= monthlyResetAt) {
      await this.resetMonthlyScans(user.id);

      return {
        hasAccess: true,
        accessType: "starter" as AccessType,
        scansRemaining: 30,
        instantCredits: user.instantCredits || 0,
        accountType: user.accountType as AccountType,
        upgradePrompt: "Upgrade to Pro for unlimited scans",
      };
    }

    // Check monthly limit
    const scansUsed = user.monthlyScansUsed || 0;
    const scansRemaining = Math.max(0, 30 - scansUsed);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "starter" as AccessType,
        scansRemaining,
        instantCredits: user.instantCredits || 0,
        accountType: user.accountType as AccountType,
      };
    }

    // Monthly limit reached - check instant credits fallback
    if ((user.instantCredits || 0) > 0) {
      return {
        hasAccess: true,
        accessType: "instant_credit",
        scansRemaining: user.instantCredits!,
        instantCredits: user.instantCredits!,
        accountType: user.accountType as AccountType,
        upgradePrompt: "Using instant credits (STARTER monthly limit reached)",
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: user.accountType as AccountType,
      reason: "Monthly scan limit reached",
      upgradePrompt:
        "Upgrade to Pro for unlimited scans or purchase instant credits",
    };
  }

  private async validateFreeAccess(
    user: User
  ): Promise<AccessValidationResult> {
    // Existing free tier logic (daily limit)
    const now = new Date();
    const resetAt = user.scansResetAt ? new Date(user.scansResetAt) : null;

    if (!resetAt || now >= resetAt) {
      await this.resetDailyScans(user.id);
      return {
        hasAccess: true,
        accessType: "free",
        scansRemaining: 3,
        instantCredits: 0,
        accountType: user.accountType as AccountType,
        upgradePrompt: "Upgrade to STARTER for 30 scans/month",
      };
    }

    const scansUsed = user.scansToday || 0;
    const scansRemaining = Math.max(0, 3 - scansUsed);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "free",
        scansRemaining,
        instantCredits: 0,
        accountType: user.accountType as AccountType,
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: user.accountType as AccountType,
      reason: "Daily limit reached",
      upgradePrompt: "Upgrade to STARTER or purchase instant credits",
    };
  }

  /**
   * Reset monthly scans for STARTER tier users
   */
  private async resetMonthlyScans(userId: number): Promise<void> {
    // Calculate next reset (1st of next month)
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    await db
      .update(users)
      .set({
        monthlyScansUsed: 0,
        monthlyResetAt: nextMonth,
      })
      .where(eq(users.id, userId));
  }

  /**
   * Consume scan based on access type
   */
  async consumeScan(
    userId: number | null,
    accessType: AccessType,
    anonymousSessionId?: string
  ): Promise<boolean> {
    // ... anonymous and soft logic from Epic 1 ...

    if (!userId) return false;

    // Pro/Team/Enterprise - no consumption needed (unlimited)
    if (accessType === "pro" || accessType === "team") {
      return true;
    }

    // STARTER tier - monthly consumption
    if (accessType === "starter") {
      await db
        .update(users)
        .set({
          monthlyScansUsed: sql`${users.monthlyScansUsed} + 1`,
        })
        .where(eq(users.id, userId));
      return true;
    }

    // Instant credits
    if (accessType === "instant_credit") {
      const [result] = await db
        .update(users)
        .set({
          instantCredits: sql`GREATEST(${users.instantCredits} - 1, 0)`,
          instantCreditsUsedToday: sql`${users.instantCreditsUsedToday} + 1`,
        })
        .where(eq(users.id, userId))
        .returning({ updatedCredits: users.instantCredits });

      return result !== undefined;
    }

    // Free tier - daily consumption
    if (accessType === "free") {
      await db
        .update(users)
        .set({
          scansToday: sql`${users.scansToday} + 1`,
        })
        .where(eq(users.id, userId));
      return true;
    }

    return false;
  }

  private noAccessResult(reason: string): AccessValidationResult {
    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      reason,
    };
  }
}
```

**Cron Job for Monthly Resets**:

```typescript
// app/api/cron/monthly-reset/route.ts (NEW FILE)
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Reset all STARTER users whose reset date has passed
    const result = await db
      .update(users)
      .set({
        monthlyScansUsed: 0,
        monthlyResetAt: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
          0,
          0,
          0,
          0
        ),
      })
      .where(and(eq(users.tier, "starter"), lte(users.monthlyResetAt, now)));

    return NextResponse.json({
      status: "success",
      message: `Reset ${result.rowCount} STARTER tier users`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Monthly reset failed:", error);
    return NextResponse.json(
      { status: "error", error: "Reset failed" },
      { status: 500 }
    );
  }
}
```

**Vercel Cron Configuration**:

```json
// vercel.json (UPDATE or CREATE)
{
  "crons": [
    {
      "path": "/api/cron/monthly-reset",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Files to Create**:

- `app/api/cron/monthly-reset/route.ts`

**Files to Modify**:

- `lib/services/access-validation.service.ts` (major update)
- `vercel.json` (add cron job)

**Testing Checklist**:

- [ ] STARTER users get 30 scans/month
- [ ] Monthly counter increments correctly
- [ ] Reset triggers on 1st of month
- [ ] Fallback to instant credits works
- [ ] Priority order correct
- [ ] Cron job runs successfully

---

### Ticket 2.4: STARTER Tier Stripe Checkout Flow

**Priority**: 🟡 HIGH | **Effort**: 4 hours | **Dependencies**: Tickets 2.2, 2.3

**Description**:
Implement Stripe checkout for STARTER tier subscriptions. Update webhook to handle STARTER subscription creation.

**Acceptance Criteria**:

- [ ] Checkout creates STARTER subscription
- [ ] Webhook upgrades user to 'starter' tier
- [ ] Monthly limit set to 30 scans
- [ ] Monthly reset date initialized
- [ ] Annual subscription supported

**Technical Specifications**:

```typescript
// app/api/checkout/subscription/route.ts (UPDATE)
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await authService.getUserByStackUserId(user.id);
  const { tier, interval } = await req.json(); // tier: 'starter' | 'pro' | 'team', interval: 'month' | 'year'

  if (!["starter", "pro", "team"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const pricingConfig = getSubscriptionPlan(tier as SubscriptionTier, interval);

  if (!pricingConfig.stripePriceId) {
    return NextResponse.json(
      { error: "Stripe price ID not configured" },
      { status: 500 }
    );
  }

  // Create or retrieve Stripe customer
  let stripeCustomerId = appUser.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: appUser.email,
      metadata: {
        userId: appUser.id.toString(),
        stackUserId: user.id,
      },
    });
    stripeCustomerId = customer.id;

    await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, appUser.id));
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: pricingConfig.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?success=true&tier=${tier}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?cancelled=true`,
    metadata: {
      userId: appUser.id.toString(),
      tier,
      interval,
    },
  });

  return NextResponse.json({
    status: "success",
    data: {
      sessionId: session.id,
      url: session.url,
    },
  });
}
```

```typescript
// app/api/stripe/webhook/route.ts (UPDATE)
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription") {
          await handleSubscriptionCheckout(session);
        } else {
          // Instant credits purchase (existing logic)
          await handleInstantCreditsCheckout(session);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      // ... other webhook events ...
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.userId || "0", 10);
  const tier = session.metadata?.tier as "starter" | "pro" | "team";

  if (!userId || !tier) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Set monthly reset for STARTER tier
  const now = new Date();
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  await db
    .update(users)
    .set({
      tier,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      subscriptionStatus: "active",
      ...(tier === "starter" && {
        monthlyScansLimit: 30,
        monthlyScansUsed: 0,
        monthlyResetAt: nextMonth,
      }),
    })
    .where(eq(users.id, userId));

  // Send welcome email
  // await emailService.sendWelcomeEmail(user, tier);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!user) return;

  await db
    .update(users)
    .set({
      subscriptionStatus:
        subscription.status === "active" ? "active" : "cancelled",
    })
    .where(eq(users.id, user.id));
}

async function handleSubscriptionCancellation(
  subscription: Stripe.Subscription
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!user) return;

  // Downgrade to free tier, but keep instant credits
  await db
    .update(users)
    .set({
      tier: "free",
      subscriptionStatus: "cancelled",
      monthlyScansLimit: 0,
      monthlyScansUsed: 0,
      monthlyResetAt: null,
    })
    .where(eq(users.id, user.id));

  // Send cancellation feedback request
  // await emailService.sendCancellationFeedback(user);
}
```

**Files to Create**:

- None

**Files to Modify**:

- `app/api/checkout/subscription/route.ts` (add STARTER support)
- `app/api/stripe/webhook/route.ts` (handle STARTER tier)

**Testing Checklist**:

- [ ] Checkout session creates correctly
- [ ] STARTER monthly subscription activates
- [ ] STARTER annual subscription activates
- [ ] Monthly limit set to 30
- [ ] Reset date initialized correctly
- [ ] Webhook handles subscription events
- [ ] Cancellation downgrades to free tier

---

## Epic 3: Anti-Fraud Implementation (Week 2)

### Ticket 3.1: Fraud Detection Service

**Priority**: 🔴 CRITICAL | **Effort**: 6 hours | **Dependencies**: None

**Description**:
Create comprehensive fraud detection service for referral validation. Implement multi-layered checks including IP, device fingerprinting, disposable email detection, and behavioral analysis.

**Acceptance Criteria**:

- [ ] IP address validation (same IP as referrer blocked)
- [ ] Device fingerprinting comparison
- [ ] Disposable email detection (500+ domains)
- [ ] Timing analysis (signup <60s flagged)
- [ ] Email verification requirement
- [ ] First scan completion requirement

**Technical Specifications**:

```typescript
// lib/config/disposable-domains.ts (NEW FILE)
/**
 * List of disposable email domains for fraud detection
 * Source: github.com/disposable-email-domains
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  "0-mail.com",
  "0815.ru",
  "0clickemail.com",
  "0wnd.net",
  "0wnd.org",
  "10mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "123-m.com",
  "1pad.de",
  "20email.eu",
  "20minutemail.com",
  "2prong.com",
  "30minutemail.com",
  "33mail.com",
  "3d-painting.com",
  "4warding.com",
  "4warding.net",
  "4warding.org",
  "60minutemail.com",
  "675hosting.com",
  "675hosting.net",
  "675hosting.org",
  "6url.com",
  "75hosting.com",
  "75hosting.net",
  "75hosting.org",
  "7tags.com",
  "9ox.net",
  "a-bc.net",
  "agedmail.com",
  "ama-trade.de",
  "amilegit.com",
  "anonbox.net",
  "anonymbox.com",
  "antichef.com",
  "antichef.net",
  "antispam.de",
  "baxomale.ht.cx",
  "beefmilk.com",
  "binkmail.com",
  "bio-muesli.net",
  "bobmail.info",
  "bodhi.lawlita.com",
  "bofthew.com",
  "bootybay.de",
  "brennendesreich.de",
  "broadbandninja.com",
  "bsnow.net",
  "bugmenot.com",
  "bumpymail.com",
  "casualdx.com",
  "centermail.com",
  "centermail.net",
  "chammy.info",
  "childsavetrust.org",
  "chogmail.com",
  "choicemail1.com",
  "cool.fr.nf",
  "correo.blogos.net",
  "cosmorph.com",
  "courriel.fr.nf",
  "courrieltemporaire.com",
  "crapmail.org",
  "cust.in",
  "dacoolest.com",
  "dandikmail.com",
  "dayrep.com",
  "dcemail.com",
  "deadaddress.com",
  "deadspam.com",
  "delikkt.de",
  "despam.it",
  "despammed.com",
  "devnullmail.com",
  "dfgh.net",
  "digitalsanctuary.com",
  "discardmail.com",
  "discardmail.de",
  "disposableaddress.com",
  "disposableemailaddresses.com",
  "disposableinbox.com",
  "dispose.it",
  "dispostable.com",
  "dm.w3internet.co.uk",
  "dodgeit.com",
  "dodgit.com",
  "dodgit.org",
  "donemail.ru",
  "dontreg.com",
  "dontsendmespam.de",
  "drdrb.com",
  "dump-email.info",
  "dumpandjunk.com",
  "dumpmail.de",
  "dumpyemail.com",
  "e-mail.com",
  "e-mail.org",
  "e4ward.com",
  "easytrashmail.com",
  "emailias.com",
  "emailigo.de",
  "emailinfive.com",
  "emailmiser.com",
  "emailsensei.com",
  "emailtemporanea.com",
  "emailtemporanea.net",
  "emailtemporar.ro",
  "emailtemporario.com.br",
  "emailthe.net",
  "emailtmp.com",
  "emailwarden.com",
  "emailx.at.hm",
  "emailxfer.com",
  "emz.net",
  "enterto.com",
  "ephemail.net",
  "ero-tube.org",
  "etranquil.com",
  "etranquil.net",
  "etranquil.org",
  "evopo.com",
  "explodemail.com",
  "fakeinbox.com",
  "fakeinformation.com",
  "fansworldwide.de",
  "fantasymail.de",
  "fightallspam.com",
  "filzmail.com",
  "fixmail.tk",
  "fizmail.com",
  "fleckens.hu",
  "frapmail.com",
  "freetmail.com",
  "fuckingduh.com",
  "fudgerub.com",
  "fyii.de",
  "garliclife.com",
  "gehensiemirnichtaufdensack.de",
  "get2mail.fr",
  "getairmail.com",
  "getmails.eu",
  "getonemail.com",
  "getnowtoday.cf",
  "giantmail.de",
  "girlsundertheinfluence.com",
  "gishpuppy.com",
  "gmxmail.com",
  "goemailgo.com",
  "gotmail.com",
  "gotmail.net",
  "gotmail.org",
  "gotti.otherinbox.com",
  "great-host.in",
  "greensloth.com",
  "grr.la",
  "gsrv.co.uk",
  "guerillamail.biz",
  "guerillamail.com",
  "guerillamail.de",
  "guerillamail.info",
  "guerillamail.net",
  "guerillamail.org",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "gustr.com",
  "harakirimail.com",
  "hat-geld.de",
  "hatespam.org",
  "herp.in",
  "hidemail.de",
  "hidzz.com",
  "hmamail.com",
  "hopemail.biz",
  "ieh-mail.de",
  "ikbenspamvrij.nl",
  "imails.info",
  "inbax.tk",
  "inbox.si",
  "inboxclean.com",
  "inboxclean.org",
  "incognitomail.com",
  "incognitomail.net",
  "incognitomail.org",
  "infocom.zp.ua",
  "instant-mail.de",
  "ip6.li",
  "irish2me.com",
  "iwi.net",
  "jetable.com",
  "jetable.fr.nf",
  "jetable.net",
  "jetable.org",
  "jnxjn.com",
  "junk1e.com",
  "kasmail.com",
  "kaspop.com",
  "keepmymail.com",
  "killmail.com",
  "killmail.net",
  "kir.ch.tc",
  "klassmaster.com",
  "klzlk.com",
  "koszmail.pl",
  "kulturbetrieb.info",
  "kurzepost.de",
  "letthemeatspam.com",
  "lhsdv.com",
  "lifebyfood.com",
  "link2mail.net",
  "litedrop.com",
  "lol.ovpn.to",
  "lookugly.com",
  "lopl.co.cc",
  "lortemail.dk",
  "lr78.com",
  "lroid.com",
  "lukop.dk",
  "m4ilweb.info",
  "maboard.com",
  "mail-temporaire.fr",
  "mail.by",
  "mail.mezimages.net",
  "mail.zp.ua",
  "mail1a.de",
  "mail21.cc",
  "mail2rss.org",
  "mail333.com",
  "mail4trash.com",
  "mailbidon.com",
  "mailblocks.com",
  "mailbucket.org",
  "mailcat.biz",
  "mailcatch.com",
  "mailde.de",
  "mailde.info",
  "maildrop.cc",
  "maileater.com",
  "mailed.in",
  "mailed.ro",
  "mailexpire.com",
  "mailfa.tk",
  "mailforspam.com",
  "mailfreeonline.com",
  "mailguard.me",
  "mailimate.com",
  "mailin8r.com",
  "mailinater.com",
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  "mailincubator.com",
  "mailismagic.com",
  "mailmate.com",
  "mailme.gq",
  "mailme.lv",
  "mailme24.com",
  "mailmetrash.com",
  "mailmoat.com",
  "mailms.com",
  "mailnator.com",
  "mailnesia.com",
  "mailnull.com",
  "mailorg.org",
  "mailpick.biz",
  "mailpooch.com",
  "mailproxsy.com",
  "mailquack.com",
  "mailrock.biz",
  "mailscrap.com",
  "mailshell.com",
  "mailsiphon.com",
  "mailslapping.com",
  "mailslite.com",
  "mailtemp.info",
  "mailtome.de",
  "mailtothis.com",
  "mailtrash.net",
  "mailtv.net",
  "mailtv.tv",
  "mailzilla.com",
  "mailzilla.org",
  "makemetheking.com",
  "manybrain.com",
  "mbx.cc",
  "mega.zik.dj",
  "meinspamschutz.de",
  "meltmail.com",
  "messagebeamer.de",
  "mezimages.net",
  "ministry-of-silly-walks.de",
  "mintemail.com",
  "misterpinball.de",
  "mji.ro",
  "moakt.com",
  "mobi.web.id",
  "mobileninja.co.uk",
  "moburl.com",
  "mohmal.com",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "monumentmail.com",
  "mt2009.com",
  "mt2014.com",
  "muathegame.com",
  "mx0.wwwnew.eu",
  "my10minutemail.com",
  "mycard.net.ua",
  "mycleaninbox.net",
  "myemailboxy.com",
  "mymail-in.net",
  "mymailoasis.com",
  "mynetstore.de",
  "mypacks.net",
  "mypartyclip.de",
  "myphantomemail.com",
  "mysamp.de",
  "myspaceinc.com",
  "myspaceinc.net",
  "myspaceinc.org",
  "myspacepimpedup.com",
  "myspamless.com",
  "mytempemail.com",
  "mytempmail.com",
  "mytrashmail.com",
  "neomailbox.com",
  "nepwk.com",
  "nervmich.net",
  "nervtmich.net",
  "netmails.com",
  "netmails.net",
  "netzidiot.de",
  "neverbox.com",
  "nice-4u.com",
  "nincsmail.hu",
  "nnh.com",
  "no-spam.ws",
  "noblepioneer.com",
  "nomail.pw",
  "nomail.xl.cx",
  "nomail2me.com",
  "nomorespamemails.com",
  "nospam.ze.tc",
  "nospam4.us",
  "nospamfor.us",
  "nospammail.net",
  "notmailinator.com",
  "nowhere.org",
  "nowmymail.com",
  "nurfuerspam.de",
  "nus.edu.sg",
  "nwldx.com",
  "objectmail.com",
  "obobbo.com",
  "odaymail.com",
  "one-time.email",
  "oneoffemail.com",
  "onewaymail.com",
  "onlineidea.info",
  "ordinaryamerican.net",
  "otherinbox.com",
  "ourklips.com",
  "outlawspam.com",
  "ovpn.to",
  "owlpic.com",
  "pancakemail.com",
  "paplease.com",
  "pimpedupmyspace.com",
  "pjjkp.com",
  "politikerclub.de",
  "poofy.org",
  "pookmail.com",
  "privacy.net",
  "privatdemail.net",
  "proxymail.eu",
  "prtnx.com",
  "punkass.com",
  "putthisinyourspamdatabase.com",
  "qq.com",
  "quickinbox.com",
  "quickmail.nl",
  "rcpt.at",
  "recode.me",
  "recursor.net",
  "regbypass.com",
  "regbypass.comsafe-mail.net",
  "rejectmail.com",
  "relmix.com",
  "revoltnow.com",
  "rmqkr.net",
  "rtrtr.com",
  "rumgel.com",
  "s0ny.net",
  "safe-mail.net",
  "safersignup.de",
  "safetymail.info",
  "safetypost.de",
  "sandelf.de",
  "saynotospams.com",
  "schafmail.de",
  "schrott-email.de",
  "secretemail.de",
  "secure-mail.biz",
  "secure-mail.cc",
  "selfdestructingmail.com",
  "sendspamhere.com",
  "senseless-entertainment.com",
  "services391.com",
  "sharklasers.com",
  "shieldemail.com",
  "shiftmail.com",
  "shitmail.me",
  "shitmail.org",
  "shitware.nl",
  "shmeriously.com",
  "shortmail.net",
  "sibmail.com",
  "skeefmail.com",
  "slapsfromlastnight.com",
  "slaskpost.se",
  "slopsbox.com",
  "smellfear.com",
  "snakemail.com",
  "sneakemail.com",
  "sneakmail.de",
  "snkmail.com",
  "sofimail.com",
  "solvemail.info",
  "sogetthis.com",
  "soodonims.com",
  "spam4.me",
  "spamail.de",
  "spamarrest.com",
  "spambob.com",
  "spambob.net",
  "spambob.org",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "spambox.info",
  "spambox.irishspringrealty.com",
  "spambox.us",
  "spamcannon.com",
  "spamcannon.net",
  "spamcero.com",
  "spamcon.org",
  "spamcorptastic.com",
  "spamcowboy.com",
  "spamcowboy.net",
  "spamcowboy.org",
  "spamday.com",
  "spamex.com",
  "spamfree.eu",
  "spamfree24.com",
  "spamfree24.de",
  "spamfree24.eu",
  "spamfree24.info",
  "spamfree24.net",
  "spamfree24.org",
  "spamgoes.in",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "spamherelots.com",
  "spamhereplease.com",
  "spamhole.com",
  "spamify.com",
  "spaminator.de",
  "spamkill.info",
  "spaml.com",
  "spaml.de",
  "spammotel.com",
  "spamobox.com",
  "spamoff.de",
  "spamslicer.com",
  "spamspot.com",
  "spamthis.co.uk",
  "spamthisplease.com",
  "spamtrail.com",
  "spamtroll.net",
  "speed.1s.fr",
  "spoofmail.de",
  "stuffmail.de",
  "super-auswahl.de",
  "supergreatmail.com",
  "supermailer.jp",
  "superrito.com",
  "superstachel.de",
  "suremail.info",
  "talkinator.com",
  "teewars.org",
  "teleworm.com",
  "teleworm.us",
  "temp-mail.com",
  "temp-mail.de",
  "temp-mail.org",
  "temp-mail.ru",
  "tempe-mail.com",
  "tempemail.biz",
  "tempemail.com",
  "tempemail.net",
  "tempemail.org",
  "tempinbox.co.uk",
  "tempinbox.com",
  "tempmail.it",
  "tempmail2.com",
  "tempmaildemo.com",
  "tempmailer.com",
  "tempmailer.de",
  "tempomail.fr",
  "temporarily.de",
  "temporarioemail.com.br",
  "temporaryemail.net",
  "temporaryemail.us",
  "temporaryforwarding.com",
  "temporaryinbox.com",
  "temporarymailaddress.com",
  "tempthe.net",
  "thankyou2010.com",
  "thc.st",
  "thelimestones.com",
  "thisisnotmyrealemail.com",
  "thismail.net",
  "throwawayemailaddress.com",
  "tilien.com",
  "tittbit.in",
  "tizi.com",
  "tmailinator.com",
  "toomail.biz",
  "topranklist.de",
  "tradermail.info",
  "trash-mail.at",
  "trash-mail.com",
  "trash-mail.de",
  "trash2009.com",
  "trashdevil.com",
  "trashemail.de",
  "trashmail.at",
  "trashmail.com",
  "trashmail.de",
  "trashmail.me",
  "trashmail.net",
  "trashmail.org",
  "trashmail.ws",
  "trashmailer.com",
  "trashymail.com",
  "trashymail.net",
  "trialmail.de",
  "trillianpro.com",
  "trimix.cn",
  "tryalert.com",
  "turual.com",
  "twinmail.de",
  "tyldd.com",
  "uggsrock.com",
  "umail.net",
  "uroid.com",
  "us.af",
  "venompen.com",
  "veryrealemail.com",
  "viditag.com",
  "viralplays.com",
  "vpn.st",
  "vsimcard.com",
  "vubby.com",
  "wasteland.rfc822.org",
  "webemail.me",
  "webm4il.info",
  "wegwerfadresse.de",
  "wegwerfemail.com",
  "wegwerfemail.de",
  "wegwerfmail.de",
  "wegwerfmail.info",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "wetrainbayarea.com",
  "wetrainbayarea.org",
  "wh4f.org",
  "whatiaas.com",
  "whatpaas.com",
  "whatsaas.com",
  "whyspam.me",
  "wilemail.com",
  "willhackforfood.biz",
  "willselfdestruct.com",
  "winemaven.info",
  "wronghead.com",
  "wuzup.net",
  "wuzupmail.net",
  "www.e4ward.com",
  "www.gishpuppy.com",
  "www.mailinator.com",
  "wwwnew.eu",
  "xagloo.com",
  "xemaps.com",
  "xents.com",
  "xmaily.com",
  "xoxy.net",
  "yep.it",
  "yogamaven.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "yopmail.org",
  "yourdomain.com",
  "yuurok.com",
  "z1p.biz",
  "zehnminuten.de",
  "zehnminutenmail.de",
  "zippymail.info",
  "zoemail.com",
  "zomg.info",
] as const;

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return DISPOSABLE_EMAIL_DOMAINS.includes(domain as any);
}
```

```typescript
// lib/services/fraud-detection.service.ts (NEW FILE)
import { db } from "@/db";
import { users, referrals, referralEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isDisposableEmail } from "@/lib/config/disposable-domains";

export interface FraudCheckResult {
  valid: boolean;
  reason?: string;
  riskScore: number; // 0-100, higher = more suspicious
  flags: string[];
}

export class FraudDetectionService {
  /**
   * Comprehensive fraud validation for referrals
   */
  async validateReferral(
    referredEmail: string,
    referredIp: string,
    referredFingerprint: string,
    referrerId: number,
    signupTimestamp: Date,
    clickTimestamp?: Date
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // Get referrer data
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    if (!referrer) {
      return {
        valid: false,
        reason: "Referrer not found",
        riskScore: 100,
        flags: ["referrer_not_found"],
      };
    }

    // Check 1: Disposable Email
    if (isDisposableEmail(referredEmail)) {
      flags.push("disposable_email");
      riskScore += 40;
    }

    // Check 2: Same IP as Referrer
    if (referredIp === referrer.lastLoginIp) {
      flags.push("same_ip_as_referrer");
      riskScore += 30;
    }

    // Check 3: Same Device Fingerprint
    if (
      referredFingerprint &&
      referredFingerprint === referrer.deviceFingerprint
    ) {
      flags.push("same_device_as_referrer");
      riskScore += 35;
    }

    // Check 4: Timing Analysis (too fast signup)
    if (clickTimestamp) {
      const timeDiff = signupTimestamp.getTime() - clickTimestamp.getTime();
      if (timeDiff < 10000) {
        // <10 seconds
        flags.push("signup_too_fast");
        riskScore += 25;
      }
    }

    // Check 5: Email Domain Reputation
    const emailDomain = referredEmail.split("@")[1];
    if (await this.isDomainSuspicious(emailDomain)) {
      flags.push("suspicious_domain");
      riskScore += 20;
    }

    // Check 6: Referrer's Historical Fraud Rate
    const referrerFraudRate = await this.getReferrerFraudRate(referrerId);
    if (referrerFraudRate > 0.3) {
      // >30% fraud rate
      flags.push("referrer_high_fraud_rate");
      riskScore += 15;
    }

    // Check 7: Recent Referral Velocity (too many referrals too fast)
    const recentReferralCount = await this.getRecentReferralCount(
      referrerId,
      60
    ); // last hour
    if (recentReferralCount > 5) {
      flags.push("high_referral_velocity");
      riskScore += 20;
    }

    // Determine validity
    const valid = riskScore < 50; // Threshold for blocking

    return {
      valid,
      reason: valid ? undefined : `Fraud detected: ${flags.join(", ")}`,
      riskScore,
      flags,
    };
  }

  /**
   * Check if referred user completed first scan (required for reward)
   */
  async hasCompletedFirstScan(userId: number): Promise<boolean> {
    // Check audits table or anonymousScans table
    // For now, simplified check
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (user?.scansToday || 0) > 0;
  }

  /**
   * Check email verification status
   */
  async isEmailVerified(userId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.emailVerified || false;
  }

  /**
   * Check if domain is suspicious
   */
  private async isDomainSuspicious(domain: string): Promise<boolean> {
    // Check against known suspicious patterns
    const suspiciousPatterns = [
      /^\d+mail/, // Domains starting with numbers
      /temp/i,
      /trash/i,
      /fake/i,
      /burner/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(domain));
  }

  /**
   * Get referrer's historical fraud rate
   */
  private async getReferrerFraudRate(referrerId: number): Promise<number> {
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));

    if (allReferrals.length === 0) return 0;

    const cancelledCount = allReferrals.filter(
      (r) => r.status === "cancelled"
    ).length;
    return cancelledCount / allReferrals.length;
  }

  /**
   * Get recent referral count (velocity check)
   */
  private async getRecentReferralCount(
    referrerId: number,
    minutesAgo: number
  ): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    const recentReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .where(sql`${referrals.createdAt} >= ${cutoffTime}`);

    return recentReferrals.length;
  }

  /**
   * Log fraud attempt for analysis
   */
  async logFraudAttempt(
    referralId: string,
    fraudCheck: FraudCheckResult
  ): Promise<void> {
    // Store in referral metadata for analysis
    await db
      .update(referrals)
      .set({
        status: "cancelled",
        metadata: {
          fraudDetected: true,
          fraudRiskScore: fraudCheck.riskScore,
          fraudFlags: fraudCheck.flags,
          fraudReason: fraudCheck.reason,
          detectedAt: new Date().toISOString(),
        },
      })
      .where(eq(referrals.id, referralId));
  }
}

export const fraudDetectionService = new FraudDetectionService();
```

**Files to Create**:

- `lib/config/disposable-domains.ts`
- `lib/services/fraud-detection.service.ts`

**Files to Modify**:

- None yet (will be used in Ticket 3.2)

**Testing Checklist**:

- [ ] Disposable email detection works (500+ domains)
- [ ] IP comparison flags same IP
- [ ] Device fingerprint comparison works
- [ ] Timing analysis catches fast signups
- [ ] Risk score calculated correctly
- [ ] Fraud rate calculation accurate
- [ ] Velocity check detects spam

---

### Ticket 3.2: Referral Confirmation with Fraud Checks

**Priority**: 🔴 CRITICAL | **Effort**: 4 hours | **Dependencies**: Ticket 3.1

**Description**:
Integrate fraud detection into referral confirmation flow. Implement 7-day waiting period and first-scan requirement before distributing rewards.

**Acceptance Criteria**:

- [ ] Fraud check runs on referral signup
- [ ] High-risk referrals cancelled automatically
- [ ] Rewards delayed until email verified + first scan + 7 days
- [ ] Referrer notified of reward status
- [ ] Manual review queue for medium-risk

**Technical Specifications**:

```typescript
// lib/services/referral.service.ts (UPDATE)
import { fraudDetectionService } from "./fraud-detection.service";

export class ReferralService {
  /**
   * Create referral and run initial fraud check
   */
  async createReferral(
    referrerId: number,
    referredEmail: string,
    referredIp: string,
    referredFingerprint: string,
    clickTimestamp?: Date
  ): Promise<{ referralId: string; status: string }> {
    // Run fraud check
    const fraudCheck = await fraudDetectionService.validateReferral(
      referredEmail,
      referredIp,
      referredFingerprint,
      referrerId,
      new Date(),
      clickTimestamp
    );

    // Create referral record
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        status: fraudCheck.valid ? "pending" : "cancelled",
        rewardType: "scans",
        rewardAmount: 1, // +1 free scan per referral
        metadata: {
          signupIp: referredIp,
          signupFingerprint: referredFingerprint,
          fraudCheck: {
            riskScore: fraudCheck.riskScore,
            flags: fraudCheck.flags,
            checkedAt: new Date().toISOString(),
          },
        },
      })
      .returning();

    // Log fraud if detected
    if (!fraudCheck.valid) {
      await fraudDetectionService.logFraudAttempt(referral.id, fraudCheck);

      return {
        referralId: referral.id,
        status: "cancelled_fraud",
      };
    }

    // Medium risk (30-50) - flag for manual review
    if (fraudCheck.riskScore >= 30 && fraudCheck.riskScore < 50) {
      await this.flagForManualReview(referral.id, fraudCheck);
    }

    return {
      referralId: referral.id,
      status: fraudCheck.valid ? "pending" : "cancelled",
    };
  }

  /**
   * Confirm referral after validation period
   * Called by cron job daily or manually triggered
   */
  async confirmReferral(referralId: string): Promise<boolean> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, referralId))
      .limit(1);

    if (!referral || referral.status !== "pending") {
      return false;
    }

    const [referredUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, referral.referredId!))
      .limit(1);

    if (!referredUser) {
      return false;
    }

    // Validation checks
    const checks = {
      emailVerified: await fraudDetectionService.isEmailVerified(
        referredUser.id
      ),
      firstScanCompleted: await fraudDetectionService.hasCompletedFirstScan(
        referredUser.id
      ),
      accountAge: Date.now() - referral.createdAt.getTime(),
      requiredAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // All checks must pass
    if (!checks.emailVerified) {
      console.log(`Referral ${referralId}: Email not verified`);
      return false;
    }

    if (!checks.firstScanCompleted) {
      console.log(`Referral ${referralId}: First scan not completed`);
      return false;
    }

    if (checks.accountAge < checks.requiredAge) {
      console.log(
        `Referral ${referralId}: Account too new (${Math.floor(checks.accountAge / (24 * 60 * 60 * 1000))} days)`
      );
      return false;
    }

    // All checks passed - distribute reward
    await this.distributeReferralReward(referral);

    // Update referral status
    await db
      .update(referrals)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(referrals.id, referralId));

    return true;
  }

  /**
   * Distribute reward to referrer
   */
  private async distributeReferralReward(referral: Referral): Promise<void> {
    const rewardAmount = referral.rewardAmount || 1;

    if (referral.rewardType === "scans") {
      // Add bonus scans
      await db
        .update(users)
        .set({
          bonusScans: sql`${users.bonusScans} + ${rewardAmount}`,
        })
        .where(eq(users.id, referral.referrerId));
    }

    // Create reward ledger entry
    await db.insert(rewardsLedger).values({
      userId: referral.referrerId,
      referralId: referral.id,
      type: "scans",
      amount: rewardAmount,
      status: "applied",
      appliedAt: new Date(),
    });

    // Update referral status
    await db
      .update(referrals)
      .set({
        status: "rewarded",
        rewardedAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));

    // Send notification to referrer
    await this.sendRewardNotification(referral.referrerId, rewardAmount);
  }

  /**
   * Flag referral for manual review
   */
  private async flagForManualReview(
    referralId: string,
    fraudCheck: FraudCheckResult
  ): Promise<void> {
    await db
      .update(referrals)
      .set({
        metadata: {
          flaggedForReview: true,
          reviewReason: "Medium fraud risk score",
          fraudRiskScore: fraudCheck.riskScore,
          fraudFlags: fraudCheck.flags,
        },
      })
      .where(eq(referrals.id, referralId));

    // TODO: Send notification to admin dashboard
    console.log(
      `Referral ${referralId} flagged for manual review (risk: ${fraudCheck.riskScore})`
    );
  }

  /**
   * Send reward notification email
   */
  private async sendRewardNotification(
    userId: number,
    amount: number
  ): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return;

    // TODO: Send email via email service
    console.log(
      `Reward notification: ${user.email} received ${amount} bonus scans`
    );
  }

  /**
   * Cron job to process pending referrals
   */
  async processPendingReferrals(): Promise<{
    confirmed: number;
    pending: number;
  }> {
    const pendingReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.status, "pending"));

    let confirmed = 0;
    let stillPending = 0;

    for (const referral of pendingReferrals) {
      const success = await this.confirmReferral(referral.id);
      if (success) {
        confirmed++;
      } else {
        stillPending++;
      }
    }

    return { confirmed, pending: stillPending };
  }
}

export const referralService = new ReferralService();
```

```typescript
// app/api/cron/process-referrals/route.ts (NEW FILE)
import { referralService } from "@/lib/services/referral.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await referralService.processPendingReferrals();

    return NextResponse.json({
      status: "success",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Referral processing failed:", error);
    return NextResponse.json(
      { status: "error", error: "Processing failed" },
      { status: 500 }
    );
  }
}
```

**Vercel Cron Configuration**:

```json
// vercel.json (UPDATE)
{
  "crons": [
    {
      "path": "/api/cron/monthly-reset",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/process-referrals",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Files to Create**:

- `app/api/cron/process-referrals/route.ts`

**Files to Modify**:

- `lib/services/referral.service.ts` (major update)
- `vercel.json` (add referral processing cron)

**Testing Checklist**:

- [ ] Fraud check runs on referral creation
- [ ] High-risk referrals cancelled immediately
- [ ] Medium-risk flagged for review
- [ ] Rewards distributed after 7 days + verification + first scan
- [ ] Cron job processes pending referrals
- [ ] Notifications sent correctly

---

## Summary & Timeline

### Phase 1 Completion Checklist

**Week 1 - Progressive Signup:** ✅ **EPIC COMPLETED**

- [x] Ticket 1.1: Anonymous scan infrastructure (8h) ✅ COMPLETED
- [x] Ticket 1.2: Soft signup flow (6h) ✅ COMPLETED
- [x] Ticket 1.3: Hard signup trigger (4h) ✅ COMPLETED
- [x] Ticket 1.4: Access validation updates (6h) ✅ COMPLETED

**Total Epic 1 Effort**: 24 hours  
**Total Epic 1 Tickets**: 4/4 completed

**Week 2 - STARTER Tier & Anti-Fraud:**

- [x] Ticket 2.1: Database schema (3h)
- [x] Ticket 2.2: Pricing configuration (2h)
- [x] Ticket 2.3: Access validation logic (5h)
- [x] Ticket 2.4: Stripe checkout flow (4h)
- [x] Ticket 3.1: Fraud detection service (6h)
- [x] Ticket 3.2: Referral confirmation (4h)

**Total Effort**: 48 hours
**Expected Timeline**: 2 weeks (1 developer)

### Success Metrics (2 Weeks Post-Launch)

| Metric               | Before | Target | Measurement         |
| -------------------- | ------ | ------ | ------------------- |
| Conversion Rate      | 2%     | 4-6%   | Anonymous → Signup  |
| Paid User Conversion | 2.5%   | 4%     | Free → STARTER/PRO  |
| Fraud Rate           | N/A    | <5%    | Cancelled referrals |
| Monthly Revenue      | €5K    | €8-10K | Stripe dashboard    |

---

## Next Steps

1. ✅ Review tickets with development team
2. ✅ Create GitHub issues from tickets
3. ✅ Set up Stripe products (STARTER tier)
4. ✅ Configure environment variables
5. ✅ Run database migrations
6. ✅ Start development (Ticket 1.1)

**Ready to implement?** All technical specifications, code examples, and acceptance criteria are provided. Each ticket is self-contained and can be worked on sequentially or in parallel (where dependencies allow).
