#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🧹 CLEANUP - Complete Reset${NC}"
echo "============================================="
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete:${NC}"
echo "  - Docker containers & volumes (all database data)"
echo "  - node_modules"
echo "  - package-lock.json"
echo "  - .next (build)"
echo "  - Database migrations"
echo ""
echo -e "${YELLOW}Your source code will be preserved.${NC}"
echo ""

read -p "Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${BLUE}Starting cleanup...${NC}"
echo ""

echo -e "${BLUE}🐳 Stopping Docker containers...${NC}"
if [ -f "docker-compose.yml" ]; then
    docker-compose down -v --remove-orphans 2>/dev/null || echo "No containers to stop"
    echo -e "${GREEN}✅ Docker cleaned${NC}"
fi

echo -e "${BLUE}📦 Removing node_modules...${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✅ node_modules removed${NC}"
fi

echo -e "${BLUE}🔒 Removing package-lock.json...${NC}"
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✅ package-lock.json removed${NC}"
fi

echo -e "${BLUE}🏗️  Removing .next...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✅ .next removed${NC}"
fi

if [ -d ".next/dev" ]; then
    rm -rf .next/dev
    echo -e "${GREEN}✅ .next/dev removed${NC}"
fi

echo -e "${BLUE}🗄️  Removing migrations...${NC}"
if [ -d "lib/db/migrations" ]; then
    rm -rf lib/db/migrations/*
    echo -e "${GREEN}✅ Migrations removed${NC}"
fi

if [ -d ".drizzle" ]; then
    rm -rf .drizzle
    echo -e "${GREEN}✅ Drizzle cache removed${NC}"
fi

echo ""
read -p "Remove .env.local? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    if [ -f ".env.local" ]; then
        rm -f .env.local
        echo -e "${GREEN}✅ .env.local removed${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔍 Checking Docker volumes...${NC}"
VOLUMES=$(docker volume ls -q 2>/dev/null | grep -E "postgres|pgadmin" || true)
if [ ! -z "$VOLUMES" ]; then
    echo "Volumes found:"
    echo "$VOLUMES"
    read -p "Remove them? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "$VOLUMES" | xargs docker volume rm 2>/dev/null || true
        echo -e "${GREEN}✅ Volumes removed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Cleanup complete!${NC}"
echo ""
echo "To start fresh:"
echo "  1. npm install"
echo "  2. cp .env.example .env.local"
echo "  3. Edit .env.local"
echo "  4. ./start-dev.sh"
echo ""
