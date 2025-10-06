# Technical Context - ContractGuard AI

## Technology Stack

### Frontend Stack

- **Next.js 15** - React framework with App Router
- **React 18** - UI library with latest features
- **TypeScript** - Type-safe development
- **TailwindCSS v4** - Utility-first styling
- **Shadcn UI** - Component library for consistent design
- **Motion** - Animation library for smooth interactions

### Backend Stack

- **Next.js API Routes** - Serverless API endpoints
- **TypeScript** - End-to-end type safety
- **Drizzle ORM** - Type-safe database operations
- **Neon PostgreSQL** - Serverless database
- **Upstash Redis** - Serverless caching

### External Services

- **OpenAI GPT-4 Turbo** - AI analysis engine
- **Etherscan API** - Contract source code fetching
- **Alchemy API** - Blockchain data enrichment
- **Stripe** - Payment processing (Week 3)
- **Vercel** - Deployment and hosting

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Drizzle Kit** - Database migrations
- **Vercel CLI** - Deployment management

## Development Environment

### Prerequisites

```bash
# Required software
Node.js 18+ (recommended: 20+)
npm or yarn
Git
Vercel CLI (for deployment)
```

### Project Structure

```
contractguard-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── audit/         # Contract analysis endpoint
│   │   └── share-card/    # Social sharing endpoint
│   ├── chat/              # Analysis interface page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── Header.tsx        # Navigation header
│   ├── HeroSection.tsx   # Landing hero
│   ├── PricingSection.tsx # Pricing display
│   └── FAQSection.tsx    # FAQ section
├── lib/                   # Utility libraries
│   ├── services/         # Business logic services
│   ├── middleware/       # API middleware
│   └── utils.ts          # Helper functions
├── db/                   # Database layer
│   ├── index.ts          # Database connection
│   └── schema.ts         # Drizzle schema
├── config/               # Configuration files
│   └── site.ts           # Site configuration
└── public/               # Static assets
```

### Package Dependencies

**Core Dependencies:**

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "@number-flow/react": "^0.5.9",
    "@radix-ui/react-slot": "^1.2.3",
    "@upstash/redis": "^1.35.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.44.6",
    "lucide-react": "^0.544.0",
    "motion": "^12.0.5",
    "next": "^15.5.4",
    "next-themes": "^0.4.4",
    "openai": "^6.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

**Dev Dependencies:**

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.7",
    "@types/node": "^24.7.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.5",
    "postcss": "^8.5.2",
    "prettier": "^3.6.2",
    "prettier-plugin-tailwindcss": "^0.6.14",
    "tailwindcss": "^4.0.7",
    "typescript": "^5"
  }
}
```

## Configuration Files

### Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### TailwindCSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(263 70% 60%)",
          foreground: "hsl(210 40% 98%)",
        },
        background: "hsl(222.2 84% 4.9%)",
        foreground: "hsl(210 40% 98%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Environment Variables

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis Cache
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token

# AI Service
OPENAI_API_KEY=sk-your-openai-api-key

# Blockchain APIs
ETHERSCAN_API_KEY=your-etherscan-api-key
ALCHEMY_API_KEY=your-alchemy-api-key

# Payment (Week 3)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Analytics (Optional)
POSTHOG_API_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://contractguard.ai
NEXT_PUBLIC_SITE_NAME=ContractGuard AI
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

## Database Setup

### Database Connection

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Schema Definition

```typescript
// db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  chain: text("chain").notNull().default("ethereum"),
  sourceCode: text("source_code"),
  bytecode: text("bytecode"),
  isVerified: boolean("is_verified").default(false),
  riskScore: integer("risk_score"),
  summary: text("summary"),
  issues: jsonb("issues").$type<Issue[]>(),
  recommendation: text("recommendation"),
  holderCount: integer("holder_count"),
  liquidity: text("liquidity"),
  ownerBalance: text("owner_balance"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  views: integer("views").default(0),
  shares: integer("shares").default(0),
});

// Additional tables...
```

### Migration Commands

```bash
# Generate migration
npm run db:generate

# Push schema to database
npm run db:push

