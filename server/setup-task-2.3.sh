#!/bin/bash
# Complete setup script for Task 2.3
# This script guides you through the entire setup process

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Task 2.3: Schema Migration & Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to server directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Check Docker
echo "Step 1: Checking Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed."
  echo "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker daemon is not running."
  echo "   Please start Docker Desktop and try again."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Step 2: Start PostgreSQL
echo "Step 2: Starting PostgreSQL container..."
if docker ps -a --format '{{.Names}}' | grep -q '^horror-christmas-postgres$'; then
  echo "📦 Container exists. Ensuring it's running..."
  docker start horror-christmas-postgres > /dev/null 2>&1 || true
else
  echo "📦 Creating new PostgreSQL container..."
  docker run --name horror-christmas-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=horror_christmas_dev \
    -p 5432:5432 \
    -d postgres:16-alpine
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Test connection
for i in {1..10}; do
  if docker exec horror-christmas-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "⚠️  PostgreSQL is taking longer than expected to start."
    echo "   You can check logs with: docker logs horror-christmas-postgres"
    echo "   Then run: npm run prisma:migrate"
    exit 1
  fi
  sleep 2
done

echo ""

# Step 3: Test connection
echo "Step 3: Testing database connection..."
if npm run db:test --silent; then
  echo ""
else
  echo "⚠️  Connection test had issues, but continuing..."
  echo ""
fi

# Step 4: Generate and apply migration
echo "Step 4: Generating and applying migration..."
echo ""
echo "⚠️  When prompted for migration name, enter: init"
echo ""
read -p "Press Enter to continue with migration..."
echo ""

npm run prisma:migrate

echo ""
echo "✅ Migration applied successfully!"
echo ""

# Step 5: Verify tables
echo "Step 5: Verifying database tables..."
TABLE_COUNT=$(docker exec horror-christmas-postgres psql -U postgres -d horror_christmas_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 15 ]; then
  echo "✅ Database contains $TABLE_COUNT tables"
else
  echo "⚠️  Table count seems low ($TABLE_COUNT). Expected 20+"
fi

echo ""

# Step 6: Run tests
echo "Step 6: Running schema validation tests..."
echo ""
npm test

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Task 2.3 Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  • PostgreSQL container running"
echo "  • Migration applied to horror_christmas_dev"
echo "  • All schema validation tests passed"
echo ""
echo "Useful commands:"
echo "  • View database: npm run prisma:studio"
echo "  • Run tests: npm test"
echo "  • Stop database: docker stop horror-christmas-postgres"
echo "  • Start database: docker start horror-christmas-postgres"
echo ""
echo "Next steps:"
echo "  1. Review test results above"
echo "  2. Commit migration files: git add prisma/migrations"
echo "  3. Proceed to Task 2.4 (domain/API serialization tests)"
echo ""
echo "Documentation:"
echo "  • Full setup guide: DATABASE_SETUP.md"
echo "  • Migration guide: MIGRATION_GUIDE.md"
echo "  • Task details: TASK-2.3-README.md"
echo ""
