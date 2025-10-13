/**
 * PDF Export Service
 *
 * Generates PDF reports for contract analysis results
 * Uses jsPDF for client-side PDF generation
 */

import { CryptoAudit } from "@/db/schema";
import { HeuristicResult } from "./types";

interface PDFExportData {
  audit: CryptoAudit;
  recommendation?: string;
  heuristicResults?: HeuristicResult[];
}

export class PDFExportService {
  /**
   * Generate PDF report (server-side)
   *
   * Note: This is a placeholder for server-side PDF generation
   * In production, you would use:
   * - Puppeteer for HTML to PDF
   * - jsPDF for canvas-based PDF
   * - PDFKit for Node.js PDF generation
   */
  async generatePDF(data: PDFExportData): Promise<Buffer> {
    // TODO: Implement actual PDF generation
    // For now, throw error to indicate feature not yet implemented

    throw new Error(
      "PDF generation not yet implemented. Use client-side export instead."
    );
  }

  /**
   * Generate PDF metadata for download
   */
  getPDFMetadata(audit: CryptoAudit): {
    filename: string;
    title: string;
    author: string;
  } {
    const date = new Date().toISOString().split("T")[0];
    const shortAddress = `${audit.contractAddress.slice(0, 6)}...${audit.contractAddress.slice(-4)}`;

    return {
      filename: `ContractGuard-${audit.chain}-${shortAddress}-${date}.pdf`,
      title: `Security Analysis Report - ${shortAddress}`,
      author: "ContractGuard AI",
    };
  }

