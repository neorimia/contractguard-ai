# PDF Export Guide - ContractGuard AI

**Last Updated**: October 13, 2025  
**Status**: ✅ Comprehensive Export Enabled

---

## 📄 Overview

ContractGuard AI provides **comprehensive PDF export** of all contract analysis results. Users can download professional security reports with all analysis data, metrics, and visualizations.

## 🎯 How to Export

### Step 1: Analyze a Contract

1. Go to `/audit`
2. Select blockchain (Ethereum, BSC, Polygon, etc.)
3. Enter contract address
4. Click "Analyze Contract"

### Step 2: Export PDF

1. After analysis completes, find the **"Export PDF"** button
2. Located in the results header (top-left, under "Results" title)
3. Click to generate PDF

### Step 3: Save PDF

1. Browser print dialog opens automatically
2. Select **"Save as PDF"** from destination
3. Choose location and filename
4. Click "Save"

**Done!** Your comprehensive security report is downloaded.

---

## 📊 What's Included in the PDF

### 1. Header Section 🛡️

- **ContractGuard AI branding**
- Report title: "Smart Contract Security Analysis Report"
- Generation timestamp (date + time)

### 2. Contract Information 📋

- **Contract Address** (full address with code formatting)
- **Blockchain** (Ethereum, BSC, Polygon, etc.)
- **Contract Name** (from verification)
- **Verification Status** (✓ Verified or ✗ Not Verified)
- **Compiler Version** (e.g., v0.8.20)
- **Analysis Timestamp**

### 3. Risk Score Card 🎯

- **Large Risk Score** (0-100 scale)
- **Risk Category** (CRITICAL, HIGH, MEDIUM, LOW, SAFE)
- **Color-coded background**:
  - Red (80-100): Critical
  - Orange (60-79): High
  - Yellow (40-59): Medium
  - Lime (20-39): Low
  - Green (0-19): Safe
- **Confidence Badge** (Analysis confidence %)

### 4. Executive Summary 📊

- AI-generated summary of the analysis
- Key findings overview
- Major concerns highlighted

### 5. Recommendation 💡

- **Clear Action** (BUY / AVOID / CAUTION)
- Explanation of recommendation
- Risk assessment reasoning

### 6. Key Metrics Dashboard 📈

**8 Metric Cards:**

1. **Risk Score** - Overall risk (0-100)
2. **Confidence** - Analysis confidence %
3. **Red Flags** - Number of security issues
4. **Verification** - Contract verification status
5. **Holder Count** - Total token holders
6. **Top 10 Concentration** - Whale concentration %
7. **Total Liquidity** - USD value locked
8. **Liquidity Pools** - Number of DEX pools

### 7. Security Red Flags 🚩

**For each red flag:**

- **Title** - Issue name
- **Description** - Detailed explanation
- **Evidence** - Code snippets or proof
- **Severity Badge** (CRITICAL, HIGH, MEDIUM, LOW)
- **Impact** - Potential consequences

**Example:**

```
🚩 Privileged Mint Function
Severity: CRITICAL

Description: Contract owner can mint unlimited tokens
Evidence: Function "mint()" at line 245 has onlyOwner modifier
Impact: Owner can dilute token value by creating unlimited supply
```

### 8. Heuristic Analysis 🔍

**For each heuristic check:**

- **Status Badge** (PASS / FAIL / WARNING)
- **Heuristic Name** (e.g., "Contract Verification Check")
- **Score** (0-100)
- **Description** - What was checked
- **Details** - Additional findings

**Example Heuristics:**

- Contract Verification
- Mint Function Detection
- Ownership Renouncement
- Transfer Restrictions
- Pause/Freeze Functions
- Holder Concentration
- Liquidity Lock Status
- Token Vesting
- Contract Activity
- Liquidity Pool Activity

### 9. Top Holders Distribution 👥

**Table with top 10 holders:**

