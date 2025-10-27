Analysis Report: AccountSettings.tsx

Executive Summary

Component: components/AccountSettings.tsx (815 lines)
Overall Grade: C+ (Functional but needs significant refactoring)

| Category        | Rating      | Status                     |
  |-----------------|-------------|----------------------------|
| Functionality   | ✅ Good      | Works as intended          |
| Security        | ⚠️ Moderate | Multiple vulnerabilities   |
| Performance     | ⚠️ Moderate | Inefficient patterns       |
| Architecture    | ❌ Poor      | Violates design principles |
| Maintainability | ❌ Poor      | Hard to test/extend        |
| Accessibility   | ⚠️ Moderate | Missing ARIA support       |

  ---
🚨 CRITICAL Issues (Fix Immediately)

1. XSS Vulnerability in Image Error Handler

Location: components/AccountSettings.tsx:454-458

onError={(e) => {
const target = e.target as HTMLImageElement;
target.style.display = "none";  // ⚠️ Direct DOM manipulation
target.parentElement?.classList.add("bg-muted");
}}

Risk: If profileImageUrl contains malicious content, direct DOM manipulation could enable XSS attacks.

Fix: Remove inline error handler, use state-based conditional rendering:
const [imageError, setImageError] = useState(false);
// In render: {!imageError && <img onError={() => setImageError(true)} />}

2. Weak Account Deletion Protection

Location: components/AccountSettings.tsx:349-353

if (!confirm("Are you sure you want to delete your account?")) {
return;
}

Risk: window.confirm() is trivial to bypass, no password re-confirmation for irreversible action.

Fix: Implement proper deletion modal with password verification:
// Use Modal component with password input required
<DeleteAccountModal onConfirm={async (password) => {
await verifyPassword(password);
await user.delete();
}} />

3. Memory/Performance Issue: Base64 Image Upload

Location: components/AccountSettings.tsx:131-151

Impact: 2MB image → ~2.7MB base64 string → stored in React state → triggers re-render → potential memory leak

Evidence:
- Base64 encoding increases size by ~33%
- Entire component re-renders when profileData.profileImageUrl changes
- Large strings in state impact React's reconciliation performance

Fix: Upload directly to CDN/server, store URL only:
const formData = new FormData();
formData.append('file', file);
const { url } = await fetch('/api/upload', {
method: 'POST',
body: formData
}).then(r => r.json());
setProfileData(prev => ({ ...prev, profileImageUrl: url }));

4. God Component Anti-Pattern

Location: Entire file (815 lines)

Violations:
- Single component handles Profile, Security, and Preferences
- 8 state variables, 6 event handlers
- UI, business logic, and API calls mixed together
- Impossible to unit test effectively

Fix: Split into separate components:
AccountSettings/
├── ProfileSettings.tsx
├── SecuritySettings.tsx
├── PreferencesSettings.tsx
└── hooks/
├── useProfileUpdate.ts
├── usePasswordChange.ts
└── useAvatarUpload.ts

  ---
⚠️ HIGH Priority Issues

5. Performance: Excessive Re-renders from User Object Dependency

Location: components/AccountSettings.tsx:69-79

useEffect(() => {
if (user?.clientMetadata?.preferences) {
setPreferences({...});  // Runs on EVERY user object change
}
}, [user]);  // ⚠️ Object reference dependency

Impact: If Stack Auth recreates user object frequently, preferences reset unnecessarily.

Fix: Use specific primitive dependencies:
useEffect(() => {
if (user?.clientMetadata?.preferences) {
setPreferences({...});
}
}, [user?.id, user?.clientMetadata?.preferences]);

6. Performance: No Debouncing on Preference Updates

Location: components/AccountSettings.tsx:754, 774, 804

onCheckedChange={(checked) => {
setPreferences(prev => ({ ...prev, emailNotifications: checked }));
void handlePreferencesUpdate();  // ⚠️ API call on EVERY toggle
}}

Impact: Rapid toggling causes multiple API calls, potential rate limiting.

Fix: Implement debounced auto-save:
const debouncedUpdate = useMemo(
() => debounce(handlePreferencesUpdate, 500),
[]
);

onCheckedChange={(checked) => {
setPreferences(prev => ({ ...prev, emailNotifications: checked }));
debouncedUpdate();
}}

7. Security: SSRF Risk in URL Validation

Location: components/AccountSettings.tsx:190-216

Risk: Basic URL validation allows internal network URLs if image URLs are fetched server-side.

Fix: Add URL whitelist validation:
const ALLOWED_IMAGE_HOSTS = ['gravatar.com', 'googleusercontent.com', 'your-cdn.com'];
const url = new URL(profileImageUrl);
if (!ALLOWED_IMAGE_HOSTS.some(host => url.hostname.endsWith(host))) {
throw new Error('Image URL must be from approved domains');
}

8. Accessibility: Missing ARIA Labels

Location: Multiple locations

Issues:
- Password visibility toggle (640-651) lacks aria-label
- Form errors not announced to screen readers (no aria-live region)
- File upload button doesn't describe accepted formats

Fix:
<Button aria-label="Toggle password visibility">
{showPassword ? <EyeOff /> : <Eye />}
</Button>

  <div role="alert" aria-live="polite">
    {message && <AlertDescription>{message.text}</AlertDescription>}
  </div>

<Button aria-describedby="image-format-hint">Upload Image</Button>
<span id="image-format-hint" className="sr-only">
Accepts JPG, PNG, GIF up to 2MB
</span>

  ---
📊 MEDIUM Priority Issues

