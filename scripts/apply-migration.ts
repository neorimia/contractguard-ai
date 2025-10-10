/**
 * Script to apply migration directly to database
 * Executes the generated SQL migration file
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ws from 'ws';

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0004_lean_maddog.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');

      try {
        // Execute SQL statement using Pool client
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        // Check if error is about existing objects (which is fine)
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (object already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✨ Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