# Open database studio
npm run db:studio
```

## API Development

### API Route Structure

```typescript
// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ContractService } from "@/lib/services/contract.service";
import { AIAnalysisService } from "@/lib/services/ai.service";
import { rateLimit } from "@/lib/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse request body
    const { address } = await req.json();

    // Validate input
    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: "Invalid contract address" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedAnalysis(address);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Analyze contract
    const contractService = new ContractService();
    const aiService = new AIAnalysisService();

    const contract = await contractService.fetchContract(address);
    const analysis = await aiService.analyzeContract(contract);

    // Cache result
    await cacheAnalysis(address, analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
```

## Service Architecture

### Contract Service

```typescript
// lib/services/contract.service.ts
import { ethers } from "ethers";

export class ContractService {
  private etherscanApiKey: string;

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY!;
  }

  async fetchContract(address: string): Promise<ContractData> {
    // Fetch from Etherscan API
    const response = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`
    );

    const data = await response.json();

    if (data.status !== "1" || !data.result[0].SourceCode) {
      throw new Error("Contract not found or not verified");
    }

    return {
      address,
      sourceCode: data.result[0].SourceCode,
      contractName: data.result[0].ContractName,
      compilerVersion: data.result[0].CompilerVersion,
      isVerified: true,
    };
  }

  async enrichWithBlockchainData(address: string): Promise<EnrichmentData> {
    // Fetch holder count, liquidity, etc. from Alchemy
    // Implementation details...
  }
}
```

### AI Analysis Service

```typescript
// lib/services/ai.service.ts
import OpenAI from "openai";

export class AIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeContract(contract: ContractData): Promise<AnalysisResult> {
    const prompt = this.buildSecurityPrompt(contract);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a smart contract security expert...",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content!);
    return this.validateAndFormat(analysis);
  }

  private buildSecurityPrompt(contract: ContractData): string {
    return `
Analyze this smart contract for security vulnerabilities and potential scams:

Contract Address: ${contract.address}
Contract Name: ${contract.contractName}

Source Code:
${contract.sourceCode}

Please provide a JSON response with:
1. riskScore (0-100)
2. summary (brief overview)
3. issues (array of security issues)
4. recommendation (BUY/AVOID/CAUTION)
`;
  }
}
```

## Caching Strategy

### Redis Cache Implementation

```typescript
// lib/services/cache.service.ts
import { Redis } from "@upstash/redis";

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value as string) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  generateCacheKey(type: string, ...params: string[]): string {
    return `${type}:${params.join(":")}`;
  }
}
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Setup database
npm run db:push

# Start development server
npm run dev

# Open http://localhost:3000
```

### Database Operations

```bash
# Generate migration after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Open database studio (GUI)
npm run db:studio
```

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format code
npx prettier --write .

# Build for production
npm run build
```

### Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

```bash
# Set environment variables in Vercel dashboard
# or use CLI
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
# ... other variables
```

### Domain Setup

```bash
# Add custom domain in Vercel dashboard
# DNS will be automatically configured
```

## Monitoring & Analytics

### Performance Monitoring

- **Vercel Analytics** - Built-in performance metrics
- **Web Vitals** - Core web vitals tracking
- **Error Tracking** - Automatic error reporting

### Business Analytics

- **PostHog** - User behavior and conversion tracking
- **Custom Events** - Contract scans, upgrades, shares

### Health Monitoring

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      externalAPIs: await checkExternalAPIs(),
    },
  };

  return NextResponse.json(health);
}
```

## Cost Optimization

### API Cost Management

- **Aggressive Caching** - Reduce AI API calls by 80%
- **Rate Limiting** - Control usage and costs
- **Tiered Models** - Use cheaper models for basic analysis

### Infrastructure Costs

- **Serverless Architecture** - Pay only for usage
- **Auto-scaling** - Handle traffic spikes automatically
- **Edge Optimization** - Faster response times, lower costs

### Monthly Cost Estimates

```
Development (0-1k users): ~$50/month
Growth (1k-10k users): ~$300/month
Scale (10k+ users): ~$700/month
```

## Security Considerations

### API Security

- **Rate Limiting** - Prevent abuse and DDoS
- **Input Validation** - Sanitize all inputs
- **CORS Configuration** - Proper cross-origin handling

### Data Security

- **Environment Variables** - Secure API key storage
- **Database Security** - Connection string encryption
- **HTTPS Only** - Secure data transmission

### Privacy

- **Minimal Data Collection** - Only necessary user data
- **Data Retention** - Clear retention policies
- **GDPR Compliance** - User data protection

---

**Created:** 2024-12-19  
**Status:** Technical context and setup defined  
**Next:** Current active context and progress tracking
