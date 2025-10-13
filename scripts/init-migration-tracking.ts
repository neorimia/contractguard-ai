import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function initMigrationTracking() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    console.log("Initializing Drizzle migration tracking...\n");

    // Create the migration tracking table
    console.log("Creating __drizzle_migrations table...");
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
    console.log("✓ Migration tracking table created\n");

    // Read the journal to get all migrations that should be marked as applied
    const journalPath = path.join(
      process.cwd(),
      "drizzle",
      "meta",
      "_journal.json"
    );
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

    console.log(`Found ${journal.entries.length} migrations in journal\n`);

    // Check what's already in the tracking table
    const existing = await sql`SELECT hash FROM __drizzle_migrations`;
    const existingHashes = new Set(existing.map((row: any) => row.hash));

    // Mark each migration as applied
    for (const entry of journal.entries) {
      if (existingHashes.has(entry.tag)) {
        console.log(`- ${entry.tag} (already tracked)`);
      } else {
        await sql`
          INSERT INTO __drizzle_migrations (hash, created_at)
          VALUES (${entry.tag}, ${entry.when})
        `;
        console.log(`✓ ${entry.tag} (marked as applied)`);
      }
    }

    console.log("\n✅ Migration tracking initialized successfully!");
    console.log("\nYou can now run 'npm run db:migrate' safely.");
    console.log("Future migrations will be tracked automatically.");
  } catch (error) {
    console.error("Error initializing migration tracking:", error);
    process.exit(1);
  }
}

initMigrationTracking();
