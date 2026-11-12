#!/bin/bash
# Script to start the PostgreSQL Docker container for development

set -e

echo "🐘 Starting PostgreSQL container for Horror Christmas..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q '^horror-christmas-postgres$'; then
  echo "📦 Container already exists. Starting it..."
  docker start horror-christmas-postgres
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
if docker exec horror-christmas-postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ PostgreSQL is ready!"
  echo ""
  echo "Database connection details:"
  echo "  Host: localhost"
  echo "  Port: 5432"
  echo "  Database: horror_christmas_dev"
  echo "  User: postgres"
  echo "  Password: postgres"
  echo ""
  echo "Next steps:"
  echo "  1. Run migrations: npm run prisma:migrate"
  echo "  2. Run tests: npm test"
else
  echo "⚠️  PostgreSQL started but may not be ready yet. Wait a few seconds and try again."
fi
