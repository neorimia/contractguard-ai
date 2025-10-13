/**
 * Apply Crypto Audits Migration
 *
 * This script applies migration 0007 (crypto_audits table) to the database.
 */

import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function applyMigration() {
  try {
    console.log("🔍 Checking if crypto_audits table exists...");

    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'crypto_audits'
      );
    `);

    const tableExists = result.rows[0]?.exists;

    if (tableExists) {
      console.log("✅ crypto_audits table already exists!");
      return;
    }

    console.log("📝 Table doesn't exist. Reading migration file...");

    // Read migration SQL
    const migrationPath = path.join(
      process.cwd(),
      "drizzle",
      "0007_deep_wiccan.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("🚀 Applying migration...");

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`   Executing: ${statement.substring(0, 50)}...`);
      await db.execute(sql.raw(statement));
    }

    console.log("✅ Migration applied successfully!");
    console.log("\nCreated tables:");
    console.log("  - crypto_audits");
    console.log("  - risk_heuristics");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration().then(() => {
  console.log("\n✅ Done!");
  process.exit(0);
});
