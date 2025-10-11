⏺ ContractGuard AI Banner System - Complete Technical Design

I've created a comprehensive technical design specification for implementing the banner monetization system. Here's what's included:

📋 Design Overview

Target Revenue: €13-20K/month at 100K free users through:
- Internal upgrade banners: €10-15K/month (conversion lift)
- External crypto ad banners: €3-5K/month (Cointraffic/Coinzilla CPM)

🗂️ Key Design Components

1. Database Schema (Section 1)

Complete schema with 3 new tables:
- banners - Banner configuration and content
- bannerImpressions - Tracking impressions, clicks, conversions
- bannerAnalytics - Aggregated metrics (hourly/daily/weekly/monthly)

Indexes optimized for:
- Fast banner selection by user type and placement
- Efficient impression tracking by session/user
- Quick analytics queries

2. Component Architecture (Section 2)

React component hierarchy:
- BannerManager - Main orchestrator, fetches optimal banner
- BannerSlot - Placement wrapper with viewability tracking
- BannerRenderer - Content renderer supporting 5 placement types
- Template components for each placement format

Integration points with existing ScanInterface.tsx showing exactly where to place banner components.

3. Banner Selection Logic (Section 3)

BannerService with intelligent selection algorithm:
- Multi-factor targeting (user type, scan count, tier, priority)
- Frequency capping (max impressions per user per day)
- Weighted random selection based on priority scores
- Redis caching for performance (<100ms selection time)

API Routes:
- /api/banners/select - Select optimal banner
- /api/banners/impression - Track impressions
- /api/banners/click - Track clicks
- /api/banners/conversion - Attribution tracking

4. Analytics & A/B Testing (Section 4)

Complete framework including:
- PostHog event tracking integration
- ABTestingService with statistical significance calculation
- A/B test dashboard API (/api/banners/ab-test)
- Two-proportion z-test for variant comparison

5. External Ad Networks (Section 5)

- Cointraffic integration component
- Revenue webhook endpoint for partner reporting
- Fallback logic when external ads fail

6. Performance Optimization (Section 6)

- Redis caching strategy (5-minute TTL)
- Lazy loading with dynamic imports
- Image optimization via Next.js
- Target: <100ms load time impact

7. Implementation Roadmap (Section 7)

Phase 1: MVP (Week 1-2)
- Core infrastructure and 3 banner placements
- 5 initial variants
- Basic analytics
- Target: 0.3% CTR, €200-400/month revenue at 5K users

Phase 2: Optimization (Week 3-4)
- Cointraffic integration
- 10+ A/B tested variants
- Analytics dashboard
- Target: 0.5% CTR, €500-800/month at 10K users

Phase 3: Advanced (Month 2-3)
- Dynamic banners with real-time stats
- Geo-targeting
- Animated HTML5 banners
- Target: 0.8% CTR, €2-5K/month at 30K users

8. Success Metrics & KPIs (Section 8)

| Metric          | MVP    | Optimized | Benchmark  |
  |-----------------|--------|-----------|------------|
| CTR (Internal)  | 0.3%   | 0.8%      | 0.18-0.35% |
| Conversion Rate | 2%     | 4%        | 2-5%       |
| Load Time       | <200ms | <100ms    | <500ms     |

Revenue Projections:
- 20K users: €1.1-1.6K/month
- 50K users: €4.5-6.5K/month
- 100K users: €13-20K/month

9. Risk Mitigation (Section 9)

Strategies for:
- UX degradation (frequency caps, dismissible banners)
- Performance (lazy loading, caching)
- Ad network reliability (fallbacks, multi-network)
- Regulatory compliance (GDPR consent)

10. Monitoring & Testing (Sections 10-11)

- Real-time health checks
- Anomaly detection and alerting
- Unit tests for BannerService
- Integration tests for API routes
- E2E tests with Playwright

📁 File Location

/Users/kaapo-studio/Documents/Projects/contractguard-ai/docs/BANNER_SYSTEM_DESIGN.md

🚀 Next Steps

1. Review Design: Share with stakeholders for approval
2. Day 1: Run npm run db:push to create banner tables
3. Week 1-2: Implement Phase 1 (MVP)
4. Design Assets: Coordinate with designer for 5 initial banner variants
5. Cointraffic Setup: Register account and get API keys