- **Rank** (#1-10)
- **Address** (shortened, e.g., 0x742d35...4d8b6)
- **Balance** (token amount)
- **Percentage** (% of total supply)

**Summary:**

- Total holder count
- Top 10 concentration percentage

### 10. Liquidity Analysis 💧

**Overview:**

- **Total Liquidity** (USD value)
- **Liquidity Lock Status** (✓ Yes / ✗ No)
- **Lock Expiration** (if locked)

**For each liquidity pool:**

- **DEX Name** (Uniswap, PancakeSwap, etc.)
- **Pair Address** (pool contract)
- **Liquidity Amount** (USD value)
- **Lock Status** (if individually locked)

### 11. Contract Metadata ⚙️

**Grid layout with:**

- **Deployer Address** (contract creator)
- **Deploy Date** (when deployed)
- **Transaction Count** (contract activity)
- **Compiler Version**
- **Source Code Availability**
- **Total Supply** (if token)

**Social Links:**

- Website
- Twitter
- Telegram
- GitHub

### 12. Token Information 💰

**If token contract:**

- **Name** (e.g., "Wrapped Ether")
- **Symbol** (e.g., "WETH")
- **Decimals** (e.g., 18)
- **Total Supply** (formatted with commas)

### 13. Analysis Statistics 📊

**Table with:**

- **Analysis Method** - AI + Heuristics
- **Heuristics Checked** - Number of checks run
- **Red Flags Found** - Color-coded count
- **Analysis Confidence** - Confidence percentage
- **Report Views** - Popularity metric

### 14. Footer ⚠️

**Legal & Attribution:**

- **Important Disclaimer**
- "Not financial advice" warning
- DYOR (Do Your Own Research) reminder
- Liability limitation
- ContractGuard AI branding
- Copyright notice
- Report metadata (ID, chain, version)

---

## 🎨 PDF Design Features

### Professional Styling

- ✅ Clean, modern layout
- ✅ Color-coded risk indicators
- ✅ Emoji icons for visual appeal
- ✅ Proper spacing and hierarchy
- ✅ Print-optimized formatting

### Page Break Control

- ✅ Sections don't split across pages
- ✅ Red flags stay together
- ✅ Tables maintain integrity
- ✅ Heuristics grouped properly

### Typography

- ✅ Helvetica/Arial font family
- ✅ Monospace for addresses/code
- ✅ Proper heading hierarchy
- ✅ Readable font sizes (11-64px)

### Color Preservation

- ✅ Risk score colors print correctly
- ✅ Severity badges maintain colors
- ✅ Charts and graphs (if added)

---

## 📋 Example PDF Structure

```
╔════════════════════════════════════════╗
║     🛡️ ContractGuard AI                ║
║  Smart Contract Security Analysis      ║
║  Generated: Oct 13, 2025 2:30 PM      ║
╚════════════════════════════════════════╝

📋 Contract Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Address: 0xdac17f958d2ee523a2206206994597c13d831ec7
Chain: Ethereum
Contract Name: TetherToken
Verified: ✓ Yes
Compiler: v0.4.18
Analyzed: Oct 13, 2025, 2:30:15 PM

╔════════════════════════════════════════╗
║           RISK SCORE: 45/100          ║
║            MEDIUM RISK                ║
║         Confidence: 87%               ║
╚════════════════════════════════════════╝

💡 Recommendation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAUTION: Exercise careful judgment before interacting

📈 Key Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌──────────────┬──────────────┐
│ Risk Score   │ Confidence   │
│   45/100     │     87%      │
├──────────────┼──────────────┤
│ Red Flags    │ Verification │
│      3       │  ✓ Verified  │
└──────────────┴──────────────┘
... (8 metrics total)

🚩 Security Red Flags (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[CRITICAL] Privileged Mint Function
Owner can mint unlimited tokens...

🔍 Heuristic Analysis (11)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[PASS] Contract Verification - Score: 100/100
[FAIL] Ownership Renouncement - Score: 0/100
...

👥 Top Holders Distribution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Holders: 5,234,567
Top 10 Concentration: 45.2%

#  | Address      | Balance      | %
1  | 0x742d35...  | 1,234,567    | 15.2%
2  | 0x8a9b2c...  | 987,654      | 12.1%
...

💧 Liquidity Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Liquidity: $2,345,678
Liquidity Locked: ✓ Yes
Lock Expiration: Dec 31, 2025

Liquidity Pools (3)
• Uniswap V3
  Pair: 0xabc123...
  Liquidity: $1,234,567
  🔒 Locked

⚙️ Contract Metadata
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deployer: 0x36928500...
Deploy Date: Nov 28, 2017
Transactions: 125,432
...

💰 Token Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: Tether USD
Symbol: USDT
Decimals: 6
Total Supply: 100,000,000,000

📊 Analysis Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analysis Method: AI + Heuristics
Heuristics Checked: 11
Red Flags Found: 3
Confidence: 87%
Report Views: 142

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DISCLAIMER
This is NOT financial advice. DYOR.
© 2025 ContractGuard AI
Report ID: 12345 | Chain: ethereum | v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Technical Details

### Export Method

**Browser Print-to-PDF** (No server-side rendering)

**Process:**

1. Generate formatted HTML with inline CSS
2. Open HTML in new browser window
3. Trigger browser's print dialog
4. User saves as PDF from print options

### Benefits

- ✅ No server costs (client-side only)
- ✅ No external dependencies
- ✅ Works on all modern browsers
- ✅ User controls print settings
- ✅ Instant generation

### Filename Format

```
ContractGuard-{chain}-{shortAddress}-{date}.pdf

Examples:
ContractGuard-ethereum-0xdac1...ec7-2025-10-13.pdf
ContractGuard-bsc-0x55d3...955-2025-10-13.pdf
ContractGuard-solana-Token...Q5DA-2025-10-13.pdf
```

---

## 🎨 Styling Features

### Color Coding

- **Risk Scores**: Red → Orange → Yellow → Lime → Green
- **Severity Badges**: Color-coded by severity level
- **Status Indicators**: Green for pass, red for fail
- **Section Headers**: Blue accent color

### Layout

- **Max Width**: 800px for readability
- **Margins**: 20mm on all sides
- **Grid Layouts**: 2-column metric cards
- **Tables**: Striped rows with borders
- **Cards**: Rounded corners, subtle shadows

### Print Optimization

- **Page Breaks**: Sections avoid splitting
- **Color Accuracy**: `print-color-adjust: exact`
- **Font Sizes**: Print-friendly sizing
- **Margins**: Proper spacing for printing

---

## 💡 Usage Tips

### For Users

1. **Save as PDF**: Choose "Save as PDF" in print dialog
2. **Custom Print**: Adjust margins/headers if needed
3. **Background Graphics**: Enable for colors
4. **Share Report**: Send PDF to team/investors

### For Pro Users

- **Batch Exports**: Analyze multiple contracts
- **Comparison**: Export multiple PDFs to compare
- **Archive**: Keep historical audit records
- **Due Diligence**: Professional reports for investments

---

## 🚀 Features

### Comprehensive Data

- ✅ All analysis metrics included
- ✅ Complete heuristic results
- ✅ Full holder distribution
- ✅ Detailed liquidity analysis
- ✅ Contract metadata
- ✅ Token economics
- ✅ Social links

### Professional Format

- ✅ Clean, organized layout
- ✅ Color-coded indicators
- ✅ Emoji icons for clarity
- ✅ Tables for data
- ✅ Proper headings
- ✅ Legal disclaimers

### Print-Optimized

- ✅ Proper page breaks
- ✅ Print-safe colors
- ✅ Readable fonts
- ✅ Optimal margins
- ✅ Professional footer

---

## 📖 Example Use Cases

### 1. Investment Research

**Scenario:** Evaluating a new token before investing

**Process:**

1. Analyze contract
2. Review all sections
3. Export PDF
4. Share with investment team
5. Make informed decision

### 2. Portfolio Audit

**Scenario:** Reviewing existing holdings

**Process:**

1. Analyze all portfolio contracts
2. Export PDFs for each
3. Compare risk scores
4. Identify high-risk holdings
5. Rebalance portfolio

### 3. Team Collaboration

**Scenario:** Discussing potential investment with partners

**Process:**

1. Analyze contract
2. Export professional PDF
3. Email to team members
4. Review together
5. Make group decision

### 4. Record Keeping

**Scenario:** Maintaining investment audit trail

**Process:**

1. Export PDF after each analysis
2. Save in organized folders
3. Date-stamped for reference
4. Build historical records
5. Track due diligence

---

## 🔒 Privacy & Security

### Client-Side Generation

- ✅ No data sent to server
- ✅ Report generated in browser
- ✅ User controls the output
- ✅ No external tracking

### Data Included

- ✅ Only public blockchain data
- ✅ No personal information
- ✅ No sensitive data
- ✅ Transparent disclaimers

---

## 🐛 Troubleshooting

### "Popup Blocked" Error

**Problem:** Browser blocks popup window

**Solution:**

1. Allow popups for ContractGuard AI
2. Look for popup indicator in address bar
3. Click "Always allow"
4. Try export again

### PDF Looks Wrong

**Problem:** Colors not showing in PDF

**Solution:**

1. In print dialog, click "More settings"
2. Enable "Background graphics"
3. Check "Headers and footers" (optional)
4. Print/Save again

### Missing Data

**Problem:** Some sections are empty in PDF

**Reason:** Data not available for that contract

- Unverified contracts have limited data
- Some chains lack holder/liquidity data
- Not all features available on all chains

**This is normal!** PDF includes all available data.

---

## 🚀 Future Enhancements

### Planned

- [ ] Custom branding options (Pro users)
- [ ] Chart/graph visualizations in PDF
- [ ] Multi-language support
- [ ] Custom report templates
- [ ] Batch export (multiple contracts)

### Possible

- [ ] Email delivery option
- [ ] Cloud storage integration
- [ ] Report comparison tool
- [ ] Historical tracking

---

## 📚 Related Features

### ShareOnX Button

- Quick social sharing
- Pre-formatted tweet
- Risk score highlight
- Drive traffic back

### Comparison View

- Compare multiple contracts
- Side-by-side analysis
- Export comparison PDF

---

## ✅ Summary

The PDF export feature provides:

1. **Comprehensive Data** - All analysis information
2. **Professional Format** - Ready for presentations
3. **Easy to Use** - One-click export
4. **Free Feature** - No Pro tier required
5. **Privacy-Focused** - Client-side generation
6. **Print-Optimized** - Beautiful output

**Location:** Export PDF button appears in results header after every contract analysis.

**Cost:** Free for all users (no server costs!)

---

**Last Updated:** October 13, 2025  
**Version:** 2.0 (Comprehensive Export)  
**Status:** ✅ Production Ready
