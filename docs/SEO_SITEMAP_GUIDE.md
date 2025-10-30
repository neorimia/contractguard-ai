# SEO Sitemap Implementation Guide

## Overview

ContractGuard AI implements a comprehensive, SEO-optimized sitemap strategy for maximum search engine visibility. The implementation leverages Next.js 15's native sitemap generation with dynamic database integration.

## Architecture

### Files

- **`app/sitemap.ts`**: Dynamic sitemap generator
- **`app/robots.ts`**: Search engine crawler configuration
- **`config/site.ts`**: Base URL and site configuration

### Key Features

1. **5-Tier Priority System**: Optimized crawl budget allocation
2. **Dynamic Route Generation**: Top 50 most-viewed contract audits
3. **Smart Frequency Settings**: From daily (critical) to monthly (legal)
4. **Privacy Protection**: Excludes user-specific and internal routes
5. **AI Crawler Blocking**: Prevents content scraping by GPTBot and CCBot

## Sitemap Structure

### Tier 1: Critical Pages (Priority 1.0, Daily)

```yaml
routes:
  - /                 # Homepage - primary entry point
  - /audit            # Main audit tool - conversion funnel
frequency: daily
rationale: Highest traffic, frequent updates, critical for conversions
```

### Tier 2: High-Value Marketing (Priority 0.9, Weekly)

```yaml
routes:
  - /features         # Product capabilities showcase
  - /pricing          # Monetization and tier comparison
  - /how-it-works     # Educational content
frequency: weekly
rationale: Key decision-making pages for potential customers
```

### Tier 3: Supporting Content (Priority 0.7, Weekly)

```yaml
routes:
  - /faq              # User questions and support
  - /support          # Help center
  - /feedback         # User feedback collection
  - /sign-up          # Registration flow
  - /sign-in          # Authentication flow
frequency: weekly
rationale: Support conversion funnel and user retention
```

### Tier 4: Legal & Compliance (Priority 0.5, Monthly)

```yaml
routes:
  - /privacy          # Privacy policy
  - /terms            # Terms of service
  - /cookies          # Cookie policy
frequency: monthly
rationale: Compliance pages with infrequent updates
```

### Tier 5: Dynamic Audits (Priority 0.8, Weekly)

```yaml
routes:
  - /audit/[chain]/[contractAddress]  # Top 50 most-viewed audits
frequency: weekly
selection_criteria:
  - views > 0
  - ORDER BY views DESC, createdAt DESC
  - LIMIT 50
rationale: Index high-traffic contract pages for long-tail searches
```

## Robots.txt Configuration

### Allowed Routes

- All public marketing and feature pages
- Dynamic contract audit pages
- Legal and compliance pages

### Blocked Routes

```yaml
api_endpoints:
  - /api/*            # Backend API routes

admin_internal:
  - /admin/*          # Admin dashboard
  - /handler/*        # Internal handlers

user_areas:
  - /account/*        # User account settings
  - /billing/*        # Payment and subscription
  - /watchlist/*      # Private watchlists
  - /referrals/*      # Referral tracking

authentication:
  - /auth/*           # Auth flows
  - /verify-email-sent/*
  - /forgot-password/*

tracking:
  - /ref/*            # Referral codes (contains dynamic UUIDs)

framework:
  - /_next/*          # Next.js internals
```

### AI Crawler Blocking

```yaml
blocked_bots:
  - GPTBot            # OpenAI web crawler
  - CCBot             # Common Crawl bot
rationale: Prevent content scraping and unauthorized AI training
```

## Dynamic Route Generation

### Database Query

```typescript
// Fetches top 50 most-viewed contract audits
const topAudits = await db
  .select({
    contractAddress: cryptoAudits.contractAddress,
    chain: cryptoAudits.chain,
    createdAt: cryptoAudits.createdAt,
  })
  .from(cryptoAudits)
  .where(gt(cryptoAudits.views, 0))
  .orderBy(desc(cryptoAudits.views), desc(cryptoAudits.createdAt))
  .limit(50);
```

### Error Handling

- **Graceful Degradation**: Sitemap continues without dynamic routes on DB failure
- **Error Logging**: Comprehensive error context logged to console
- **Build Safety**: Static routes always included, even if DB unavailable

## SEO Benefits

### Crawl Budget Optimization

**Before Enhancement**:
- 7 generic routes
- Flat priority (0.8 for all)
- 0 dynamic content

**After Enhancement**:
- 18+ static routes
- 5-tier priority hierarchy (1.0 → 0.5)
- Up to 50 dynamic contract pages
- Smart frequency management

### Impact Projections

1. **Improved Indexing**: Priority system guides search engines to high-value pages first
2. **Long-Tail Traffic**: Dynamic audit pages capture contract-specific searches
3. **User Privacy**: Private areas properly excluded from search results
4. **Cost Control**: AI crawler blocking prevents unnecessary API usage
5. **Scalability**: Async queries handle growth without performance impact

