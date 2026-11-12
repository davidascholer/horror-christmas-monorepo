#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Tests the DATABASE_URL connection before running migrations.
 * Usage: node test-db-connection.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');

  try {
    // Try to connect
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log('');
    console.log('PostgreSQL version:', result[0].version);
    console.log('');
    console.log('🎉 Ready to run migrations!');
    console.log('   Run: npm run prisma:migrate');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.log('Troubleshooting:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('   Docker: docker ps | grep horror-christmas-postgres');
    console.log('   Or run: ./start-db.sh');
    console.log('');
    console.log('2. Check DATABASE_URL in .env file');
    console.log('   Should be: postgresql://postgres:postgres@localhost:5432/horror_christmas_dev');
    console.log('');
    console.log('3. Verify the database exists');
    console.log('   Docker: docker exec -it horror-christmas-postgres psql -U postgres -c "CREATE DATABASE horror_christmas_dev;"');
    console.log('');
    console.log('See DATABASE_SETUP.md for detailed instructions.');
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
