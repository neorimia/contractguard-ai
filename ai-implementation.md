AI Selector Design Specification

Overview

Design for conditional AI provider selector in CryptoScanInterface.tsx that displays only for instant credits and subscription users.

  ---
1. System Architecture Analysis

Current User Access Hierarchy

Priority Order (Highest → Lowest):
1. Pro/Team subscription → unlimited, AI selector enabled
2. Instant credits → pay-per-scan, AI selector enabled
3. Free/Soft accounts → 3 scans/day, default AI (no selector)
4. Anonymous → 3 total scans, default AI (no selector)

Access Types

- "pro" - Pro subscription (AI selector ✅)
- "team" - Team subscription (AI selector ✅)
- "instant_credit" - Pay-per-scan credits (AI selector ✅)
- "free" - Free tier account (AI selector ❌)
- "soft" - Email-only account (AI selector ❌)
- "anonymous" - No account (AI selector ❌)

Existing State Management

// components/crypto/CryptoScanInterface.tsx:84-89
const [userAccessStatus, setUserAccessStatus] = useState<{
accessType: string;
scansRemaining: number;
instantCredits: number;
accountType?: string;
} | null>(null);

  ---
2. Conditional Rendering Logic

Display Rule

const shouldShowAISelector =
userAccessStatus && (
userAccessStatus.accessType === "pro" ||
userAccessStatus.accessType === "team" ||
userAccessStatus.instantCredits > 0
);

Logic Breakdown

| User Type                   | instantCredits | accessType       | Show Selector? |
  |-----------------------------|----------------|------------------|----------------|
| Pro subscription            | 0              | "pro"            | ✅ Yes          |
| Team subscription           | 0              | "team"           | ✅ Yes          |
| Instant credits (purchased) | >0             | "instant_credit" | ✅ Yes          |
| Free tier                   | 0              | "free"           | ❌ No           |
| Soft signup                 | 0              | "soft"           | ❌ No           |
| Anonymous                   | 0              | "anonymous"      | ❌ No           |

  ---
3. Component State Management

New State Addition

// Add to CryptoScanInterface component
const [selectedAI, setSelectedAI] = useState<"chatgpt" | "claude">("chatgpt");

State Flow

1. Initialization: Default to "chatgpt"
2. User Selection: Update via dropdown onChange
3. Scan Request: Pass selectedAI to audit API endpoint
4. Persistence: Optional - store in localStorage for session persistence

  ---
4. UX Design Specifications

For Paid Users (instantCredits > 0 OR subscription)

  <div className="space-y-3">
    <Label className="text-white text-sm font-medium">
      Select AI Provider
    </Label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading} className="...">
          <span>{selectedAI === "chatgpt" ? "ChatGPT" : "Claude"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="...">
        <DropdownMenuItem onClick={() => setSelectedAI("chatgpt")}>
          ChatGPT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSelectedAI("claude")}>
          Claude
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

For Free Users (free, soft, anonymous)

{/* AI selector completely hidden - no visual indication */}
{/* Uses default ChatGPT provider silently */}

Loading State

{/* Hide selector until userAccessStatus is loaded */}
{userAccessStatus && shouldShowAISelector && (
<div className="space-y-3">
{/* AI Selector UI */}
</div>
)}

  ---
5. Implementation Strategy

Code Changes Required

5.1 Add State (Line ~68)

const [selectedAI, setSelectedAI] = useState<"chatgpt" | "claude">("chatgpt");

5.2 Create Helper Function (Line ~120)

const shouldShowAISelector = () => {
if (!userAccessStatus) return false;

    return (
      userAccessStatus.accessType === "pro" ||
      userAccessStatus.accessType === "team" ||
      userAccessStatus.instantCredits > 0
    );
};

5.3 Update AI Selector Section (Lines 571-596)

