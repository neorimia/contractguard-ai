// app/page.tsx
'use client';

import { useState } from 'react';
import { Audit, Issue } from '@/db/schema';

export default function AuditPage() {
const [address, setAddress] = useState('');
const [loading, setLoading] = useState(false);
const [result, setResult] = useState<Audit | null>(null);
const [error, setError] = useState('');

const analyzeContract = async () => {
if (!address) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractAddress: address,
          chain: 'ethereum' 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
};

return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
{/* Header */}
<header className="border-b border-white/10 bg-black/20 backdrop-blur">
<div className="container mx-auto px-4 py-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-bold text-white flex items-center gap-2">
🛡️ ContractGuard AI
</h1>
<button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
Upgrade to Pro
</button>
</div>
</div>
</header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Know Before You Buy
          </h2>
          <p className="text-xl text-gray-300">
            AI-powered smart contract analysis. Detect scams, honeypots, and rug pulls in seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contract Address
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                onClick={analyzeContract}
                disabled={loading || !address}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && <ResultsDisplay result={result} />}
      </div>
    </div>
);
}

// Results Component
function ResultsDisplay({ result }: { result: Audit }) {
const getRiskColor = (score: number) => {
if (score >= 70) return 'from-red-500 to-red-600';
if (score >= 40) return 'from-yellow-500 to-orange-500';
return 'from-green-500 to-emerald-500';
};

const getRiskLabel = (score: number) => {
if (score >= 70) return 'HIGH RISK';
if (score >= 40) return 'MEDIUM RISK';
return 'LOW RISK';
};

const criticalIssues = (result.issues as Issue[])?.filter(i => i.severity === 'CRITICAL') || [];
const highIssues = (result.issues as Issue[])?.filter(i => i.severity === 'HIGH') || [];
const mediumIssues = (result.issues as Issue[])?.filter(i => i.severity === 'MEDIUM') || [];

return (
<div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
{/* Risk Score Card */}
<div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
<div className="flex items-center justify-between mb-6">
<h3 className="text-2xl font-bold text-white">Security Analysis</h3>
<button
onClick={() => navigator.share?.({
title: 'Contract Analysis',
text: result.summary || ''
})}
className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm"
>
📤 Share
</button>
</div>

     <div className="grid md:grid-cols-2 gap-6">
          {/* Risk Score */}
          <div className="text-center p-6 bg-black/30 rounded-xl">
            <div className={`text-6xl font-bold bg-gradient-to-r ${getRiskColor(result.riskScore || 0)} bg-clip-text text-transparent mb-2`}>
              {result.riskScore}
            </div>
            <div className="text-gray-300 font-medium">
              {getRiskLabel(result.riskScore || 0)}
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex flex-col justify-center p-6 bg-black/30 rounded-xl">
            <div className="text-3xl mb-2">
              {result.recommendation === 'AVOID' && '🚫'}
              {result.recommendation === 'CAUTION' && '⚠️'}
              {result.recommendation === 'BUY' && '✅'}
            </div>
            <div className="text-2xl font-bold text-white">
              {result.recommendation}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-black/30 rounded-xl">
          <p className="text-gray-200 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Issues */}
      {criticalIssues.length > 0 && (
        <IssuesSection title="🔴 Critical Issues" issues={criticalIssues} color="red" />
      )}
      
      {highIssues.length > 0 && (
        <IssuesSection title="🟠 High Severity" issues={highIssues} color="orange" />
      )}
      
      {mediumIssues.length > 0 && (
        <IssuesSection title="🟡 Medium Severity" issues={mediumIssues} color="yellow" />
      )}

      {/* Contract Info */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Contract Details</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Holders</div>
            <div className="text-white font-medium">{result.holderCount || 'N/A'}</div>
          </div>
          <div>
            <div className="text-gray-400">Liquidity</div>
            <div className="text-white font-medium">{result.liquidity || 'N/A'}</div>
          </div>
          <div>
            <div className="text-gray-400">Verified</div>
            <div className="text-white font-medium">{result.isVerified ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
      </div>
    </div>
);
}

// Issues Section Component
function IssuesSection({
title,
issues,
color
}: {
title: string;
issues: Issue[];
color: 'red' | 'orange' | 'yellow'
}) {
const colorClasses = {
red: 'bg-red-500/20 border-red-500/50',
orange: 'bg-orange-500/20 border-orange-500/50',
yellow: 'bg-yellow-500/20 border-yellow-500/50',
};

return (
<div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
<h3 className="text-xl font-bold text-white mb-4">{title}</h3>
<div className="space-y-3">
{issues.map((issue, idx) => (
<div
key={idx}
className={`p-4 rounded-lg border ${colorClasses[color]}`}
>
<div className="flex items-start justify-between mb-2">
<h4 className="font-semibold text-white">{issue.type}</h4>
<span className="text-xs px-2 py-1 bg-black/30 rounded text-gray-300">
{issue.severity}
</span>
</div>
<p className="text-gray-300 text-sm mb-2">{issue.description}</p>
<p className="text-gray-400 text-sm italic">
💡 Impact: {issue.impact}
</p>
{issue.code && (
<pre className="mt-3 p-3 bg-black/50 rounded text-xs text-gray-300 overflow-x-auto">
{issue.code}
</pre>
)}
</div>
))}
</div>
</div>
);
}