  /**
   * Client-side PDF generation helper
   *
   * Returns HTML structure that can be used with jsPDF or browser print
   * Includes all analysis data: metrics, flags, heuristics, holders, liquidity, metadata
   */
  getHTMLForPDF(data: PDFExportData): string {
    const { audit, recommendation, heuristicResults } = data;
    const auditData = audit as any; // Extended audit with additional properties
    const metadata = auditData.metadata;
    const holderData = auditData.holderData;
    const liquidityData = auditData.liquidityData;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Analysis Report - ${audit.contractAddress}</title>
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 10px;
    }
    .contract-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border: 1px solid #e5e7eb;
    }
    .contract-info p {
      margin: 8px 0;
      font-size: 14px;
    }
    .contract-info code {
      background: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .risk-score {
      text-align: center;
      padding: 40px;
      margin: 30px 0;
      border-radius: 12px;
      background: ${this.getRiskColor(audit.riskScore || 0)};
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .risk-score h2 {
      font-size: 64px;
      margin: 0;
      color: white;
      font-weight: bold;
    }
    .risk-score p {
      color: white;
      margin: 10px 0 0 0;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 2px;
    }
    .confidence-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      color: white;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h3 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .flag {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .flag h4 {
      color: #dc2626;
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .flag p {
      margin: 4px 0;
      color: #7f1d1d;
      font-size: 14px;
    }
    .flag .severity {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 8px;
    }
    .severity-critical { background: #dc2626; color: white; }
    .severity-high { background: #f97316; color: white; }
    .severity-medium { background: #eab308; color: white; }
    .severity-low { background: #84cc16; color: white; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .metric-card h4 {
      font-size: 12px;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .metric-card p {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }
    .heuristic-item {
      background: #f9fafb;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 3px solid #6366f1;
      page-break-inside: avoid;
    }
    .heuristic-item h4 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 15px;
    }
    .heuristic-item p {
      margin: 4px 0;
      font-size: 13px;
      color: #4b5563;
    }
    .heuristic-item .score {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 10px;
    }
    .score-pass { background: #d1fae5; color: #065f46; }
    .score-fail { background: #fee2e2; color: #991b1b; }
    .score-warning { background: #fef3c7; color: #92400e; }
    .holder-list {
      list-style: none;
      padding: 0;
      margin: 15px 0;
    }
    .holder-item {
      background: #f9fafb;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e5e7eb;
    }
    .holder-item code {
      font-family: monospace;
      font-size: 12px;
      background: #fff;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .liquidity-pool {
      background: #eff6ff;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
      page-break-inside: avoid;
    }
    .liquidity-pool h4 {
      margin: 0 0 8px 0;
      color: #1e40af;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 15px 0;
    }
    .metadata-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .metadata-item dt {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .metadata-item dd {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
      margin: 0;
    }
    .summary-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-box h4 {
      margin: 0 0 10px 0;
      color: #1e40af;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 11px;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #1f2937;
      font-size: 13px;
    }
    td {
      font-size: 13px;
      color: #374151;
    }
    .icon { margin-right: 8px; }
    @page {
      margin: 20mm;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo">🛡️ ContractGuard AI</div>
    <h1>Smart Contract Security Analysis Report</h1>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>

  <!-- Contract Information -->
  <div class="contract-info">
    <h3>📋 Contract Information</h3>
    <p><strong>Address:</strong> <code>${audit.contractAddress}</code></p>
    <p><strong>Chain:</strong> ${audit.chain.charAt(0).toUpperCase() + audit.chain.slice(1)}</p>
    <p><strong>Contract Name:</strong> ${metadata?.contractName || auditData.contractName || "N/A"}</p>
    <p><strong>Verified:</strong> ${audit.isVerified ? "✓ Yes" : "✗ No"}</p>
    <p><strong>Compiler:</strong> ${metadata?.compiler || "N/A"}</p>
    <p><strong>Analyzed:</strong> ${new Date(audit.createdAt || "").toLocaleString()}</p>
  </div>

  <!-- Risk Score -->
  <div class="risk-score">
    <h2>${audit.riskScore || 0}/100</h2>
    <p>${audit.riskCategory?.toUpperCase() || "UNKNOWN"} RISK</p>
    ${audit.confidence ? `<div class="confidence-badge">Confidence: ${audit.confidence}%</div>` : ""}
  </div>

  <!-- Executive Summary -->
  ${
    auditData.summary
      ? `
  <div class="summary-box">
    <h4>📊 Executive Summary</h4>
    <p>${auditData.summary}</p>
  </div>
  `
      : ""
  }

  <!-- Recommendation -->
  <div class="section">
    <h3>💡 Recommendation</h3>
    <p style="font-size: 16px; font-weight: 600;">${recommendation || "No recommendation available"}</p>
  </div>

  <!-- Key Metrics Overview -->
  <div class="section">
    <h3>📈 Key Metrics</h3>
    <div class="metrics-grid">
      <div class="metric-card">
        <h4>Risk Score</h4>
        <p>${audit.riskScore || 0}/100</p>
      </div>
      <div class="metric-card">
        <h4>Confidence</h4>
        <p>${audit.confidence || 0}%</p>
      </div>
      <div class="metric-card">
        <h4>Red Flags</h4>
        <p>${audit.flags?.length || 0}</p>
      </div>
      <div class="metric-card">
        <h4>Verification</h4>
        <p>${audit.isVerified ? "✓ Verified" : "✗ Not Verified"}</p>
      </div>
      <div class="metric-card">
        <h4>Holder Count</h4>
        <p>${audit.holderCount?.toLocaleString() || "N/A"}</p>
      </div>
      <div class="metric-card">
        <h4>Top 10 Concentration</h4>
        <p>${audit.topHolderConcentration ? audit.topHolderConcentration + "%" : "N/A"}</p>
      </div>
      <div class="metric-card">
        <h4>Total Liquidity</h4>
        <p>$${Number(audit.liquidityUsd || 0).toLocaleString()}</p>
      </div>
      <div class="metric-card">
        <h4>Liquidity Pools</h4>
        <p>${liquidityData?.poolCount || 0}</p>
      </div>
    </div>
  </div>

  <!-- Red Flags -->
  <div class="section">
    <h3>🚩 Security Red Flags (${audit.flags?.length || 0})</h3>
    ${
      audit.flags && audit.flags.length > 0
        ? audit.flags
            .map(
              (flag: any) => `
        <div class="flag">
          <h4>${flag.title}</h4>
          <p>${flag.description}</p>
          ${flag.evidence ? `<p style="margin-top: 8px;"><strong>Evidence:</strong> ${flag.evidence}</p>` : ""}
          ${flag.severity ? `<span class="severity severity-${flag.severity.toLowerCase()}">${flag.severity.toUpperCase()}</span>` : ""}
          ${flag.impact ? `<p style="margin-top: 8px; font-size: 13px;"><strong>Impact:</strong> ${flag.impact}</p>` : ""}
        </div>
      `
            )
            .join("")
        : '<p style="color: #22c55e; font-weight: 600;">✓ No red flags detected - This is a positive indicator!</p>'
    }
  </div>

  <!-- Heuristic Analysis -->
  ${
    heuristicResults && heuristicResults.length > 0
      ? `
  <div class="section">
    <h3>🔍 Heuristic Analysis (${heuristicResults.length})</h3>
    ${heuristicResults
      .map(
        (heuristic: any) => `
      <div class="heuristic-item">
        <h4>
          <span class="score score-${heuristic.passed ? "pass" : heuristic.severity === "warning" ? "warning" : "fail"}">
            ${heuristic.passed ? "PASS" : heuristic.severity === "warning" ? "WARNING" : "FAIL"}
          </span>
          ${heuristic.name}
        </h4>
        <p><strong>Score:</strong> ${heuristic.score}/100</p>
        <p>${heuristic.description}</p>
        ${heuristic.details ? `<p style="margin-top: 8px; color: #6b7280;"><em>${heuristic.details}</em></p>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Holder Distribution -->
  ${
    holderData?.topHolders && holderData.topHolders.length > 0
      ? `
  <div class="section">
    <h3>👥 Top Holders Distribution</h3>
    <p><strong>Total Holders:</strong> ${holderData.holderCount?.toLocaleString() || "N/A"}</p>
    <p><strong>Top 10 Concentration:</strong> ${holderData.topHolderConcentration || audit.topHolderConcentration || "N/A"}%</p>
    
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Address</th>
          <th>Balance</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${holderData.topHolders
          .slice(0, 10)
          .map(
            (holder: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td><code>${holder.address.slice(0, 8)}...${holder.address.slice(-6)}</code></td>
          <td>${holder.balance}</td>
          <td>${holder.percentage?.toFixed(2) || "0.00"}%</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <!-- Liquidity Analysis -->
  ${
    liquidityData?.liquidityPairs && liquidityData.liquidityPairs.length > 0
      ? `
  <div class="section">
    <h3>💧 Liquidity Analysis</h3>
    <p><strong>Total Liquidity:</strong> $${Number(liquidityData.totalLiquidityUsd || audit.liquidityUsd || 0).toLocaleString()}</p>
    <p><strong>Liquidity Locked:</strong> ${liquidityData.isLocked ? "✓ Yes" : "✗ No"}</p>
    ${liquidityData.lockExpiration ? `<p><strong>Lock Expiration:</strong> ${new Date(liquidityData.lockExpiration).toLocaleDateString()}</p>` : ""}
    
    <h4 style="margin-top: 20px; font-size: 16px;">Liquidity Pools (${liquidityData.liquidityPairs.length})</h4>
    ${liquidityData.liquidityPairs
      .map(
        (pool: any) => `
      <div class="liquidity-pool">
        <h4>${pool.dex || "Unknown DEX"}</h4>
        <p><strong>Pair:</strong> <code>${pool.pair}</code></p>
        <p><strong>Liquidity:</strong> $${Number(pool.liquidityUsd || 0).toLocaleString()}</p>
        ${pool.locked ? '<p style="color: #22c55e; font-weight: 600;">🔒 Locked</p>' : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Contract Metadata -->
  ${
    metadata
      ? `
  <div class="section">
    <h3>⚙️ Contract Metadata</h3>
    <div class="metadata-grid">
      ${metadata.deployer ? `<div class="metadata-item"><dt>Deployer</dt><dd><code>${metadata.deployer.slice(0, 10)}...${metadata.deployer.slice(-8)}</code></dd></div>` : ""}
      ${metadata.deployDate ? `<div class="metadata-item"><dt>Deploy Date</dt><dd>${new Date(metadata.deployDate).toLocaleDateString()}</dd></div>` : ""}
      ${metadata.txCount !== undefined ? `<div class="metadata-item"><dt>Transactions</dt><dd>${metadata.txCount.toLocaleString()}</dd></div>` : ""}
      ${metadata.compiler ? `<div class="metadata-item"><dt>Compiler</dt><dd>${metadata.compiler}</dd></div>` : ""}
      ${metadata.sourceCode ? `<div class="metadata-item"><dt>Source Code</dt><dd>${metadata.sourceCode ? "Available" : "Not Available"}</dd></div>` : ""}
      ${auditData.totalSupply ? `<div class="metadata-item"><dt>Total Supply</dt><dd>${Number(auditData.totalSupply).toLocaleString()}</dd></div>` : ""}
    </div>
    
    ${
      metadata.socialLinks
        ? `
    <h4 style="margin-top: 20px; font-size: 16px;">🔗 Social Links</h4>
    <ul>
      ${metadata.socialLinks.website ? `<li><strong>Website:</strong> ${metadata.socialLinks.website}</li>` : ""}
      ${metadata.socialLinks.twitter ? `<li><strong>Twitter:</strong> ${metadata.socialLinks.twitter}</li>` : ""}
      ${metadata.socialLinks.telegram ? `<li><strong>Telegram:</strong> ${metadata.socialLinks.telegram}</li>` : ""}
      ${metadata.socialLinks.github ? `<li><strong>GitHub:</strong> ${metadata.socialLinks.github}</li>` : ""}
    </ul>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  <!-- Token Economics -->
  ${
    auditData.tokenName || auditData.tokenSymbol
      ? `
  <div class="section">
    <h3>💰 Token Information</h3>
    <div class="metadata-grid">
      ${auditData.tokenName ? `<div class="metadata-item"><dt>Name</dt><dd>${auditData.tokenName}</dd></div>` : ""}
      ${auditData.tokenSymbol ? `<div class="metadata-item"><dt>Symbol</dt><dd>${auditData.tokenSymbol}</dd></div>` : ""}
      ${auditData.decimals !== undefined ? `<div class="metadata-item"><dt>Decimals</dt><dd>${auditData.decimals}</dd></div>` : ""}
      ${auditData.totalSupply ? `<div class="metadata-item"><dt>Total Supply</dt><dd>${Number(auditData.totalSupply).toLocaleString()}</dd></div>` : ""}
    </div>
  </div>
  `
      : ""
  }

  <!-- Analysis Statistics -->
  <div class="section">
    <h3>📊 Analysis Statistics</h3>
    <table>
      <tr>
        <td><strong>Analysis Method</strong></td>
        <td>AI-Powered + Heuristic Pattern Detection</td>
      </tr>
      <tr>
        <td><strong>Heuristics Checked</strong></td>
        <td>${heuristicResults?.length || 0}</td>
      </tr>
      <tr>
        <td><strong>Red Flags Found</strong></td>
        <td style="color: ${audit.flags && audit.flags.length > 0 ? "#dc2626" : "#22c55e"}; font-weight: bold;">
          ${audit.flags?.length || 0}
        </td>
      </tr>
      <tr>
        <td><strong>Analysis Confidence</strong></td>
        <td>${audit.confidence || 0}%</td>
      </tr>
      <tr>
        <td><strong>Report Views</strong></td>
        <td>${audit.views || 0}</td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>⚠️ IMPORTANT DISCLAIMER</strong></p>
    <p>This analysis is provided for educational and informational purposes only.</p>
    <p>This is NOT financial advice. Always conduct your own thorough research (DYOR) before making any investment decisions.</p>
    <p>ContractGuard AI is not responsible for any financial losses incurred based on this report.</p>
    <p style="margin-top: 15px;">Generated by <strong>ContractGuard AI</strong> - Advanced Smart Contract Security Scanner</p>
    <p>© ${new Date().getFullYear()} ContractGuard AI. All rights reserved.</p>
    <p style="margin-top: 10px; font-size: 10px;">Report ID: ${audit.id || "N/A"} | Chain: ${audit.chain} | Version: 2.0</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get background color based on risk score
   */
  private getRiskColor(score: number): string {
    if (score >= 80) return "#dc2626"; // red-600
    if (score >= 60) return "#f97316"; // orange-500
    if (score >= 40) return "#eab308"; // yellow-500
    if (score >= 20) return "#84cc16"; // lime-500
    return "#22c55e"; // green-500
  }
}
