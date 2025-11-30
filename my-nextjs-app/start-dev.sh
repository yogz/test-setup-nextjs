#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting development environment...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    exit 1
fi

#echo -e "${BLUE}📦 Starting PostgreSQL...${NC}"
#docker compose up -d

#echo -e "${BLUE}⏳ Waiting for database...${NC}"
#ATTEMPTS=0
#MAX_ATTEMPTS=30
#until docker compose exec -T postgres pg_isready -U postgres -d myapp >/dev/null 2>&1; do
#    ATTEMPTS=$((ATTEMPTS + 1))
#    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
#        echo -e "${RED}❌ Database failed to start${NC}"
#        docker compose logs postgres
#        exit 1
#    fi
#    echo -n "."
#    sleep 1
#done
#echo ""
#echo -e "${GREEN}✅ Database ready${NC}"

echo -e "${BLUE}🗄️  Setting up database schema...${NC}"
npm run db:push

echo -e "${GREEN}✨ Starting Next.js 16...${NC}"
npm run dev
