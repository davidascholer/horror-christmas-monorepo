# Task 2.3 - Quick Start

## The Fastest Way

```bash
cd server
./setup-task-2.3.sh
```

✨ This does everything automatically!

---

## Manual Method

```bash
# 1. Start database
./start-db.sh

# 2. Test connection
npm run db:test

# 3. Run migration (enter "init" when prompted)
npm run prisma:migrate

# 4. Run tests
npm test
```

---

## What You'll See

When successful, you should see:

```
✓ Schema Constraints (8 tests)
✓ Optional Relationships (6 tests)
✓ Ordering and Sort Order (4 tests)
✓ Price Precision (5 tests)
✓ Status Values and Enums (4 tests)
✓ Cascade and Set Null Behavior (5 tests)
✓ Timestamps (2 tests)
✓ Directed Relationships (2 tests)

Test Files  1 passed (1)
Tests  36 passed (36)
```

---

## Troubleshooting

**Docker not running?**
```bash
# Start Docker Desktop application
```

**Connection refused?**
```bash
docker start horror-christmas-postgres
```

**Need to reset?**
```bash
docker stop horror-christmas-postgres
docker rm horror-christmas-postgres
./setup-task-2.3.sh
```

---

## Useful Commands

```bash
# View database in GUI
npm run prisma:studio

# Run tests in watch mode
npm run test:watch

# Check container status
docker ps | grep horror-christmas-postgres

# View logs
docker logs horror-christmas-postgres
```

---

## Files Created by This Task

- ✅ `prisma/migrations/TIMESTAMP_init/migration.sql` - Database schema
- ✅ 20+ database tables (Collection, Movie, Character, Product, etc.)
- ✅ Prisma Client with TypeScript types

---

## Next Step

After all tests pass:

**Proceed to Task 2.4:** Domain/API serialization tests

---

## Need Help?

See detailed documentation:
- `DATABASE_SETUP.md` - Database installation guide
- `MIGRATION_GUIDE.md` - Migration instructions
- `TASK-2.3-README.md` - Complete task documentation
- `../TASK-2.3-SUMMARY.md` - Task summary
