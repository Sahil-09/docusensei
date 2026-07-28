#!/bin/sh
set -e

# Run migrations if DATABASE_URL is defined
if [ -n "$DATABASE_URL" ]; then
  echo "🚀 Running Prisma migrations..."
  echo $DATABASE_URL
  # Run from the apps/backend directory so prisma can find prisma.config.mjs and resolve paths correctly
  cd /app/apps/backend
  # Run the pre-installed prisma executable directly to guarantee offline & fast execution
  /app/node_modules/.bin/prisma migrate deploy
  cd /app
fi

echo "🟢 Starting NestJS backend server..."
exec node /app/dist/apps/backend/main.js
