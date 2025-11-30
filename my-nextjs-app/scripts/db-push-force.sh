#!/bin/bash
# Auto-confirm drizzle-kit push
echo "Yes, I want to remove 5 columns" | npx dotenv -e .env.local -- drizzle-kit push --force
