# ContractGuard AI - Setup Complete! 🎉

## Next Steps:

### 1. Configure Environment Variables
Edit `.env.local` with your actual API keys:
- Get Neon DB from: https://neon.tech
- Get Upstash Redis from: https://upstash.com
- Get Etherscan API: https://etherscan.io/apis
- Get Alchemy API: https://www.alchemy.com
- Get OpenAI API: https://platform.openai.com

### 2. Setup Database
```bash
npm run db:push
```

### 3. Copy the provided code files
Copy these files from the artifacts:
- `db/schema.ts`
- `lib/services/contract.service.ts`
- `lib/services/ai.service.ts`
- `lib/middleware/rate-limit.ts`
- `app/api/audit/route.ts`
- `app/api/share-card/route.tsx`
- `app/page.tsx`

### 4. Start Development
```bash
npm run dev
```

### 5. Test with a contract
Visit http://localhost:3000
Paste a contract address like:
- Honeypot example: 0x...
- Safe token: 0x...

### 6. Deploy to Vercel
```bash
vercel --prod
```

## Useful Commands

- `npm run dev` - Start dev server
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio
- `npm run build` - Build for production

## Cost Breakdown
- Neon DB: /bin/zsh (Free tier)
- Upstash: /bin/zsh (Free tier)
- APIs: ~-100/month (with caching)

## Support
- Docs: /docs
- Issues: /issues
- Discord: [link]

Happy building! 🚀
