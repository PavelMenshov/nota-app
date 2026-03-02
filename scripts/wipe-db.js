#!/usr/bin/env node
/**
 * Wipe the database: drop and recreate the PostgreSQL database, then re-apply the schema.
 * Requires Docker (nota-postgres container running) and DATABASE_URL in .env.
 *
 * Usage: pnpm db:wipe
 * Or:    node scripts/wipe-db.js
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.join(rootDir, '.env');
const dbEnvPath = path.join(rootDir, 'packages', 'database', '.env');

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

function loadEnv() {
  const root = parseEnvFile(rootEnvPath);
  const db = parseEnvFile(dbEnvPath);
  if (Object.keys(root).length === 0 && Object.keys(db).length === 0) {
    console.error('No .env found in repo root or packages/database. Copy .env.example to .env and set DATABASE_URL.');
    process.exit(1);
  }
  return { ...db, ...root };
}

function main() {
  const env = loadEnv();
  const dbUrl = env.DATABASE_URL || env.DIRECT_DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL (or DIRECT_DATABASE_URL) is not set in .env.');
    console.error('Add e.g. DATABASE_URL="postgresql://nota:YOUR_PASSWORD@localhost:5432/nota?schema=public"');
    process.exit(1);
  }
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  if (!isLocal) {
    console.error('db:wipe only allows local databases (localhost or 127.0.0.1).');
    console.error('Your DATABASE_URL does not look local. Refusing to wipe.');
    process.exit(1);
  }

  console.log('Wiping database...');

  // Use Docker to drop and recreate the database (connect to template1 so we can drop nota)
  const cmd = `docker compose exec -T nota-postgres psql -U nota -d template1 -c "DROP DATABASE IF EXISTS nota;" -c "CREATE DATABASE nota;"`;
  const result = spawnSync(cmd, {
    shell: true,
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error('\nDocker command failed. Ensure:');
    console.error('  1. Docker is running and "docker compose up -d" has been run.');
    console.error('  2. Container name is nota-postgres (from docker-compose.yml).');
    console.error('  3. POSTGRES_PASSWORD in .env matches the container.');
    process.exit(1);
  }

  console.log('Re-applying schema (pnpm db:push)...');
  execSync('pnpm db:push', { cwd: rootDir, stdio: 'inherit' });
  console.log('Database wiped and schema applied.');
}

main();
