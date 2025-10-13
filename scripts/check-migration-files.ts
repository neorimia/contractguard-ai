import fs from "fs";
import path from "path";

function checkMigrationFiles() {
  const drizzlePath = path.join(process.cwd(), "drizzle");

  // Read journal
  const journal = JSON.parse(
    fs.readFileSync(path.join(drizzlePath, "meta", "_journal.json"), "utf-8")
  );

  // Get SQL files
  const files = fs
    .readdirSync(drizzlePath)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Get tags from journal
  const journalTags = new Set(journal.entries.map((e: any) => e.tag));

  console.log("Migration Files vs Journal:\n");
  console.log("Files in drizzle/ folder:");
  files.forEach((file) => {
    const tag = file.replace(".sql", "");
    const inJournal = journalTags.has(tag);
    console.log(`  ${file} ${inJournal ? "✓" : "✗ NOT IN JOURNAL"}`);
  });

  console.log("\nJournal entries:");
  journal.entries.forEach((entry: any) => {
    const fileExists = files.includes(`${entry.tag}.sql`);
    console.log(`  ${entry.tag} ${fileExists ? "✓" : "✗ FILE MISSING"}`);
  });

  // Find mismatches
  const extraFiles = files.filter(
    (f) => !journalTags.has(f.replace(".sql", ""))
  );
  const missingFiles = journal.entries.filter(
    (e: any) => !files.includes(`${e.tag}.sql`)
  );

  if (extraFiles.length > 0) {
    console.log("\n⚠️  Extra migration files (not in journal):");
    extraFiles.forEach((f) => console.log(`  - ${f}`));
    console.log("\nThese files should be removed or added to the journal.");
  }

  if (missingFiles.length > 0) {
    console.log("\n⚠️  Missing migration files (in journal but no file):");
    missingFiles.forEach((e: any) => console.log(`  - ${e.tag}.sql`));
  }

  if (extraFiles.length === 0 && missingFiles.length === 0) {
    console.log("\n✅ All migration files match the journal!");
  }
}

checkMigrationFiles();
