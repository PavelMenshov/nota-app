#!/usr/bin/env node

/**
 * Clean Next.js build artifacts
 * This helps resolve issues with stale build cache, especially on Windows
 */

const fs = require('fs');
const path = require('path');

const WEB_APP_DIR = path.join(__dirname, '..', 'apps', 'web');
const NEXT_DIR = path.join(WEB_APP_DIR, '.next');

function removeDirectory(dir) {
  if (fs.existsSync(dir)) {
    console.log(`🧹 Removing ${path.relative(process.cwd(), dir)}...`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✅ Removed successfully`);
    return true;
  } else {
    console.log(`ℹ️  Directory ${path.relative(process.cwd(), dir)} does not exist, skipping`);
    return false;
  }
}

console.log('🚀 Cleaning Next.js build artifacts...\n');

removeDirectory(NEXT_DIR);

console.log('\n✨ Cleanup complete! You can now run "pnpm dev" to start fresh.');
