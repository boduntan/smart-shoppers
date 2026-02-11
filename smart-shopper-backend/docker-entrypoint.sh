#!/bin/bash
set -e

echo "🚀 Starting Backend Container..."

# Wait for PostgreSQL to be ready (max 60 seconds)
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if pg_isready -h postgres -p 5432 -U postgres 2>/dev/null; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "PostgreSQL not ready ($i/30) - sleeping 2s"
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "⚠️ PostgreSQL did not become ready; starting app anyway (health will show 503)."
  fi
done

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations, then push schema to create any missing tables (e.g. chat_messages)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || true
echo "🗄️ Ensuring schema is in sync (creates missing tables)..."
npx prisma db push || true

echo "🚀 Starting application..."
exec npm run dev
