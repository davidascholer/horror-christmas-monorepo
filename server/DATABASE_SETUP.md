# PostgreSQL Database Setup Guide

This guide covers setting up a PostgreSQL database for the Horror Christmas server application.

## Prerequisites

You need PostgreSQL 14 or higher installed and running.

## Option 1: Docker (Recommended for Development)

Docker provides an isolated, disposable database that's perfect for development and testing.

### Setup

1. Install Docker Desktop for macOS from https://www.docker.com/products/docker-desktop

2. Start a PostgreSQL container:

```bash
docker run --name horror-christmas-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=horror_christmas_dev \
  -p 5432:5432 \
  -d postgres:16-alpine
```

3. Verify the container is running:

```bash
docker ps
```

### Container Management

- **Stop the database:**
  ```bash
  docker stop horror-christmas-postgres
  ```

- **Start the database again:**
  ```bash
  docker start horror-christmas-postgres
  ```

- **Remove the database (destroys all data):**
  ```bash
  docker rm -f horror-christmas-postgres
  ```

- **View logs:**
  ```bash
  docker logs horror-christmas-postgres
  ```

- **Connect with psql:**
  ```bash
  docker exec -it horror-christmas-postgres psql -U postgres -d horror_christmas_dev
  ```

## Option 2: Manual PostgreSQL Installation

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Create the database:**
```bash
createdb horror_christmas_dev
```

**Or using psql:**
```bash
psql postgres
CREATE DATABASE horror_christmas_dev;
\q
```

### Configure Connection

The default `.env` file uses these connection details:
- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** postgres
- **Database:** horror_christmas_dev

Update `server/.env` if your setup differs:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/horror_christmas_dev"
```

## Running Migrations

Once PostgreSQL is running and configured:

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Generate the Prisma migration:
   ```bash
   npm run prisma:migrate
   ```

3. When prompted for a migration name, use something descriptive like:
   ```
   init
   ```

This will:
- Create the migration SQL file in `prisma/migrations/`
- Apply the migration to your database
- Generate the Prisma Client

## Verifying the Setup

### Check Database Connection

```bash
# Using Docker
docker exec -it horror-christmas-postgres psql -U postgres -d horror_christmas_dev -c '\dt'

# Using local PostgreSQL
psql -U postgres -d horror_christmas_dev -c '\dt'
```

You should see a list of all the created tables.

### Using Prisma Studio

Prisma Studio provides a GUI for browsing and editing your database:

```bash
npm run prisma:studio
```

This opens http://localhost:5555 in your browser.

## Troubleshooting

### Connection Refused

If you see "ECONNREFUSED" errors:

1. **Docker:** Ensure the container is running (`docker ps`)
2. **Manual:** Ensure PostgreSQL service is running
   - macOS: `brew services list`

### Port Already in Use

If port 5432 is already in use:

1. **Docker:** Stop the conflicting service or use a different port:
   ```bash
   docker run --name horror-christmas-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=horror_christmas_dev \
     -p 5433:5432 \
     -d postgres:16-alpine
   ```
   
   Then update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/horror_christmas_dev"
   ```

### Authentication Failed

If you see authentication errors:

1. Verify your username and password in `.env`
2. For Docker, check the environment variables when creating the container
3. For manual installation, you may need to configure `pg_hba.conf`

## Test Database

For running tests, you may want a separate test database:

```bash
# Docker
docker exec -it horror-christmas-postgres psql -U postgres -c "CREATE DATABASE horror_christmas_test;"

# Manual
createdb horror_christmas_test
```

Create a `.env.test` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horror_christmas_test"
```

## Production Considerations

This setup is for **development and testing only**. For production:

- Use a managed PostgreSQL service (AWS RDS, Azure Database, Google Cloud SQL, or Heroku Postgres)
- Use strong, unique passwords
- Enable SSL/TLS connections
- Configure connection pooling
- Set up regular backups
- Monitor database performance
- Apply security best practices

Do not commit `.env` files to version control. The `.gitignore` is already configured to exclude them.