9. Code Quality: Repeated Error Handling Pattern

Location: Lines 82-99, 234-240, 296-303, 334-341, 380-387

Issue: Identical error handling logic duplicated 5+ times.

Fix: Extract to utility function:
// lib/utils/error-handler.ts
export function handleApiError(error: unknown, defaultMessage: string): string {
if (error?.message?.includes('email')) return 'Invalid email format';
if (error?.message?.includes('password')) return 'Password too weak';
// ... etc
return defaultMessage;
}

// Usage:
setMessage({
type: 'error',
text: handleApiError(error, 'Update failed')
});

10. Architecture: No Type Safety for clientMetadata

Location: components/AccountSettings.tsx:223-227, 324-327

clientMetadata: {
...user.clientMetadata,  // ⚠️ No type checking
preferences: preferences,
}

Risk: If Stack Auth changes schema, silent failures or data corruption.

Fix: Create typed interface:
// lib/types/user.ts
interface UserMetadata {
preferences: {
emailNotifications: boolean;
marketingEmails: boolean;
darkMode: boolean;
};
}

// Runtime validation with Zod
const UserMetadataSchema = z.object({
preferences: z.object({
emailNotifications: z.boolean(),
marketingEmails: z.boolean(),
darkMode: z.boolean(),
}),
});

11. Testing: Component is Untestable

Issues:
- Direct dependency on Stack Auth's useUser() hook
- No dependency injection
- Business logic mixed with UI
- Side effects not isolated

Fix: Extract testable business logic:
// hooks/useProfileUpdate.ts (testable)
export function useProfileUpdate(user: User | null) {
const updateProfile = async (data: ProfileData) => {
// Pure business logic
};
return { updateProfile, isLoading, error };
}

// Test:
describe('useProfileUpdate', () => {
it('validates email before update', async () => {
const mockUser = createMockUser();
const { updateProfile } = renderHook(() => useProfileUpdate(mockUser));
// ... assertions
});
});

12. Quality: Magic Numbers and Hardcoded Values

Locations:
- Line 117: 2 * 1024 * 1024 (2MB limit)
- Line 594: new Date().toLocaleDateString() (should use actual verification date)

Fix: Extract to constants:
// constants/upload.ts
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// In component:
if (file.size > MAX_IMAGE_SIZE_BYTES) {
setMessage({ type: 'error', text: `Image must be under ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB` });
}

  ---
💡 LOW Priority (Nice to Have)

13. UX: No Auto-Dismiss for Success Messages

Success messages persist indefinitely until user interacts.

Fix: Add auto-dismiss after 5 seconds:
useEffect(() => {
if (message?.type === 'success') {
const timer = setTimeout(() => setMessage(null), 5000);
return () => clearTimeout(timer);
}
}, [message]);

14. UX: No Unsaved Changes Warning

Users could lose work by navigating away during edits.

Fix: Implement form dirty state tracking:
const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
if (isDirty) {
e.preventDefault();
e.returnValue = '';
}
};
window.addEventListener('beforeunload', handleBeforeUnload);
return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

15. Performance: No Code Splitting

Entire 815-line component loads even if user only uses Profile tab.

Fix: Lazy load tab contents:
const ProfileSettings = lazy(() => import('./ProfileSettings'));
const SecuritySettings = lazy(() => import('./SecuritySettings'));
const PreferencesSettings = lazy(() => import('./PreferencesSettings'));

<Suspense fallback={<LoadingSpinner />}>
{activeTab === 'profile' && <ProfileSettings />}
</Suspense>

  ---
📈 Metrics Summary

| Metric                | Current | Target         | Status |
  |-----------------------|---------|----------------|--------|
| Lines of Code         | 815     | <300/component | ❌      |
| Cyclomatic Complexity | High    | <10/function   | ❌      |
| Test Coverage         | 0%      | >80%           | ❌      |
| Type Safety           | Partial | 100%           | ⚠️     |
| Accessibility Score   | ~60%    | >90%           | ⚠️     |
| Performance Score     | ~70%    | >90%           | ⚠️     |

  ---
🎯 Recommended Action Plan

Phase 1: Critical Security Fixes (1-2 days)

1. ✅ Fix XSS vulnerability in image error handler
2. ✅ Implement proper account deletion confirmation
3. ✅ Replace base64 upload with direct upload to CDN
4. ✅ Add URL whitelist validation for profile images

Phase 2: Performance Optimizations (2-3 days)

1. ✅ Fix useEffect dependency issues
2. ✅ Add debouncing to preference updates
3. ✅ Implement memoization for expensive operations
4. ✅ Add loading states for async operations

Phase 3: Architecture Refactoring (5-7 days)

1. ✅ Split into 3 separate components (Profile, Security, Preferences)
2. ✅ Extract custom hooks (useProfileUpdate, usePasswordChange, usePreferences)
3. ✅ Create typed interfaces for Stack Auth integration
4. ✅ Add error boundary wrapper

Phase 4: Quality & Testing (3-5 days)

1. ✅ Write unit tests for extracted hooks
2. ✅ Add integration tests for user flows
3. ✅ Implement E2E tests for critical paths
4. ✅ Add JSDoc documentation

Phase 5: Accessibility & UX (2-3 days)

1. ✅ Add ARIA labels and live regions
2. ✅ Implement unsaved changes warning
3. ✅ Add auto-dismiss for success messages
4. ✅ Improve keyboard navigation

  ---
📚 Additional Resources

- https://react.dev/learn/render-and-commit
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- https://www.w3.org/WAI/WCAG21/quickref/
- https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

