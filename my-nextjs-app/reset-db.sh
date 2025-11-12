#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}🗄️  Database Reset${NC}"
echo "============================================="
echo ""
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  - Stop the database"
echo "  - Delete all data"
echo "  - Recreate the database"
echo "  - Reapply the schema"
echo ""

read -p "Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo -e "${BLUE}📦 Stopping PostgreSQL...${NC}"
docker-compose down

echo -e "${BLUE}🗑️  Removing volumes...${NC}"
docker volume rm $(docker volume ls -q | grep postgres) 2>/dev/null || echo "Volumes already removed"

echo -e "${BLUE}🚀 Restarting PostgreSQL...${NC}"
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for database...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database ready${NC}"
        break
    fi
    sleep 1
done

echo -e "${BLUE}🗄️  Applying schema...${NC}"
npm run db:push

echo ""
echo -e "${GREEN}✨ Database reset complete!${NC}"
echo ""
echo "You can now:"
echo "  - Create a new account at /register"
echo "  - View the DB with: npm run db:studio"
echo ""
