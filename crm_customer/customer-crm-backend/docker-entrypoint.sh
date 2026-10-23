#!/bin/sh
set -e

echo "Sync database schema..."
npx prisma db push --skip-generate

echo "Seed default users (safe to re-run)..."
node prisma/seed-runtime.js

echo "Start API..."
exec node dist/src/main.js
