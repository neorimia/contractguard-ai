import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkMigrationState() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    console.log("Checking database migration state...\n");

    // List all tables in public schema first
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log("All tables in database:");
    allTables.forEach((table: any) => {
      console.log(`- ${table.table_name}`);
    });

    // Check for migration tracking table
    const migrationTable = allTables.find(
      (t: any) =>
        t.table_name === "__drizzle_migrations" ||
        t.table_name === "drizzle_migrations"
    );

    if (migrationTable) {
      console.log(
        `\nMigration tracking table found: ${migrationTable.table_name}`
      );

      try {
        // Get all applied migrations
        const appliedMigrations =
          await sql`SELECT * FROM __drizzle_migrations ORDER BY created_at;`;

        console.log("\nApplied migrations:");
        if (appliedMigrations.length === 0) {
          console.log("  (none)");
        } else {
          appliedMigrations.forEach((migration: any) => {
            console.log(
              `- ${migration.hash} (created: ${migration.created_at})`
            );
          });
        }
      } catch (err) {
        console.log("Could not read migration tracking table");
      }
    } else {
      console.log("\n⚠️  No migration tracking table found!");
      console.log("This means Drizzle hasn't tracked any migrations yet.");
    }

    // Check if api_keys table exists
    const apiKeysExists = allTables.find(
      (t: any) => t.table_name === "api_keys"
    );
    console.log("\napi_keys table exists:", !!apiKeysExists);

    // Check other important tables
    const importantTables = [
      "users",
      "audits",
      "subscriptions",
      "referrals",
      "analytics_events",
    ];

    console.log("\nOther important tables:");
    importantTables.forEach((tableName) => {
      const exists = allTables.find((t: any) => t.table_name === tableName);
      console.log(`- ${tableName}: ${exists ? "✓" : "✗"}`);
    });
  } catch (error) {
    console.error("Error checking migration state:", error);
    process.exit(1);
  }
}

checkMigrationState();
