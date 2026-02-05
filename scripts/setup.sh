#!/bin/bash
# Setup verification and fix script for EYWA Platform

set -e

echo "=================================="
echo "EYWA Platform Setup & Verification"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
echo "Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Copy .env to database package
echo ""
echo "Setting up database configuration..."
if [ ! -f "packages/database/.env" ]; then
    cp .env packages/database/.env
    echo -e "${GREEN}✓ Copied .env to packages/database/${NC}"
else
    echo -e "${GREEN}✓ Database .env exists${NC}"
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Warning: Dependencies not installed. Running pnpm install...${NC}"
    pnpm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Generate Prisma Client
echo ""
echo "Generating Prisma Client..."
pnpm db:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Check if database is accessible
echo ""
echo "Checking database connection..."
if docker ps | grep -q eywa-postgres; then
    echo -e "${GREEN}✓ Database container is running${NC}"
else
    echo -e "${YELLOW}Warning: Database container not running. Starting it...${NC}"
    docker compose up -d postgres
    echo "Waiting for database to be ready..."
    sleep 10
    echo -e "${GREEN}✓ Database started${NC}"
fi

# Push database schema
echo ""
echo "Pushing database schema..."
pnpm db:push
echo -e "${GREEN}✓ Database schema is up to date${NC}"

# Verify Prisma types
echo ""
echo "Verifying Prisma types..."
if [ -d "node_modules/.pnpm/@prisma+client"*"/node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓ Prisma Client types are available${NC}"
else
    echo -e "${RED}✗ Prisma Client types not found. Regenerating...${NC}"
    pnpm db:generate
fi

echo ""
echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================="
echo ""
echo "You can now run:"
echo "  pnpm dev          - Start all services"
echo "  pnpm db:studio    - Open Prisma Studio"
echo ""
echo "Common issues and fixes:"
echo "  1. Type errors in API: Run 'pnpm db:generate'"
echo "  2. Database not found: Run 'docker compose up -d postgres && pnpm db:push'"
echo "  3. Module not found: Run 'pnpm install'"
echo ""
