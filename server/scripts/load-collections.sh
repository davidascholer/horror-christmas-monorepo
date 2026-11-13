#!/bin/bash

# Load Collections Script
# Executes the collection seed file and verifies the results

set -e

echo "🎄 Loading Launch Collections"
echo "=============================="
echo ""

# Check if database is running
echo "Checking database connection..."
if ! npm run test:db > /dev/null 2>&1; then
  echo "❌ Database is not running or not accessible"
  echo "Run ./start-db.sh first to start the database"
  exit 1
fi

echo "✓ Database is accessible"
echo ""

# Run the seed script
echo "Running collection seed..."
npx tsx prisma/seed-collections.ts

echo ""
echo "=============================="
echo "✅ Collections loaded successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify collections with: npm run verify:collections"
echo "  2. Continue to Task 3.3 to add movies"
echo ""
