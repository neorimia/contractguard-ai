// lib/services/ai.service.ts
import { Issue } from "@/db/schema";
import { ErrorFactory } from "@/lib/utils/error-handler";

interface AnalysisResult {
  riskScore: number;
  summary: string;
  issues: Issue[];
  recommendation: "BUY" | "CAUTION" | "AVOID";
  confidence: number;
}

interface AIProviderConfig {
  name: "openai" | "claude";
  apiKey: string;
}

export class AIAnalysisService {
  private providers: AIProviderConfig[] = [];
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 2;

  constructor() {
    // Configure available AI providers in order of preference
    if (
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== "undefined"
    ) {
      this.providers.push({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (
      process.env.CLAUDE_API_KEY &&
      process.env.CLAUDE_API_KEY !== "undefined"
    ) {
      this.providers.push({
        name: "claude",
        apiKey: process.env.CLAUDE_API_KEY,
      });
    }

    if (this.providers.length === 0) {
      throw ErrorFactory.apiKeyMissing("OpenAI or Claude");
    }

    console.log(
      `AI Service initialized with providers: ${this.providers.map((p) => p.name).join(", ")}`
    );
  }

  /**
   * Get available providers for frontend display
   */
  getAvailableProviders(): Array<{ name: string; displayName: string }> {
    return this.providers.map((provider) => ({
      name: provider.name === "openai" ? "chatgpt" : provider.name,
      displayName: provider.name === "openai" ? "ChatGPT" : "Claude",
    }));
  }

  async analyzeContract(
    sourceCode: string,
    contractName: string,
    enrichmentData?: any,
    preferredProvider?: "chatgpt" | "claude"
  ): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(
      sourceCode,
      contractName,
      enrichmentData
    );

    // Map frontend provider names to internal provider names
    const providerMap: { [key: string]: "openai" | "claude" } = {
      chatgpt: "openai",
      claude: "claude",
    };

    // Reorder providers based on preference
    let orderedProviders = [...this.providers];
    if (preferredProvider && providerMap[preferredProvider]) {
      const preferredName = providerMap[preferredProvider];
      const preferred = this.providers.find((p) => p.name === preferredName);
      const others = this.providers.filter((p) => p.name !== preferredName);

      if (preferred) {
        orderedProviders = [preferred, ...others];
        console.log(
          `Using preferred AI provider: ${preferredProvider} (${preferredName})`
        );
      } else {
        console.warn(
          `Preferred provider ${preferredProvider} not available, using default order`
        );
      }
    } else if (preferredProvider) {
      console.warn(
        `Unknown provider preference: ${preferredProvider}, using default order`
      );
    }

    // Try each provider in order with fallback
    let lastError: Error | null = null;

    for (const provider of orderedProviders) {
      try {
        console.log(`Attempting analysis with ${provider.name}...`);

        const result = await this.analyzeWithProvider(provider, prompt);

        // Success! Return the result
        console.log(`✓ Analysis successful with ${provider.name}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `✗ ${provider.name} failed:`,
          error instanceof Error ? error.message : error
        );

        // Continue to next provider if available
        if (provider !== orderedProviders[orderedProviders.length - 1]) {
          console.log(`Falling back to next provider...`);
          continue;
        }
      }
    }

    // All providers failed - fall back to pattern-based analysis
    console.error("All AI providers failed, using pattern-based analysis");
    return this.fallbackAnalysis(sourceCode, lastError);
  }

  private async analyzeWithProvider(
    provider: AIProviderConfig,
    prompt: string
  ): Promise<AnalysisResult> {
    // Add timeout wrapper
    const analysisPromise =
      provider.name === "openai"
        ? this.analyzeWithOpenAI(prompt, provider.apiKey)
        : this.analyzeWithClaude(prompt, provider.apiKey);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(ErrorFactory.aiServiceTimeout(provider.name));
      }, this.REQUEST_TIMEOUT);
    });

    return Promise.race([analysisPromise, timeoutPromise]);
  }

  private async analyzeWithOpenAI(
    prompt: string,
    apiKey: string
  ): Promise<AnalysisResult> {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          `OpenAI API error (${response.status}): ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();

      // Check if the API returned an error
      if (data.error) {
        throw new Error(
          `OpenAI API Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      }

      // Check if we have the expected response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response structure from OpenAI API");
      }

      // Parse JSON response with error handling
      let analysis;
      try {
        analysis = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        console.error(
          "Failed to parse OpenAI response:",
          data.choices[0].message.content
        );
        throw new Error("Failed to parse AI response as JSON");
      }

      return this.parseAnalysis(analysis);
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`OpenAI analysis failed: ${String(error)}`);
    }
  }

  private async analyzeWithClaude(
    prompt: string,
    apiKey: string
  ): Promise<AnalysisResult> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-7-sonnet-20250219",
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

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          `Claude API error (${response.status}): ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();

      // Check if the API returned an error
      if (data.error) {
        throw new Error(
          `Claude API Error: ${data.error.message || JSON.stringify(data.error)}`
        );
      }

      // Check if we have the expected response structure
      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response structure from Claude API");
      }

      // Parse JSON response with error handling
      let analysis;
      try {
        analysis = JSON.parse(data.content[0].text);
      } catch (parseError) {
        console.error("Failed to parse Claude response:", data.content[0].text);
        throw new Error("Failed to parse AI response as JSON");
      }

      return this.parseAnalysis(analysis);
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Claude analysis failed: ${String(error)}`);
    }
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
    // Validate required fields
    if (typeof analysis.riskScore !== "number") {
      throw new Error("Invalid analysis: missing or invalid riskScore");
    }
    if (!analysis.summary || typeof analysis.summary !== "string") {
      throw new Error("Invalid analysis: missing or invalid summary");
    }
    if (!Array.isArray(analysis.issues)) {
      throw new Error("Invalid analysis: issues must be an array");
    }
    if (!["BUY", "CAUTION", "AVOID"].includes(analysis.recommendation)) {
      throw new Error("Invalid analysis: invalid recommendation");
    }

    return {
      riskScore: Math.min(100, Math.max(0, analysis.riskScore)),
      summary: analysis.summary,
      issues: analysis.issues.map((issue: any) => ({
        severity: issue.severity || "MEDIUM",
        type: issue.type || "Unknown",
        description: issue.description || "No description provided",
        impact: issue.impact || "Unknown impact",
        code: issue.code,
      })),
      recommendation: analysis.recommendation,
      confidence: Math.min(100, Math.max(0, analysis.confidence || 85)),
    };
  }

  /**
   * Fallback analysis using only pattern detection when AI fails
   */
  private fallbackAnalysis(
    sourceCode: string,
    aiError: Error | null
  ): AnalysisResult {
    console.warn("Using fallback pattern-based analysis");

    const patternIssues = this.detectKnownPatterns(sourceCode);

    // Calculate risk score based on detected patterns
    let riskScore = 30; // Base risk for unverified AI analysis
    patternIssues.forEach((issue) => {
      if (issue.severity === "CRITICAL") riskScore += 25;
      else if (issue.severity === "HIGH") riskScore += 15;
      else if (issue.severity === "MEDIUM") riskScore += 10;
    });
    riskScore = Math.min(100, riskScore);

    // Determine recommendation
    let recommendation: "BUY" | "CAUTION" | "AVOID" = "CAUTION";
    if (
      riskScore >= 70 ||
      patternIssues.some((i) => i.severity === "CRITICAL")
    ) {
      recommendation = "AVOID";
    } else if (riskScore <= 40 && patternIssues.length === 0) {
      recommendation = "CAUTION"; // Never "BUY" without AI verification
    }

    return {
      riskScore,
      summary: `⚠️ AI analysis unavailable. Pattern-based scan detected ${patternIssues.length} potential issue(s). This is a limited analysis - use caution. ${aiError ? `Error: ${aiError.message}` : ""}`,
      issues:
        patternIssues.length > 0
          ? patternIssues
          : [
              {
                severity: "MEDIUM",
                type: "Limited Analysis",
                description: "AI analysis services temporarily unavailable",
                impact:
                  "This contract has not received full AI security analysis. Pattern detection only.",
              },
            ],
      recommendation,
      confidence: 50, // Low confidence for pattern-only analysis
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
