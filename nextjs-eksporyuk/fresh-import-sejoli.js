#!/usr/bin/env node
/**
 * FRESH IMPORT FROM SEJOLI
 * Download terbaru dari Sejoli production database
 * 
 * Steps:
 * 1. Backup database current (safety)
 * 2. Export fresh data dari Sejoli
 * 3. Import ke Neon database
 * 4. Verify data integrity
 */

const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')

const execAsync = promisify(exec)

const SCRIPTS_DIR = path.join(__dirname, 'scripts/sejoli-migration')
const EXPORTS_DIR = path.join(SCRIPTS_DIR, 'exports')

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`)
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: SCRIPTS_DIR,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    })
    
    if (stderr && !stderr.includes('Warning')) {
      console.log('⚠️  Stderr:', stderr)
    }
    
    console.log('✅ Done!')
    return stdout
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`)
    throw error
  }
}

async function freshImportFromSejoli() {
  console.log('🚀 FRESH IMPORT FROM SEJOLI')
  console.log('=' .repeat(50))
  console.log(`Started: ${new Date().toLocaleString('id-ID')}\n`)
  
  try {
    // Step 1: Backup current database
    console.log('📦 Step 1: Backup current database for safety')
    await runCommand(
      'npx tsx ../test-backup-system.mjs',
      'Creating safety backup'
    )
    
    // Step 2: Export fresh data from Sejoli
    console.log('\n📥 Step 2: Export fresh data from Sejoli')
    
    console.log('\n2a. Exporting users...')
    await runCommand(
      'expect 41-download-users.exp',
      'Download user data from Sejoli'
    )
    
    console.log('\n2b. Exporting transactions...')
    await runCommand(
      'expect 30-export-orders.exp',
      'Download transaction/order data'
    )
    
    console.log('\n2c. Exporting commissions...')
    await runCommand(
      'expect 40-download-commissions.exp',
      'Download commission data'
    )
    
    console.log('\n2d. Exporting products...')
    await runCommand(
      'expect 28-export-products.exp',
      'Download product data'
    )
    
    // Step 3: Convert TSV to JSON
    console.log('\n📝 Step 3: Convert exported data to JSON')
    await runCommand(
      'node 04-convert-tsv-to-json.js',
      'Converting TSV files to JSON'
    )
    
    // Step 4: Import to database
    console.log('\n💾 Step 4: Import to Neon database')
    await runCommand(
      'node 42-import-transactions-commissions.js',
      'Importing transactions and commissions'
    )
    
    // Step 5: Setup memberships
    console.log('\n🎫 Step 5: Setup membership access')
    await runCommand(
      'node 43-setup-memberships-access.js',
      'Setting up user memberships'
    )
    
    // Step 6: Verify import
    console.log('\n🔍 Step 6: Verify imported data')
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const counts = {
      users: await prisma.user.count(),
      transactions: await prisma.transaction.count(),
      affiliateProfiles: await prisma.affiliateProfile.count(),
      affiliateCommissions: await prisma.affiliateCommission.count(),
      userMemberships: await prisma.userMembership.count(),
      wallets: await prisma.wallet.count(),
    }
    
    await prisma.$disconnect()
    
    console.log('\n✅ IMPORT COMPLETED SUCCESSFULLY!')
    console.log('\n📊 Database Status:')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count.toLocaleString()}`)
    })
    
    console.log(`\n🎉 Fresh import completed at ${new Date().toLocaleString('id-ID')}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Verify data in admin dashboard')
    console.log('   2. Test login with existing users')
    console.log('   3. Check affiliate commissions')
    console.log('   4. Deploy to production: git add . && git commit && git push')
    
  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error.message)
    console.log('\n🔄 You can restore from backup if needed:')
    console.log('   npx tsx restore-from-backup.mjs latest-backup.json')
    process.exit(1)
  }
}

// Run import
freshImportFromSejoli()
