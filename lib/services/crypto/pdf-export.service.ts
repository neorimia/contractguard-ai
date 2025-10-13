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
   */
  getHTMLForPDF(data: PDFExportData): string {
    const { audit, recommendation, heuristicResults } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Analysis Report</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 10px;
    }
    .contract-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .risk-score {
      text-align: center;
      padding: 30px;
      margin: 30px 0;
      border-radius: 12px;
      background: ${this.getRiskColor(audit.riskScore || 0)};
    }
    .risk-score h2 {
      font-size: 48px;
      margin: 0;
      color: white;
    }
    .section {
      margin: 30px 0;
    }
    .section h3 {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .flag {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .flag h4 {
      color: #dc2626;
      margin: 0 0 8px 0;
    }
    .flag p {
      margin: 0;
      color: #7f1d1d;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ ContractGuard AI</div>
    <h1>Smart Contract Security Analysis</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="contract-info">
    <h3>Contract Information</h3>
    <p><strong>Address:</strong> <code>${audit.contractAddress}</code></p>
    <p><strong>Chain:</strong> ${audit.chain}</p>
    <p><strong>Verified:</strong> ${audit.isVerified ? "✓ Yes" : "✗ No"}</p>
    <p><strong>Analyzed:</strong> ${new Date(audit.createdAt || "").toLocaleString()}</p>
  </div>

  <div class="risk-score">
    <h2>${audit.riskScore || 0}/100</h2>
    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">
      ${audit.riskCategory?.toUpperCase() || "UNKNOWN"} RISK
    </p>
  </div>

  <div class="section">
    <h3>Recommendation</h3>
    <p>${recommendation || "No recommendation available"}</p>
  </div>

  <div class="section">
    <h3>Red Flags (${audit.flags?.length || 0})</h3>
    ${
      audit.flags && audit.flags.length > 0
        ? audit.flags
            .map(
              (flag: any) => `
        <div class="flag">
          <h4>${flag.title}</h4>
          <p>${flag.description}</p>
          <p style="margin-top: 8px;"><strong>Evidence:</strong> ${flag.evidence}</p>
        </div>
      `
            )
            .join("")
        : "<p>No red flags detected</p>"
    }
  </div>

  <div class="section">
    <h3>Token Metrics</h3>
    <ul>
      <li><strong>Holder Count:</strong> ${audit.holderCount?.toLocaleString() || "N/A"}</li>
      <li><strong>Top 10 Concentration:</strong> ${audit.topHolderConcentration || "N/A"}%</li>
      <li><strong>Liquidity:</strong> $${Number(audit.liquidityUsd || 0).toLocaleString()}</li>
    </ul>
  </div>

  <div class="footer">
    <p><strong>Disclaimer:</strong> This analysis is for educational purposes only. Not financial advice.</p>
    <p>Always do your own research before investing in any cryptocurrency.</p>
    <p>© ${new Date().getFullYear()} ContractGuard AI. All rights reserved.</p>
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
