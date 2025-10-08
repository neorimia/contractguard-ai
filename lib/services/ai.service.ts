// lib/services/ai.service.ts
import { Issue } from "@/db/schema";

interface AnalysisResult {
  riskScore: number;
  summary: string;
  issues: Issue[];
  recommendation: "BUY" | "CAUTION" | "AVOID";
  confidence: number;
}

export class AIAnalysisService {
  private apiKey: string;
  private provider: "openai" | "claude";

  constructor() {
    // Prefer OpenAI over Claude for better compatibility
    if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.provider = "openai";
    } else if (process.env.CLAUDE_API_KEY) {
      this.apiKey = process.env.CLAUDE_API_KEY;
      this.provider = "claude";
    } else {
      throw new Error(
        "No AI API key configured. Please add OPENAI_API_KEY or CLAUDE_API_KEY to .env.local"
      );
    }
  }

  async analyzeContract(
    sourceCode: string,
    contractName: string,
    enrichmentData?: any
  ): Promise<AnalysisResult> {
    // Check if API key is configured
    if (!this.apiKey || this.apiKey === "undefined") {
      throw new Error(
        "AI API key is not configured. Please add OPENAI_API_KEY or CLAUDE_API_KEY to .env.local"
      );
    }

    const prompt = this.buildAnalysisPrompt(
      sourceCode,
      contractName,
      enrichmentData
    );

    try {
      if (this.provider === "openai") {
        return await this.analyzeWithOpenAI(prompt);
      } else {
        return await this.analyzeWithClaude(prompt);
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      throw new Error(
        `Failed to analyze contract: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private async analyzeWithOpenAI(prompt: string): Promise<AnalysisResult> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    // Log the response for debugging
    console.log("OpenAI API Response:", JSON.stringify(data, null, 2));

    // Check if the API returned an error
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      throw new Error(
        `OpenAI API Error: ${data.error.message || JSON.stringify(data.error)}`
      );
    }

    // Check if we have the expected response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Invalid response from OpenAI API");
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    return this.parseAnalysis(analysis);
  }

  private async analyzeWithClaude(prompt: string): Promise<AnalysisResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        temperature: 0.3,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: "user",
            content:
              prompt +
              "\n\nProvide ONLY valid JSON in your response, no additional text.",
          },
        ],
      }),
    });

    const data = await response.json();

    // Log the response for debugging
    console.log("Claude API Response:", JSON.stringify(data, null, 2));

    // Check if the API returned an error
    if (data.error) {
      console.error("Claude API Error:", data.error);
      throw new Error(
        `Claude API Error: ${data.error.message || JSON.stringify(data.error)}`
      );
    }

    // Check if we have the expected response structure
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Invalid response from Claude API");
    }

    const analysis = JSON.parse(data.content[0].text);
    return this.parseAnalysis(analysis);
  }

  private getSystemPrompt(): string {
    return `You are an expert Solidity smart contract security auditor. Analyze contracts for:

1. CRITICAL ISSUES:
   - Honeypot mechanisms (restricted selling)
   - Hidden mint functions
   - Blacklist capabilities
   - Ownership risks
   - Proxy vulnerabilities
   
2. HIGH SEVERITY:
   - Excessive taxes (>20%)
   - Centralization risks
   - Reentrancy vulnerabilities
   - Integer overflow/underflow
   
3. MEDIUM SEVERITY:
   - Missing access controls
   - Unoptimized gas usage
   - Potential front-running
   
4. POSITIVE INDICATORS:
   - Renounced ownership
   - Locked liquidity
   - Time-locked functions
   - Verified source code

Respond ONLY with valid JSON in this exact format:
{
  "riskScore": 0-100,
  "summary": "2-3 sentence plain English summary",
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "type": "Issue type",
      "description": "Clear explanation",
      "impact": "What this means for users",
      "code": "Optional: problematic code snippet"
    }
  ],
  "recommendation": "BUY|CAUTION|AVOID",
  "confidence": 0-100,
  "reasoning": "Why this recommendation"
}`;
  }

  private buildAnalysisPrompt(
    sourceCode: string,
    contractName: string,
    enrichmentData?: any
  ): string {
    return `Analyze this smart contract for security issues:

CONTRACT NAME: ${contractName}

${
  enrichmentData
    ? `
ADDITIONAL DATA:
- Holder Count: ${enrichmentData.holderCount}
- Liquidity: ${enrichmentData.liquidity}
- Owner Balance: ${enrichmentData.ownerBalance}
`
    : ""
}

SOURCE CODE:
\`\`\`solidity
${sourceCode.slice(0, 15000)} // Truncate for token limits
\`\`\`

Provide a comprehensive security analysis in JSON format.`;
  }

  private parseAnalysis(analysis: any): AnalysisResult {
    return {
      riskScore: Math.min(100, Math.max(0, analysis.riskScore)),
      summary: analysis.summary,
      issues: analysis.issues.map((issue: any) => ({
        severity: issue.severity,
        type: issue.type,
        description: issue.description,
        impact: issue.impact,
        code: issue.code,
      })),
      recommendation: analysis.recommendation,
      confidence: analysis.confidence || 85,
    };
  }

  // Pattern-based detection (backup/supplement to AI)
  detectKnownPatterns(sourceCode: string): Issue[] {
    const patterns: Issue[] = [];

    // Honeypot detection
    if (
      sourceCode.includes("require(msg.sender == owner") &&
      sourceCode.includes("transfer(")
    ) {
      patterns.push({
        severity: "CRITICAL",
        type: "Honeypot Detected",
        description: "Only owner can execute transfers",
        impact: "Users can buy but cannot sell tokens",
      });
    }

    // Hidden mint
    if (sourceCode.match(/_mint\([^)]*owner/i)) {
      patterns.push({
        severity: "CRITICAL",
        type: "Unlimited Minting",
        description: "Owner can mint unlimited tokens",
        impact: "Token supply can be inflated at any time",
      });
    }

    // Blacklist
    if (
      sourceCode.includes("mapping") &&
      sourceCode.match(/blacklist|blocked/i)
    ) {
      patterns.push({
        severity: "HIGH",
        type: "Blacklist Function",
        description: "Contract can blacklist addresses",
        impact: "Your address could be blocked from trading",
      });
    }

    // High tax
    const taxMatch = sourceCode.match(/tax.*=.*(\d+)/i);
    if (taxMatch && parseInt(taxMatch[1]) > 20) {
      patterns.push({
        severity: "HIGH",
        type: "Excessive Tax",
        description: `Tax rate appears to be ${taxMatch[1]}%`,
        impact: "High fees will reduce your profits significantly",
      });
    }

    return patterns;
  }
}
