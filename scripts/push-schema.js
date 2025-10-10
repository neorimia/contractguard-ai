/**
 * Script to push database schema changes without interactive prompts
 * This script uses child_process to interact with drizzle-kit push
 */

const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'db:push', '--', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Auto-select "No" option (first option) if prompted
child.stdin.write('\n');

child.on('exit', (code) => {
  console.log(`\nMigration completed with code: ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
