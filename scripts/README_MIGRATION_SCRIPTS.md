# Migration Helper Scripts

These scripts help diagnose and manage database migration state.

## Available Scripts

### `check-migration-state.ts`

**Purpose**: Check current database migration state

**Usage**:

```bash
npx tsx scripts/check-migration-state.ts
```

**Shows**:

- All tables in database
- Migration tracking table status
- Applied migrations list
- Important tables checklist

**When to use**:

- Verify database setup
- Debug migration issues
- Check what tables exist

---

### `check-migration-files.ts`

**Purpose**: Verify migration files match the Drizzle journal

**Usage**:

```bash
npx tsx scripts/check-migration-files.ts
```

**Shows**:

- Migration files in `drizzle/` folder
- Journal entries from `drizzle/meta/_journal.json`
- Mismatches (extra files or missing files)

**When to use**:

- Before running migrations
- After adding new migrations
- Debug "migration not found" errors

---

### `init-migration-tracking.ts`

**Purpose**: Initialize migration tracking for existing database

**Usage**:

```bash
npx tsx scripts/init-migration-tracking.ts
```

**What it does**:

- Creates `__drizzle_migrations` table
- Marks all existing migrations as applied
- Syncs tracking with journal

**When to use**:

- ⚠️ Already run - do NOT run again unless you know what you're doing
- Only needed when setting up tracking for existing database
- If you reset the database and need to reinitialize

---

## Quick Reference

```bash
# Check database state
npx tsx scripts/check-migration-state.ts

# Verify migration files
npx tsx scripts/check-migration-files.ts

# Apply schema changes (recommended)
npm run db:push

# Generate new migration files (optional)
npm run db:generate

# View database in browser
npm run db:studio
```

## Troubleshooting

### "Migration files don't match journal"

1. Run `check-migration-files.ts` to see the mismatch
2. Either delete extra files or regenerate journal
3. Never manually create migration SQL files

### "Table already exists" error

1. Check if migration tracking is initialized: `check-migration-state.ts`
2. Use `npm run db:push` instead of `npm run db:migrate`
3. See `docs/DATABASE_MIGRATION_GUIDE.md` for full solution

### Reset migration tracking

⚠️ **Dangerous** - only if you know what you're doing:

```sql
DROP TABLE __drizzle_migrations;
```

Then run `init-migration-tracking.ts` again

---

**See also**: `docs/DATABASE_MIGRATION_GUIDE.md` for complete workflow documentation
