# EYWA Platform - Quick Start Guide (Windows)

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **pnpm** - Install globally:
   ```powershell
   npm install -g pnpm
   ```
3. **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/windows/)
4. **Git** - [Download](https://git-scm.com/download/win)

## Setup Steps

### 1. Clone the Repository
```powershell
# Replace YOUR_USERNAME with your GitHub username or organization
git clone https://github.com/YOUR_USERNAME/eywa-platform.git
cd eywa-platform
```

### 2. Install Dependencies
```powershell
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:
```powershell
copy .env.example .env
```

Edit `.env` and configure at minimum:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/eywa?schema=public"
DIRECT_DATABASE_URL="postgresql://username:password@localhost:5432/eywa?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server Port
PORT=4000
```

**To generate a secure JWT secret:**
```powershell
# Using PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 4. Set Up the Database

First, create the database in PostgreSQL:
```sql
CREATE DATABASE eywa;
```

Then run Prisma migrations:
```powershell
pnpm db:push
```

Or if you want to use migrations:
```powershell
pnpm db:migrate
```

### 5. Start the Development Server

Start the API server:
```powershell
pnpm dev:api
```

The API will be available at:
- **API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/api/health
- **Auth Info**: http://localhost:4000/api/auth

## Testing the API

### Using Swagger UI (Recommended)
1. Open http://localhost:4000/api/docs in your browser
2. Find the `/api/auth/register` endpoint
3. Click "Try it out"
4. Fill in the request body:
```json
{
  "email": "test@example.com",
  "password": "securePassword123",
  "name": "Test User"
}
```
5. Click "Execute"

### Using PowerShell

**Register a new user:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "test@example.com"
    password = "securePassword123"
    name = "Test User"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" `
                              -Method POST `
                              -Headers $headers `
                              -Body $body

Write-Output $response
```

**Login:**
```powershell
$body = @{
    email = "test@example.com"
    password = "securePassword123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
                              -Method POST `
                              -Headers $headers `
                              -Body $body

$token = $response.access_token
Write-Output "Token: $token"
```

**Get user profile (authenticated):**
```powershell
$authHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$profile = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/me" `
                             -Method GET `
                             -Headers $authHeaders

Write-Output $profile
```

## Common Issues & Solutions

### Issue: "Error: Environment variable not found: DATABASE_URL"
**Solution**: Make sure you have created a `.env` file in the root directory with the `DATABASE_URL` variable set.

### Issue: "Cannot connect to database"
**Solution**: 
1. Verify PostgreSQL is running
2. Check the database credentials in `.env`
3. Ensure the database exists

### Issue: "404 when accessing /api/auth/register in browser"
**Solution**: This is expected! Read the [Auth API Usage Guide](./AUTH_API_USAGE.md) for details. The `/register` and `/login` endpoints require POST requests, not GET (which browsers use when you type a URL).

### Issue: Prisma Client errors
**Solution**: Regenerate the Prisma Client:
```powershell
pnpm db:generate
```

## Development Workflow

1. **Start the API server**: `pnpm dev:api`
2. **Start the web app** (in another terminal): `pnpm dev:web`
3. **Run database migrations**: `pnpm db:migrate`
4. **View database**: `pnpm --filter @eywa/database studio`

## Project Structure

```
eywa-platform/
├── apps/
│   ├── api/          # NestJS API server
│   ├── web/          # Next.js frontend
│   └── desktop/      # Electron desktop app
├── packages/
│   ├── database/     # Prisma schema and client
│   └── shared/       # Shared types and utilities
└── docs/             # Documentation
```

## Additional Resources

- [API Documentation](http://localhost:4000/api/docs) (when server is running)
- [Auth API Usage Guide](./AUTH_API_USAGE.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)

## Need Help?

If you encounter issues not covered here, please:
1. Check the [AUTH_API_USAGE.md](./AUTH_API_USAGE.md) guide
2. Review the server logs for error messages
3. Open an issue on GitHub with detailed information
