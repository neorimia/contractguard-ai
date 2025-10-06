# .env.example

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@your-neon-db.neon.tech/dbname?sslmode=require"

# Redis Cache (Upstash)
UPSTASH_REDIS_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_TOKEN="your-token"

# Blockchain APIs
ETHERSCAN_API_KEY="your-etherscan-key"
BSCSCAN_API_KEY="your-bscscan-key"
ALCHEMY_API_KEY="your-alchemy-key"

# AI Services
CAFFEINE_API_KEY="your-caffeine-key"
# OR fallback to OpenAI
OPENAI_API_KEY="sk-your-openai-key"

# Authentication (Future)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Payments (Week 3+)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="G-..."
NEXT_PUBLIC_POSTHOG_KEY="..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
