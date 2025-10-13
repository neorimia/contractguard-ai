# Database Migration Guide

## TL;DR

- ✅ Use `npm run db:push` to sync schema changes
- ❌ Don't use `npm run db:migrate` (it's broken for existing databases)
- 📝 Use `npm run db:generate` to create migration SQL files for documentation

## The Situation

Our database was set up before Drizzle's migration tracking was properly initialized. While we have migration tracking now (`__drizzle_migrations` table), `drizzle-kit migrate` has a bug where it doesn't properly check this table before running migrations, causing it to fail when tables already exist.

## Current Database State

✅ All tables exist and are up to date:

- `users`, `api_keys`, `audits`, `crypto_audits`
- `referrals`, `referral_commissions`, `referral_tier_achievements`
- `social_proof_stats`, `rewards_ledger`, `purchases`
- `banners`, `banner_impressions`, `banner_analytics`
- `anonymous_scans`, `feedback`, `risk_heuristics`

✅ Migration tracking initialized:

- `__drizzle_migrations` table exists
- 8 migrations marked as applied (0000-0007)

## Workflows

### Making Schema Changes (Recommended)

1. **Update your schema** in `db/schema.ts`

2. **Push changes** to database:

   ```bash
   npm run db:push
   ```

3. **Review the changes** that will be applied

4. **Confirm** to apply them

This directly synchronizes your database with the schema definition - fast and reliable.

### Generating Migration Files (Optional)

If you want to keep SQL migration files for documentation or deployment:

1. **Update schema** in `db/schema.ts`

2. **Generate migration**:

   ```bash
   npm run db:generate
   ```

3. **Apply using push** (not migrate):
   ```bash
   npm run db:push
   ```

**Note**: The generated SQL files in `drizzle/` are for reference only. Don't use `npm run db:migrate` to apply them.

### Checking Database State

```bash
# View database schema in browser
npm run db:studio

# Check for schema differences
npm run db:check

# Pull current database schema
npm run db:pull
```

## Migration Files Cleanup

We removed 4 manual migration files that were causing conflicts:

- `0005_analytics_indexes.sql` (removed - not in journal)
- `0006_add_referral_gamification.sql` (removed - not in journal)
- `0007_add_referral_hybrid_model.sql` (removed - not in journal)
- `0008_crypto_performance_indexes.sql` (removed - not in journal)

Current migration files (0000-0007) match the journal and are tracked in `__drizzle_migrations`.

## Helper Scripts

Located in `scripts/`:

- `check-migration-state.ts` - Check database and tracking table status
- `check-migration-files.ts` - Verify migration files match journal
- `init-migration-tracking.ts` - Initialize tracking (already done)

## Why Not Use `migrate`?

The `drizzle-kit migrate` command has a limitation where it doesn't properly check the `__drizzle_migrations` tracking table before running migrations. This causes it to try to recreate existing tables, leading to errors.

**Error you'll see**:

```
error: relation "api_keys" already exists
```

This is a known issue with Drizzle Kit when working with existing databases that weren't set up using Drizzle migrations from the start.

## Best Practices

1. **Always use `db:push`** for schema changes in development
2. **Generate migrations** if you need SQL files for audit/deployment purposes
3. **Never run `db:migrate`** - it's disabled and will show an error message
4. **Test schema changes** with `npm run db:push` (it shows a preview before applying)
5. **Use `db:studio`** to visualize and verify your changes

## For Production

When deploying to production:

1. Ensure `db/schema.ts` is up to date
2. Run `npm run db:push` (after reviewing changes)
3. Or apply generated SQL files manually if you prefer

The `drizzle-kit push` command is safe for production as it shows you exactly what will change and requires confirmation.

---

**Last Updated**: 2024-01-13
**Status**: Migration system working with `push` command
