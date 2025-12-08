#!/usr/bin/env node

/**
 * Test Neon PostgreSQL Database Connection
 * Run this after updating DATABASE_URL to verify connection works
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  console.log('🔍 Testing Neon PostgreSQL connection...\n')

  try {
    // Test 1: Raw query
    console.log('✓ Testing raw SQL query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('  Result:', result)

    // Test 2: Check tables
    console.log('\n✓ Checking database tables...')
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log(`  Found ${tables.length} tables`)

    // Test 3: Try to create/read a user (if User table exists)
    console.log('\n✓ Testing User model...')
    try {
      const userCount = await prisma.user.count()
      console.log(`  User count: ${userCount}`)
    } catch (e) {
      console.log('  User table not created yet (run: npx prisma db push)')
    }

    console.log('\n✅ Connection successful! Database is ready.\n')
    console.log('Next steps:')
    console.log('  1. npx prisma db push    # Create tables')
    console.log('  2. npx prisma generate   # Generate client')
    console.log('  3. npm run dev           # Start server')

  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('\nError:', error.message)
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Possible issues:')
      console.error('  - Check your internet connection')
      console.error('  - Verify DATABASE_URL in .env file')
      console.error('  - Make sure you copied the full connection string from Neon')
      console.error('  - Neon database might be auto-paused (wait 5-10 seconds and try again)')
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Possible issues:')
      console.error('  - Wrong username/password in connection string')
      console.error('  - Generate new password in Neon dashboard and update .env')
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 Possible issues:')
      console.error('  - Database name mismatch')
      console.error('  - Make sure to use the database name from Neon dashboard')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
