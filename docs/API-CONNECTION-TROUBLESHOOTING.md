# API Connection Troubleshooting

When the web app shows **"Cannot connect to API server"** (red status on login/register), use this doc. For **full project setup** (first-time install, Docker, .env, DB), see [GETTING-STARTED.md](./GETTING-STARTED.md).

## Quick checklist

1. **Docker** — `docker compose up -d` and `docker compose ps` (postgres, redis, minio running).
2. **Env** — `.env` in root and `packages/database/.env` (see [GETTING-STARTED.md](./GETTING-STARTED.md#4-configure-environment)).
3. **DB** — `pnpm db:generate` and `pnpm db:push`.
4. **API** — `pnpm dev:api` (or `pnpm dev` for API + web). API runs at `http://localhost:4000`.
5. **Web** — `pnpm dev:web` if not using `pnpm dev`. Web at `http://localhost:3000`.

## Verify connection

1. Open `http://localhost:3000/auth/login` in your browser
2. Look for the API status indicator:
   - ✅ **Green** = "✓ Connected to API server" - Ready to use!
   - ⏳ **Blue** = "Checking API server status..." - Wait a moment
   - ❌ **Red** = "Cannot connect to API server" - Follow the instructions shown

## Common Issues

### Issue: "Cannot connect to API server"

**Cause**: API server is not running or not accessible.

**Solution**:
1. Check if API is running: `curl http://localhost:4000/api/health`
2. If not running, start it: `pnpm dev:api`
3. Check for error messages in the API console
4. Verify port 4000 is not in use by another process

### Issue: "Connection timeout"

**Cause**: API is slow to respond or network issues.

**Solution**:
1. Check Docker containers are healthy: `docker compose ps`
2. Restart Docker services: `docker compose restart`
3. Check your firewall isn't blocking localhost connections
4. Try using `127.0.0.1` instead of `localhost` in your browser

### Issue: "CORS errors in browser console"

**Cause**: Web app is running on a different origin than expected.

**Solution**:
1. Verify web app is on port 3000: `http://localhost:3000`
2. Check `CORS_ORIGIN` in `.env` matches your web app URL
3. Restart the API server after changing `.env`

### Issue: "Database connection failed"

**Cause**: PostgreSQL is not running or credentials are wrong.

**Solution**:
1. Verify PostgreSQL is running: `docker compose ps nota-postgres`
2. Check `DATABASE_URL` in `.env` is correct
3. Ensure database exists: The `pnpm db:push` command should create it

## Visual Indicators

The new **ApiStatus** component on auth pages provides real-time feedback:

### When API is Healthy (Green)
```
✓ Connected to API server
```
You're ready to register/login!

### When API is Down (Red)
```
⚠️ Cannot connect to API server

The API server at http://localhost:4000 is not responding.

Please ensure the API server is running:
# Start the API server:
pnpm dev:api

# Or start all services:
pnpm dev
```

Follow the instructions shown to start the server.

## Technical Details

### How API Detection Works

1. **Health Check Endpoint**: `/api/health`
   - Simple GET request that returns `{ status: "ok", timestamp: "...", uptime: 123 }`
   - No authentication required
   - Bypasses rate limiting

2. **Detection Process**:
   - Tries multiple URLs: `localhost:4000`, `localhost:3000`, `127.0.0.1:4000`, `127.0.0.1:3000`
   - Uses 2-second timeout per check
   - Handles CORS properly with `mode: 'cors'`
   - Logs errors in development mode for debugging

3. **CORS Configuration**:
   - API allows requests from `http://localhost:3000` by default
   - Can be customized via `CORS_ORIGIN` environment variable
   - Includes proper headers for preflight requests

### Why POST Endpoints Don't Work in Browser Address Bar

Authentication endpoints (`/api/auth/login` and `/api/auth/register`) use POST requests for security:

- **POST**: Data in request body (secure, encrypted in transit)
- **GET**: Data in URL (visible in history, logs, not secure)

When you type a URL in the browser's address bar, it sends a GET request, which won't work for authentication. **Always use the web application interface** at `http://localhost:3000`.

## Need More Help?

1. Check the main [GETTING-STARTED.md](./GETTING-STARTED.md) guide
2. Review [API.md](./API.md) for API documentation
3. Check [SECURITY.md](./SECURITY.md) for security best practices
4. Open an issue on GitHub with:
   - Error messages from console
   - Output of `docker compose ps`
   - Output of `curl http://localhost:4000/api/health`
