#!/usr/bin/env node

/**
 * Wait for the web app server to be ready before proceeding
 * This ensures the desktop app doesn't launch before the web server is available
 */

const http = require('http');

const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3001';
const RETRY_INTERVAL = 1000; // 1 second between retries
const MAX_WAIT_TIME = 120000; // Maximum wait time in milliseconds (120 seconds)
const MAX_ATTEMPTS = Math.floor(MAX_WAIT_TIME / RETRY_INTERVAL);
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds timeout for each check

function checkReady() {
  return new Promise((resolve, reject) => {
    const url = new URL(WEB_APP_URL);

    const req = http.get(url, { timeout: HEALTH_CHECK_TIMEOUT }, (res) => {
      // Any response (even redirects) means the server is up
      if (res.statusCode >= 200 && res.statusCode < 500) {
        console.log('✅ Web app server is ready!');
        resolve(true);
      } else {
        reject(new Error(`Web app returned status ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

async function waitForWeb() {
  console.log(`⏳ Waiting for web app server at ${WEB_APP_URL} ...`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await checkReady();
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(`❌ Web app server did not become ready within ${MAX_WAIT_TIME / 1000} seconds`);
        console.error('   Please ensure the web server is running:');
        console.error('   - Start the web app: pnpm dev:web');
        console.error('   - Or start all services: pnpm dev');
        process.exit(1);
      }

      // Show progress every 5 seconds
      if (attempt % 5 === 0) {
        console.log(`   Still waiting... (${attempt}s / ${MAX_WAIT_TIME / 1000}s)`);
      }

      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
}

waitForWeb();
