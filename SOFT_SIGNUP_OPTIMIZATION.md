# Soft Signup Prompt Optimization

**Updated**: October 11, 2025  
**Component**: `components/auth/SoftSignupPrompt.tsx`  
**Status**: ✅ Optimized for earlier user capture

---

## 🎯 What Changed

### Trigger Point Optimization

**BEFORE:**

- Prompt appeared after **2 scans**
- Logic: `if (scansPerformed < 2) return null;`

**AFTER:**

- Prompt appears after **1+ scans**
- Logic: `if (scansPerformed < 1) return null;`

### Why This Change?

**Early Capture Strategy:**

- ✅ Captures user interest while still engaged
- ✅ Users have seen value (completed 1 scan)
- ✅ Still have 2 more anonymous scans to try
- ✅ Creates urgency to sign up before limit

**Conversion Psychology:**

- After 1 scan: User is intrigued, wants to continue
- After 2 scans: User might feel they have enough data
- **Earlier = Better** for signup conversion

---

## 📝 Copy Updates

### Updated Messaging

**Title:**

```diff
- 💾 Save Your Scans
+ 💾 Save Your Scans & Get More
```

_More action-oriented, emphasizes getting more value_

**Opening Line:**

```diff
- You've completed X scans.
+ Great start! You've completed X scans.
```

_Positive reinforcement, encourages continuation_

**Remaining Scans:**

```diff
- (X remaining today)
+ — you have X more scan[s] left today
```

_More conversational, creates awareness of remaining value_

---

## 🎨 User Experience Flow

### New Flow (After 1 Scan):

```
User lands on /audit
    ↓
Performs FIRST scan
    ↓
✨ Soft signup prompt appears ✨
    ↓
"Great start! You've completed 1 scan"
"...get 3 free scans daily — you have 2 more scans left today"
    ↓
[Benefits + Magic Link Signup]
    ↓
User signs up early (high engagement)
```

### Previous Flow (After 2 Scans):

```
User lands on /audit
    ↓
Performs 1st scan (no prompt)
    ↓
Performs 2nd scan
    ↓
Soft signup prompt appears
    ↓
"You've completed 2 scans"
    ↓
Only 1 scan remaining
```

---

## 📊 Expected Impact

### Conversion Rate Improvements

**Hypothesis:**

- **Current (2 scans):** ~40-50% soft signup rate
- **Target (1 scan):** ~50-60% soft signup rate
- **Reasoning:** Earlier engagement = higher intent

### Funnel Metrics to Monitor

```typescript
// Track these in PostHog/Analytics:

1. Prompt Display Rate
   - % of users who see prompt after 1st scan

2. Signup Conversion Rate
   - % of users who enter email when prompt shows

3. Magic Link Click Rate
   - % who click the magic link in email

4. Account Completion Rate
   - % who complete full Stack Auth signup

5. Retention Rate
   - % who return after signup vs anonymous
```

---

## 🧪 A/B Testing Recommendations

### Test Variants

**Variant A (Current):**

- Show after 1 scan
- Message: "Great start! You've completed 1 scan"

**Variant B (Aggressive):**

- Show immediately on landing (before scan)
- Message: "Sign up for 3 free scans daily"

**Variant C (Delayed):**

- Show after 2 scans (original)
- Message: Original copy

### Measure:

- Signup rate per variant
- Total scans per user
- User retention (7-day, 30-day)
- Upgrade to paid rate

---

## 🎁 Benefits Highlighted

The prompt now emphasizes:

1. **Save unlimited scan history** ✓
   - Addresses fear of losing data

2. **3 free scans every day** ✓
   - Creates ongoing value perception

3. **No password required (magic link)** ✓
   - Reduces friction, eases concerns

---

## 🔍 User Psychology

### Why Show After 1 Scan Works

**Timing Optimization:**

- ✅ User has experienced value (1 scan completed)
- ✅ Still curious and engaged (wants more)
- ✅ Has 2 more free scans to test (no pressure)
- ✅ Creates positive momentum ("Great start!")

**Friction Reduction:**

- Magic link signup (no password)
- Clear benefits listed
- Shows remaining free scans
- Dismissible (not blocking)

**FOMO (Fear of Missing Out):**

- "Save your results" → might lose data
- "3 free scans daily" → ongoing benefit
- "X more scans left today" → urgency

---

