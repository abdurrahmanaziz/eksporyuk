#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

console.log('🧪 Testing Broadcast Models\n')
console.log('='.repeat(60))

// Test 1: Check if models exist
console.log('\n✅ TEST 1: Model Existence')
console.log('-'.repeat(60))

if (prisma.broadcastCampaign) {
  console.log('✅ BroadcastCampaign model exists')
} else {
  console.log('❌ BroadcastCampaign model NOT found')
}

if (prisma.broadcastLog) {
  console.log('✅ BroadcastLog model exists')
} else {
  console.log('❌ BroadcastLog model NOT found')
}

// Test 2: Check database schema
console.log('\n✅ TEST 2: Database Tables')
console.log('-'.repeat(60))

prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Broadcast%'`
  .then(tables => {
    console.log('Found tables:', tables)
    if (tables.length >= 2) {
      console.log('✅ Broadcast tables exist in database')
    } else {
      console.log('⚠️  Broadcast tables may be missing')
    }
  })
  .catch(err => {
    console.error('❌ Error checking tables:', err.message)
  })
  .finally(() => {
    prisma.$disconnect()
  })

console.log('\n' + '='.repeat(60))
console.log('📋 TEST COMPLETE')
console.log('='.repeat(60))
