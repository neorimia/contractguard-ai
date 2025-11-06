# All Code Files - Complete Bundle

All code needed to build ContractGuard AI. Copy these files into your project.

---

## 📁 Project Structure

```
contractguard-ai/
├── app/
│   ├── api/
│   │   ├── audit/
│   │   │   └── route.ts
│   │   └── share-card/
│   │       └── route.tsx
│   ├── layout.tsx
│   └── page.tsx
├── db/
│   ├── index.ts
│   └── schema.ts
├── lib/
│   ├── middleware/
│   │   └── rate-limit.ts
│   └── services/
│       ├── contract.service.ts
│       └── ai.service.ts
├── .env.local
├── drizzle.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Files

### `db/schema.ts`

See [[05-Database-Schema]] for complete code.

### `db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## ⚙️ Configuration Files

### `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### `.env.local`

```env
# Database
DATABASE_URL="postgresql://..."

# Redis
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."

# APIs
ETHERSCAN_API_KEY="..."
ALCHEMY_API_KEY="..."
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### `package.json` (scripts section)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 🔧 Service Files

### `lib/services/contract.service.ts`

See [[20-Contract-Service]] for complete code.

Key methods:
- `fetchContract(address, chain)` - Gets contract from Etherscan
- `getEnrichmentData(address)` - Gets holder count, liquidity
- `validateAddress(address)` - Validates Ethereum address

### `lib/services/ai.service.ts`

See [[21-AI-Service]] for complete code.

Key methods:
- `analyzeContract(sourceCode, name, data)` - AI analysis
- `detectKnownPatterns(sourceCode)` - Pattern matching
- `buildAnalysisPrompt()` - Constructs AI prompt

---

## 🛡️ Middleware Files

### `lib/middleware/rate-limit.ts`

See [[22-Rate-Limiter]] for complete code.

Key functions:
- `checkRateLimit(identifier, tier)` - Check limits
- `rateLimitMiddleware(req, tier)` - Middleware function

---

## 🌐 API Routes

### `app/api/audit/route.ts`

See [[23-Audit-API]] for complete code.

Endpoints:
- `POST /api/audit` - Analyze contract
- `GET /api/audit?address=0x...` - Get cached analysis

### `app/api/share-card/route.tsx`

See [[24-Share-Card-API]] for complete code.

Endpoint:
- `GET /api/share-card?address=0x...&score=85&rec=AVOID` - Generate OG image

---

## 🎨 Frontend Files

### `app/page.tsx`

See [[25-Frontend-Page]] for complete code.

Main components:
- Input form
- Results display
- Risk score card
- Issues list
- Share functionality

### `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContractGuard AI - Smart Contract Security Scanner',
  description: 'AI-powered smart contract analysis. Detect scams, honeypots, and rug pulls in seconds.',
  openGraph: {
    title: 'ContractGuard AI',
    description: 'Detect crypto scams with AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContractGuard AI',
    description: 'Detect crypto scams with AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 📦 Dependencies

### Install Commands

```bash
# Core dependencies
npm install next@latest react react-dom typescript

# Database & ORM
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Redis cache
npm install @upstash/redis

# AI
npm install openai

# UI Components
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# Types
npm install -D @types/node @types/react @types/react-dom

# Tailwind
npm install -D tailwindcss postcss autoprefixer
```

### Full `package.json`

```json
{
  "name": "contractguard-ai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "drizzle-orm": "^0.29.0",
    "@neondatabase/serverless": "^0.9.0",
    "@upstash/redis": "^1.25.0",
    "openai": "^4.20.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "drizzle-kit": "^0.20.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "15.0.0"
  }
}
```

---

## 🎨 Styling Files

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 263 70% 60%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 263 70% 60%;
  }
}

@layer utilities {
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

---

## 🚀 Setup Commands

### Initial Setup

```bash
# Create project
npx create-next-app@latest contractguard-ai --typescript --tailwind --app

cd contractguard-ai

# Install dependencies
npm install drizzle-orm @neondatabase/serverless @upstash/redis openai
npm install -D drizzle-kit

# Create directories
mkdir -p lib/services lib/middleware db app/api/audit app/api/share-card

# Create env file
touch .env.local
```

### Database Setup

```bash
# Generate migration
npm run db:generate

# Push to database
npm run db:push

# Open Drizzle Studio (optional)
npm run db:studio
```

### Development

```bash
# Start dev server
npm run dev

# Visit
open http://localhost:3000
```

### Production

```bash
# Build
npm run build

# Test production build
npm run start

# Deploy to Vercel
vercel --prod
```

---

## ✅ Verification Checklist

After copying all files:

- [ ] All files in correct directories
- [ ] .env.local configured with API keys
- [ ] Dependencies installed
- [ ] Database schema pushed
- [ ] Dev server starts successfully
- [ ] API endpoint returns data
- [ ] Frontend displays correctly
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🔍 Testing

### Test Contract Addresses

**Safe Contracts (Low Risk):**
```
USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
DAI:  0x6B175474E89094C44Da98b954EedeAC495271d0F
WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

**Test API:**
```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  }'
```

---

## 📚 Related Notes

- [[04-Quick-Start]] - Setup guide
- [[05-Database-Schema]] - Database code
- [[20-Contract-Service]] - Contract service
- [[21-AI-Service]] - AI service
- [[22-Rate-Limiter]] - Rate limiting
- [[23-Audit-API]] - API routes
- [[24-Share-Card-API]] - OG images
- [[25-Frontend-Page]] - UI components

---

#code #setup #files #complete