{/* AI Provider selector - Only for instant credits and subscription users */}
{shouldShowAISelector() && (
<div className="space-y-3">
<Label className="text-white text-sm font-medium">
Select AI Provider
</Label>
<DropdownMenu>
<DropdownMenuTrigger asChild>
<Button
variant="outline"
disabled={loading}
className="w-full justify-between bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900 hover:text-white h-12"
>
<span>{selectedAI === "chatgpt" ? "ChatGPT" : "Claude"}</span>
<ChevronDown className="h-4 w-4 opacity-50" />
</Button>
</DropdownMenuTrigger>
<DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-[300px] bg-neutral-900 border-neutral-800">
<DropdownMenuItem
onClick={() => setSelectedAI("chatgpt")}
className="text-white hover:bg-neutral-800 cursor-pointer"
>
<span>ChatGPT</span>
</DropdownMenuItem>
<DropdownMenuItem
onClick={() => setSelectedAI("claude")}
className="text-white hover:bg-neutral-800 cursor-pointer"
>
<span>Claude</span>
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</div>
)}

5.4 Update Scan Handler

const handleScan = async () => {
// ... existing code ...

    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractAddress: address,
        chain,
        aiProvider: selectedAI, // Add AI provider selection
        // ... other params
      }),
    });

    // ... existing code ...
};

  ---
6. API Integration

Audit API Enhancement

The /api/audit endpoint should accept aiProvider parameter:

// app/api/audit/route.ts
interface AuditRequest {
contractAddress: string;
chain: string;
aiProvider?: "chatgpt" | "claude"; // Optional, defaults to "chatgpt"
// ... other fields
}

  ---
7. Edge Cases & Considerations

Loading State

- Issue: Selector might flash on initial render
- Solution: Only render when userAccessStatus is loaded

Credits Depletion

- Issue: User with credits exhausts them mid-session
- Solution: Re-fetch userAccessStatus after each scan to update UI dynamically

Subscription Expiry

- Issue: Subscription expires during session
- Solution: Webhook updates user tier, next scan triggers re-validation

Anonymous → Paid Upgrade

- Issue: User purchases credits while anonymous
- Solution: Guest session links purchase, selector appears after payment confirmation

  ---
8. Testing Scenarios

| Test Case | User Type                      | Expected Behavior                              |
  |-----------|--------------------------------|------------------------------------------------|
| TC-1      | Pro subscription               | AI selector visible, can toggle ChatGPT/Claude |
| TC-2      | Team subscription              | AI selector visible, can toggle ChatGPT/Claude |
| TC-3      | Instant credits (10 credits)   | AI selector visible, can toggle ChatGPT/Claude |
| TC-4      | Free tier (0 credits)          | No AI selector, uses default ChatGPT           |
| TC-5      | Soft signup (email only)       | No AI selector, uses default ChatGPT           |
| TC-6      | Anonymous visitor              | No AI selector, uses default ChatGPT           |
| TC-7      | Credits depleted (0 remaining) | Selector hidden after last credit used         |
| TC-8      | Purchase credits mid-session   | Selector appears after payment webhook         |

  ---
9. Performance Considerations

Optimization Strategy

1. Single API Call: Leverage existing /api/user/access-status endpoint
2. No Additional Fetches: Use cached userAccessStatus state
3. Minimal Re-renders: Conditional rendering based on boolean flag
4. localStorage: Optional persistence for AI selection preference

  ---
10. Future Enhancements

Phase 2 Improvements

1. AI Provider Icons: Add OpenAI and Anthropic logos
2. Performance Badges: "Fastest" or "Most Accurate" indicators
3. Usage Analytics: Track AI provider selection by user tier
4. A/B Testing: Compare conversion rates with/without selector
5. Credits Display: Show remaining credits next to selector

  ---

⏺ Summary

I've designed a comprehensive solution for conditionally showing the AI provider selector to instant credits and subscription users.

Key Design Decisions

Display Logic: AI selector appears ONLY for:
- Pro/Team subscription users (accessType === "pro" | "team")
- Users with instant credits (instantCredits > 0)

Implementation Approach:
- ✅ Minimal code changes (3 modifications to existing component)
- ✅ Leverages existing userAccessStatus state (no new API calls)
- ✅ Clean conditional rendering with helper function
- ✅ No visual clutter for free users (selector completely hidden)

User Experience:
- Paid users: Full AI provider choice with dropdown selector
- Free users: Silent default to ChatGPT (no selector shown)
- Loading state: Selector hidden until access status confirmed

Implementation Files

- Primary: components/crypto/CryptoScanInterface.tsx (lines 571-596)
- API Enhancement: /api/audit/route.ts (accept aiProvider parameter)

The design specification above includes complete code examples, testing scenarios, edge case handling, and future enhancement opportunities. Ready for implementation.