## Implementation Guide

### Development

```bash
# Build and verify sitemap
npm run build

# Check sitemap generation
curl http://localhost:3000/sitemap.xml

# Check robots.txt
curl http://localhost:3000/robots.txt
```

### Production Deployment

1. Deploy to Vercel/production environment
2. Verify sitemap at `https://contractguard.ai/sitemap.xml`
3. Submit to Google Search Console
4. Monitor indexing status and coverage

### Google Search Console Setup

1. **Add Property**: Add `https://contractguard.ai`
2. **Submit Sitemap**: Submit `https://contractguard.ai/sitemap.xml`
3. **Monitor Coverage**:
   - Check "Coverage" report for indexing status
   - Verify no errors or warnings
   - Monitor "Sitemaps" report for fetch/index stats
4. **Test Robots.txt**: Use GSC robots.txt tester to verify configuration

## Monitoring & Maintenance

### Key Metrics to Track

```yaml
google_search_console:
  - sitemap_fetch_status    # Success/failure of sitemap fetches
  - pages_indexed           # Total indexed pages vs. submitted
  - coverage_errors         # Indexing errors or warnings
  - crawl_stats             # Crawl frequency and bandwidth

analytics:
  - organic_traffic         # SEO-driven traffic growth
  - page_impressions        # Search result visibility
  - click_through_rate      # Search result engagement
  - ranking_position        # Keyword ranking improvements
```

### Maintenance Tasks

**Weekly**:
- Monitor GSC for new errors or warnings
- Review top-performing pages from sitemap

**Monthly**:
- Analyze audit page indexing effectiveness
- Evaluate dynamic route selection criteria
- Review robots.txt blocking effectiveness

**Quarterly**:
- Re-evaluate priority hierarchy based on traffic data
- Adjust change frequency based on update patterns
- Optimize dynamic route count (currently 50)

## Advanced Optimization

### Future Enhancements

1. **Per-Page Metadata**: Add structured data (JSON-LD) for contract audit pages
2. **Multi-Language Sitemaps**: Implement hreflang for internationalization
3. **Dedicated Contract Pages**: Create static pages for top contracts (e.g., `/contracts/uniswap-v3`)
4. **Image Sitemap**: Add separate sitemap for contract diagrams/charts
5. **Video Sitemap**: Include audit explanation videos when available

### A/B Testing Opportunities

- Test different priority values for conversion optimization
- Experiment with dynamic route count (50 vs. 100 vs. 200)
- Evaluate impact of different change frequencies
- Test alternative URL structures for contract audits

## Technical Specifications

### Next.js 15 Integration

```typescript
// Next.js automatically generates sitemap.xml from this function
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Returns array of URL objects with metadata
}
```

### Type Safety

```typescript
interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 to 1.0
}
```

### Performance Considerations

- **Database Query**: Async, non-blocking, with 50-row limit
- **Build Time**: Minimal impact (<1s additional build time)
- **Caching**: Next.js automatically caches generated sitemap
- **Error Handling**: Graceful degradation on DB failures

## Compliance & Best Practices

### Google Guidelines

✅ **Maximum URLs**: 50,000 per sitemap (current: 68)
✅ **File Size**: 50MB uncompressed (current: <5KB)
✅ **URL Format**: Absolute URLs with protocol
✅ **XML Validity**: Valid XML structure
✅ **Encoding**: UTF-8 encoding

### robots.txt Standards

✅ **File Location**: `/robots.txt` in root
✅ **Sitemap Declaration**: Includes sitemap URL
✅ **User-Agent Specificity**: Separate rules for different bots
✅ **Security**: No sensitive information exposed

## Troubleshooting

### Common Issues

**Sitemap not generating**:
```bash
# Check build output
npm run build | grep sitemap

# Verify database connection
# Check DATABASE_URL in .env.local
```

**Dynamic routes not appearing**:
```sql
-- Verify audits exist with views > 0
SELECT COUNT(*) FROM crypto_audits WHERE views > 0;
```

**Robots.txt blocking desired pages**:
```bash
# Test with GSC robots.txt tester
# Or use: curl https://contractguard.ai/robots.txt
```

### Error Messages

**"Module not found: '@/db/schema'"**:
- Verify database schema exports are correct
- Check `cryptoAudits` export exists in `db/schema.ts`

**"Cannot read property 'contractAddress'"**:
- Database query failed or returned empty results
- Check error logs for database connection issues

## Support

For issues or questions:
- **Documentation**: This guide
- **Google Search Console**: https://search.google.com/search-console
- **Next.js Sitemap Docs**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**Maintainer**: ContractGuard AI Team
