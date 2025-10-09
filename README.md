# ContractGuard AI

AI-powered smart contract security scanner that detects scams, honeypots, and rug pulls in seconds. Built for crypto traders who can't read Solidity.

## Features

- **AI-Powered Analysis**: Leverages OpenAI and Caffeine.ai to analyze smart contracts for security vulnerabilities
- **Real-Time Scanning**: Fetches and analyzes contracts from Etherscan and Alchemy in seconds
- **Scam Detection**: Identifies honeypots, rug pulls, and malicious contract patterns
- **Risk Scoring**: Comprehensive risk assessment with detailed explanations
- **Share Results**: Beautiful share cards for social media virality
- **Multi-Chain Support**: Ethereum mainnet with plans for additional chains
- **Caching**: Multi-layer caching (Redis + Database) for blazing-fast repeat scans
- **Authentication**: Secure user authentication with email verification
- **Freemium Model**: Free tier with premium features for power users

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS v4** - Styling
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library
- **shadcn/ui** - UI components

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database queries
- **Neon PostgreSQL** - Serverless Postgres database
- **Upstash Redis** - Serverless Redis caching
- **Stack Auth** - Authentication & user management

### AI & Blockchain

- **OpenAI API** - Primary AI analysis
- **Caffeine.ai** - Alternative AI provider
- **Etherscan API** - Contract source code and verification
- **Alchemy API** - Blockchain data and enrichment

### Payment & Analytics

- **Stripe** - Payment processing (planned)
- **PostHog** - Analytics (planned)
- **Sentry** - Error monitoring (planned)

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)
- API keys (see Environment Variables section)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/neorimia/contractguard-ai.git
cd contractguard-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with required API keys (see below)

5. Run database migrations:

```bash
npm run db:push
# or
bun run db:push
```

6. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

7. Open [http://localhost:3000](http://localhost:3000) to view the app

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=your_neon_postgres_url

# Redis Cache
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

# AI Services
OPENAI_API_KEY=your_openai_api_key
CAFFEINE_API_KEY=your_caffeine_api_key  # Optional

# Blockchain APIs
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key

# Authentication (Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key

# Payment (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For detailed setup instructions, see [AUTH_SETUP_QUICKSTART.md](docs/AUTH_SETUP_QUICKSTART.md)

## Project Structure

```
contractguard-ai/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── audit/        # Main audit endpoint
│   │   ├── auth/         # Authentication endpoints
│   │   └── share-card/   # Share card generation
│   ├── account/          # User account page
│   ├── pricing/          # Pricing page
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ui/               # shadcn/ui components
│   ├── ScanResults.tsx   # Scan results display
│   └── ShareOnX.tsx      # Social sharing
├── lib/                   # Core libraries
│   ├── services/         # Service layer
│   │   ├── ai.service.ts        # AI analysis
│   │   ├── contract.service.ts  # Blockchain data
│   │   ├── auth.service.ts      # Authentication
│   │   └── email.service.ts     # Email handling
│   └── middleware/       # Express-style middleware
├── db/                    # Database
│   ├── schema.ts         # Drizzle schema
│   └── index.ts          # Database connection
├── memory-bank/          # Project documentation
└── mvp-build-plan/       # Development roadmap
```

## Key Features Documentation

- **Authentication**: See [AUTH_SETUP_QUICKSTART.md](docs/AUTH_SETUP_QUICKSTART.md)
- **Scan Results**: See [SCAN_RESULTS_COMPONENT.md](./SCAN_RESULTS_COMPONENT.md)
- **Share Cards**: See [SHARE_ON_X_COMPONENT.md](./SHARE_ON_X_COMPONENT.md)
- **Testing**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **SEO**: See [README_SEO.md](./README_SEO.md)

## Development Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations

# Testing
npm run test         # Run tests (when implemented)
```

## Caching Strategy

ContractGuard AI uses a multi-layer caching strategy to reduce API costs and improve performance:

1. **Redis Cache** (Hot): 5-minute TTL for frequently accessed scans
2. **Database Cache** (Warm): 24-hour TTL for all completed scans
3. **Cache Key Format**: `audit:${chain}:${address}`

## API Usage

### Audit Endpoint

```typescript
POST /api/audit
Content-Type: application/json

{
  "address": "0x...",
  "chain": "ethereum"  // Optional, defaults to ethereum
}

Response:
{
  "data": {
    "riskScore": 45,
    "summary": "Contract analysis summary",
    "issues": [...],
    "contractAddress": "0x...",
    "contractName": "TokenName"
  },
  "status": "success"
}
```

## Business Model

- **Free Tier**: 5 scans per day
- **Pro Tier**: $29/month, 100 scans per day
- **Enterprise**: Custom pricing for API access

## Contributing

This is a fast-paced project targeting the crypto bull market window. Key priorities:

1. **Speed**: Launch fast, iterate faster
2. **Quality**: Maintain clean code and patterns
3. **Security**: Validate all inputs, protect user data
4. **Performance**: Cache aggressively, optimize queries

## Roadmap

### Current (Week 1-2)

- ✅ Project setup and database schema
- ✅ Contract fetching service
- ✅ AI analysis service
- ✅ Basic authentication
- ✅ Main UI components

### Next (Week 3-4)

- [ ] Stripe integration
- [ ] Rate limiting
- [ ] Analytics integration
- [ ] Production deployment
- [ ] Marketing launch

### Future

- [ ] Multi-chain support (BSC, Polygon, etc.)
- [ ] API access for developers
- [ ] Historical contract tracking
- [ ] Browser extension
- [ ] Mobile app

## Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Contact: [your-email@example.com]

## License

[Your chosen license]

---

Powered by [Neorimia](https://neorimia.com) for the crypto community during the 2024-2025 bull market 🚀
