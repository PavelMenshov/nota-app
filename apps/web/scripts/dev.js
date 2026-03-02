#!/usr/bin/env node
/**
 * Start Next.js dev server. If SKIP_WAIT_FOR_API is set, start immediately (faster).
 * Otherwise wait for API health check first (ensures API is ready before web compiles).
 */
const { spawn } = require('child_process');
const path = require('path');

const skipWait = process.env.SKIP_WAIT_FOR_API === '1' || process.env.SKIP_WAIT_FOR_API === 'true';
const appDir = path.join(__dirname, '..');

function runNext() {
  const next = spawn('next', ['dev', '-p', '3000'], {
    stdio: 'inherit',
    shell: true,
    cwd: appDir,
  });
  next.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
  next.on('exit', (code) => process.exit(code ?? 0));
}

if (skipWait) {
  console.log('⚡ Skipping API wait (SKIP_WAIT_FOR_API). Next.js starting immediately.');
  runNext();
} else {
  const waitPath = path.join(__dirname, '../../scripts/wait-for-api.js');
  const child = spawn(process.execPath, [waitPath], {
    stdio: 'inherit',
    cwd: appDir,
    env: process.env,
  });
  child.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
  child.on('exit', (code) => {
    if (code !== 0) process.exit(code);
    runNext();
  });
}
