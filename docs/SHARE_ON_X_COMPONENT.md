# ShareOnX Component

## Overview

A beautiful Twitter/X-style card component for sharing contract scan results on X (formerly Twitter). Styled with the glassmorphism design pattern from the TweetCard template.

## Component Details

**File**: `components/ShareOnX.tsx`

### Features

- 🐦 **Twitter/X Integration** - Direct share to Twitter with pre-formatted tweet text
- 🎨 **TweetCard Design** - Glassmorphism effects, backdrop blur, and premium styling
- 📊 **Scan Data Display** - Shows risk score, recommendation, and contract address
- ✨ **Hover Effects** - Smooth scale animation on hover
- 🔗 **Direct Link** - Opens Twitter intent with pre-filled tweet content

### Props

```typescript
interface ShareOnXProps {
  result: Audit; // The audit/scan result object
  contractAddress?: string; // Optional contract address to display
}
```

### Tweet Content

The component automatically generates tweet text including:

- Risk emoji (🚫/⚠️/✅ based on risk score)
- Risk score (0-100)
- Recommendation (AVOID/CAUTION/BUY)
- Summary snippet (first 120 characters)
- Call-to-action to scan contracts

### Design System

**Colors & Effects**:

- Glassmorphism with backdrop blur
- Black/white adaptive theming
- Gradient overlays for depth
- Border highlights on hover

**Layout**:

- Profile avatar (shield emoji with gradient background)
- Verified badge
- X/Twitter logo button
- Truncated contract address
- Interactive "Click to share" prompt

### Usage

```tsx
import ShareOnX from "@/components/ShareOnX";

// In your component
<ShareOnX
  result={auditResult}
  contractAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
/>;
```

### Integration

The component is integrated into `ScanResults.tsx`:

- Replaced the generic share button
- Positioned in the header section
- Shows alongside the "Results" title

### Twitter Intent URL

The component uses Twitter's Web Intent API:

```
https://twitter.com/intent/tweet?text={encodedText}&url={siteUrl}
```

This opens a new Twitter compose window with:

- Pre-filled tweet text
- Your site URL appended
- User can edit before posting

### Visual States

**Default State**:

- Clean card with subtle shadows
- ContractGuard AI branding
- Scan summary visible

**Hover State**:

- Scales up slightly (1.02x)
- Smooth transition
- Enhanced shadow

### Responsive Design

- Minimum width: 300px
- Maximum width: 28rem (448px)
- Works on mobile and desktop
- Truncates long addresses

### Accessibility

- Semantic HTML with proper links
- SVG titles for screen readers
- Clear call-to-action text
- External link indicators

## Example Tweet Output

```
I just scanned a smart contract with ContractGuard AI!

✅ Risk Score: 25/100
✅ Recommendation: BUY

This contract appears to be legitimate with standard functionality...

Scan your contracts at https://contractguard.ai
```

## Customization Options

You can customize:

- Brand name and handle
- Avatar/logo
- Color scheme
- Tweet text format
- Call-to-action message

## Notes

- Opens in new tab (`target="_blank"`)
- Includes `rel="noopener noreferrer"` for security
- Uses URL encoding for special characters
- Fully TypeScript typed
- No external dependencies beyond lucide-react

## Future Enhancements

Potential additions:

- Share on LinkedIn
- Share on Reddit
- Copy share text to clipboard
- Generate share image
- Track share analytics
