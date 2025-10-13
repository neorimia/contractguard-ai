# Moralis Integration - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Get Your Moralis API Key

1. Go to: https://admin.moralis.io/web3apis
2. Create account (if new)
3. Click "**Get your API Key**"
4. Copy your API key

### Step 2: Add to Environment

```bash
# .env.local
MORALIS_API_KEY=your_moralis_api_key_here
```

### Step 3: Test It

```bash
npm run test:moralis
```

**Expected Output**:

```
✅ Success!
   Total holders: 125,430
   Returned: 100 holders

   Top 3 holders:
   1. 0x28c6c06298d514db089934071355e5743bf21d60
      Balance: 50000000000000000000000
      Percentage: 5.2341%
```

### Step 4: Run Your App

```bash
npm run dev
```

Scan any contract - you'll now see **Holder Distribution** charts! 📊

---

## 🎯 What You Get

### Before Moralis

```
Holder Distribution: ❌ Data not available
```

### After Moralis

```
Holder Distribution: ✅ 125,430 holders
├─ Top 10 Concentration: 22.45%
├─ Pie Chart (visual breakdown)
├─ Bar Chart (individual percentages)
└─ Detailed list (top 10 addresses)
```

---

## 🔧 Troubleshooting

### "Holder distribution data not available"

**Check 1**: Is the API key set?

```bash
echo $MORALIS_API_KEY
```

**Check 2**: Restart dev server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Check 3**: Check browser console

```
[Moralis] Fetched X total holders...  ← Should see this
```

---

## 💡 Pro Tips

### Alchemy Enrichment (Optional)

Add for token name/symbol enrichment:

```bash
ALCHEMY_API_KEY=your_alchemy_key_here
```

Get from: https://alchemy.com

**Console Output**:

```
[Moralis] Fetched 125430 total holders for 0xb8c7...
[Alchemy] Enriched with metadata: BNB (BNB)  ← Token name/symbol
```

### Free Tier Limits

- **40,000 requests/month** = 1,333/day
- **With 85% cache hit rate**: 8,886 scans/day
- **More than enough for MVP!**

---

## 📊 What Data You'll See

### Holder Distribution Chart

![Holder Chart](https://via.placeholder.com/800x400/1f2937/22d3ee?text=Pie+%26+Bar+Charts)

1. **Total Holders**: 125,430 wallets
2. **Top 10 Concentration**: 22.45% (low risk)
3. **Individual Breakdown**: Each holder's %
4. **Visual Charts**: Pie + bar charts

### Risk Analysis

```
Top 10 Concentration:
├─ 0-30%   → ✅ LOW RISK (decentralized)
├─ 30-50%  → ⚠️ MEDIUM RISK
├─ 50-75%  → 🔴 HIGH RISK
└─ 75-100% → 🚨 CRITICAL RISK (centralized)
```

---

## ✅ Success Checklist

- [ ] Moralis API key added to `.env.local`
- [ ] Test script passes (`npm run test:moralis`)
- [ ] Dev server restarted
- [ ] Scanned a contract (e.g., BNB token)
- [ ] See "Holder Distribution" section in results
- [ ] Charts display properly
- [ ] (Optional) Alchemy key added for enrichment

---

**Need Help?** Check `/MORALIS_INTEGRATION_COMPLETE.md` for full documentation.

**Ready to Deploy?** Add keys to Vercel environment variables!