## 📈 Success Metrics

### Week 1 Targets:

- [ ] 50%+ soft signup rate after 1st scan
- [ ] 60%+ magic link click rate
- [ ] 80%+ account completion rate
- [ ] 2+ average daily scans per soft account

### Month 1 Targets:

- [ ] 60%+ total soft signup rate
- [ ] 70%+ soft → full account conversion
- [ ] 4-6% soft → paid conversion
- [ ] Higher retention vs anonymous users

---

## 🛠️ Implementation Details

### Code Changes

**File:** `components/auth/SoftSignupPrompt.tsx`

**Line 26:**

```typescript
// BEFORE
if (scansPerformed < 2) return null;

// AFTER
if (scansPerformed < 1) return null;
```

**Lines 106-118:**

```typescript
// Updated title and copy
<h3>💾 Save Your Scans & Get More</h3>
<p>Great start! You've completed {scansPerformed} scan{s}.</p>
<p>...you have {scansRemaining} more scan{s} left today</p>
```

### Integration Points

**Where Used:**

- `components/scan/ScanInterface.tsx` (displays the prompt)
- Triggered by `scansPerformed` prop from parent component
- Anonymous session tracking via cookie

**Dependencies:**

- Stack Auth `MagicLinkSignIn` component
- Redis for session tracking
- Soft signup API endpoint

---

## 🔄 Rollback Plan

If conversion rates decrease:

1. **Easy Rollback:**

   ```typescript
   // Change line 26 back to:
   if (scansPerformed < 2) return null;
   ```

2. **Alternative: Progressive Display**

   ```typescript
   // Show minimal prompt after 1, full prompt after 2
   const showMinimal = scansPerformed === 1;
   const showFull = scansPerformed >= 2;
   ```

3. **Test Different Triggers:**
   - After scan completion
   - After viewing results
   - On exit intent
   - Time-based (30 seconds)

---

## 📝 Copy Variants to Test

### Alternative Headlines:

1. "💾 Save Your Scans & Get More" ✅ (current)
2. "🎉 Loving it? Create an Account"
3. "✨ Get 3 Free Scans Daily"
4. "🔒 Don't Lose Your Results"
5. "🚀 Unlock More Scans"

### Alternative CTAs:

1. "Save Your Scans" (current via magic link)
2. "Continue with Email"
3. "Get My Free Scans"
4. "Save & Continue"
5. "Unlock More"

---

## 🎯 Next Optimizations

### Future Improvements:

1. **Smart Timing:**
   - Delay 2-3 seconds after first scan
   - Wait for user to scroll through results
   - Show on second page view

2. **Personalization:**
   - Different message for high-risk contracts
   - Different message for low-risk contracts
   - Referral-specific messaging

3. **Progressive Disclosure:**
   - Minimal prompt after 1 scan
   - Full prompt after 2 scans
   - Urgent prompt at 3 scans (last one)

4. **Exit Intent:**
   - Show if user tries to leave after 1 scan
   - "Wait! Save your results before you go"

---

## 📚 Related Documentation

- **Epic 1 Summary:** `EPIC_1_COMPLETION_SUMMARY.md`
- **Magic Link Fix:** `MAGIC_LINK_FIX.md`
- **Auth Error Page:** `AUTH_ERROR_PAGE.md`
- **Access Validation:** `lib/services/access-validation.service.ts`

---

## ✅ Testing Checklist

### Manual Testing:

- [ ] Visit `/audit` (anonymous)
- [ ] Complete 1 scan
- [ ] Verify prompt appears
- [ ] Check copy displays correctly
- [ ] Test magic link signup flow
- [ ] Verify "2 more scans left" message
- [ ] Test close button
- [ ] Test on mobile

### Analytics Events to Track:

```typescript
// Add these events:
analytics.track("soft_signup_prompt_shown", {
  scans_performed: 1,
  scans_remaining: 2,
  trigger: "after_first_scan",
});

analytics.track("soft_signup_initiated", {
  scans_performed: 1,
  email: userEmail,
});

analytics.track("soft_signup_completed", {
  scans_performed: 1,
  account_type: "soft",
});
```

---

**Status:** ✅ **Optimized - Ready for Testing**  
**Expected Impact:** +10-20% soft signup conversion rate  
**Risk:** Low (easy to rollback)  
**Next Step:** Monitor analytics for 1 week
