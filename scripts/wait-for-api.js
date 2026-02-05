#!/usr/bin/env node

/**
 * Wait for API server to be healthy before proceeding
 * This ensures the web app doesn't start before the API is ready
 */

const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const RETRY_INTERVAL = 1000; // 1 second between retries
const MAX_WAIT_TIME = 60000; // Maximum wait time in milliseconds (60 seconds)
const MAX_ATTEMPTS = Math.floor(MAX_WAIT_TIME / RETRY_INTERVAL); // 60 attempts
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds timeout for each health check

function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/health', API_URL);
    
    const req = http.get(url, { timeout: HEALTH_CHECK_TIMEOUT }, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ API server is healthy and ready!');
        resolve(true);
      } else {
        reject(new Error(`Health check failed with status ${res.statusCode}`));
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

async function waitForApi() {
  console.log('⏳ Waiting for API server to be ready...');
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await checkHealth();
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(`❌ API server did not become healthy within ${MAX_WAIT_TIME / 1000} seconds`);
        console.error('   Please ensure the API server is running:');
        console.error('   - Check docker-compose services: docker compose ps');
        console.error('   - Check API logs: cd apps/api && pnpm dev');
        process.exit(1);
      }
      
      // Show progress every 5 seconds
      if (attempt % 5 === 0) {
        console.log(`   Still waiting... (${attempt}/${MAX_ATTEMPTS}s)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
}

waitForApi();
