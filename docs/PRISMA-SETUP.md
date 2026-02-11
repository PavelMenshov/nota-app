# Prisma Setup and Type Generation Guide

## The Problem

When starting the Nota project, you may encounter TypeScript errors like:
```
Property 'user' does not exist on type 'PrismaService'
Property 'workspace' does not exist on type 'PrismaService'
```

This happens because **Prisma Client types are not automatically generated** after installing dependencies or pulling schema changes.

## The Solution

We've implemented **automatic Prisma Client generation** at multiple levels:

### 1. Automatic Generation on Install (Root Level)

The root `package.json` now includes a `postinstall` script that automatically generates Prisma Client after running `pnpm install`:

```json
{
  "scripts": {
    "postinstall": "pnpm db:generate"
  }
}
```

### 2. Automatic Generation in Database Package

The `packages/database/package.json` also includes a `postinstall` hook:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 3. Pre-build Generation in API

The `apps/api/package.json` includes a `prebuild` script to ensure Prisma is generated before building:

```json
{
  "scripts": {
    "prebuild": "cd ../../packages/database && pnpm generate"
  }
}
```

## Quick Start Guide

### First Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd eywa-platform

# 2. Run the automated setup script
./scripts/setup.sh

# OR manually:
# Install dependencies (triggers postinstall → generates Prisma)
pnpm install

# Start database
docker compose up -d eywa-postgres

# Push schema to database
pnpm db:push

# Start development servers
pnpm dev
```

### After Pulling Schema Changes

If someone updates the Prisma schema:

```bash
# Regenerate Prisma Client
pnpm db:generate

# Push new schema to database
pnpm db:push
```

### Fixing Type Errors

If you see Prisma-related type errors:

```bash
# Step 1: Regenerate Prisma Client
pnpm db:generate

# Step 2: If using TypeScript in watch mode, restart it
# The types should now be available

# Step 3: If errors persist, clean and reinstall
rm -rf node_modules
pnpm install
```

## Manual Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma Client types |
| `pnpm db:push` | Push schema to database (dev) |
| `pnpm db:migrate` | Create and apply migrations (prod) |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `./scripts/setup.sh` | Run full setup verification |

## How It Works

1. **Prisma Schema** (`packages/database/prisma/schema.prisma`) defines your database models
2. **Prisma Generate** creates TypeScript types and the Prisma Client in `node_modules/@prisma/client`
3. **Database Package** (`packages/database`) exports these types for use across the monorepo
4. **API & Web** import from `@eywa/database` which includes all Prisma types

## Troubleshooting

### Issue: "Property 'xxx' does not exist on type 'PrismaService'"

**Solution:**
```bash
pnpm db:generate
```

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
pnpm install
# postinstall hook will run automatically
```

### Issue: Database connection errors

**Solution:**
```bash
# Ensure database is running
docker compose up -d eywa-postgres

# Verify connection in .env
# Check DATABASE_URL and DIRECT_DATABASE_URL

# Push schema
pnpm db:push
```

### Issue: Types are still not working after generate

**Solution:**
```bash
# Clean install
rm -rf node_modules .pnpm-store
pnpm install

# Regenerate
pnpm db:generate

# Restart your IDE/TypeScript server
```

## Best Practices

1. **Always run `pnpm db:generate`** after:
   - Pulling schema changes from git
   - Modifying `schema.prisma`
   - Switching branches with schema differences

2. **Use migrations in production**:
   ```bash
   pnpm db:migrate
   ```

3. **Use push in development**:
   ```bash
   pnpm db:push
   ```

4. **Keep database package .env in sync**:
   - Root `.env` is the source of truth
   - Copy to `packages/database/.env` when it changes
   - Or use a symlink: `ln -s ../../.env packages/database/.env`

## Architecture

```
eywa-platform/
├── packages/
│   └── database/           # Prisma package
│       ├── prisma/
│       │   └── schema.prisma   # Schema definition
│       ├── src/
│       │   └── index.ts        # Exports Prisma Client
│       └── package.json        # postinstall: prisma generate
├── apps/
│   ├── api/                # Uses @eywa/database
│   └── web/                # Uses @eywa/database
├── package.json            # postinstall: pnpm db:generate
└── scripts/
    └── setup.sh            # Automated setup script
```

## CI/CD Integration

For CI/CD pipelines, ensure you:

1. Install dependencies: `pnpm install` (triggers postinstall)
2. Wait for Prisma generation to complete
3. Build: `pnpm build`

Example GitHub Actions:
```yaml
- name: Install dependencies
  run: pnpm install

- name: Generate Prisma (explicit)
  run: pnpm db:generate

- name: Build
  run: pnpm build
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Monorepo Setup](https://www.prisma.io/docs/guides/other/monorepos)
