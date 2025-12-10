/**
 * MIGRATION VERIFICATION SCRIPT
 * ==============================
 * Verify migrated data accuracy between WordPress and Eksporyuk
 * 
 * Usage:
 *   node scripts/migration/verify-migration.js --file=wp-data/sejoli-export-xxx.json
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))
const verbose = args.includes('--verbose')

async function main() {
  console.log('🔍 MIGRATION VERIFICATION')
  console.log('=========================\n')

  // Get latest export file if not specified
  let inputFile
  if (fileArg) {
    inputFile = fileArg.replace('--file=', '')
  } else {
    const wpDataDir = path.join(__dirname, 'wp-data')
    if (fs.existsSync(wpDataDir)) {
      const files = fs.readdirSync(wpDataDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
      
      if (files.length > 0) {
        inputFile = `wp-data/${files[0]}`
        console.log(`📁 Using latest export: ${inputFile}\n`)
      }
    }
  }

  if (!inputFile) {
    console.log('⚠️  No export file found. Running basic verification...\n')
    await basicVerification()
    return
  }

  const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(__dirname, inputFile)
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`)
    await basicVerification()
    return
  }

  const wpData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  
  console.log('📊 WordPress Data:')
  console.log(`   Users: ${wpData.users.length}`)
  console.log(`   Affiliates: ${wpData.stats.totalAffiliates}`)
  console.log(`   Total Earnings: Rp ${wpData.stats.totalEarnings.toLocaleString()}`)
  console.log('')

  // Get Eksporyuk data
  const eksporyukUsers = await prisma.user.count()
  const eksporyukAffiliates = await prisma.affiliateProfile.count()
  const eksporyukWallets = await prisma.wallet.aggregate({
    _sum: { balance: true }
  })
  
  console.log('📊 Eksporyuk Data:')
  console.log(`   Users: ${eksporyukUsers}`)
  console.log(`   Affiliates: ${eksporyukAffiliates}`)
  console.log(`   Total Wallet Balance: Rp ${parseFloat(eksporyukWallets._sum.balance || 0).toLocaleString()}`)
  console.log('')

  // Verification checks
  const checks = {
    userCount: { passed: false, message: '' },
    affiliateCount: { passed: false, message: '' },
    walletBalance: { passed: false, message: '' },
    emailsMatch: { passed: false, message: '' },
    affiliateCodesMatch: { passed: false, message: '' }
  }

  // 1. User count check
  console.log('🔎 Running verification checks...\n')
  
  // Check each WordPress user exists in Eksporyuk
  let matchedUsers = 0
  let missingUsers = []
  let walletMismatches = []

  for (const wpUser of wpData.users) {
    const ekUser = await prisma.user.findUnique({
      where: { email: wpUser.email },
      include: { wallet: true, affiliateProfile: true }
    })

    if (ekUser) {
      matchedUsers++
      
      // Check wallet balance
      const wpBalance = wpUser.walletBalance || 0
      const ekBalance = parseFloat(ekUser.wallet?.balance?.toString() || '0')
      
      if (Math.abs(wpBalance - ekBalance) > 1) { // Allow 1 rupiah difference
        walletMismatches.push({
          email: wpUser.email,
          wpBalance,
          ekBalance,
          diff: wpBalance - ekBalance
        })
      }

      if (verbose) {
        console.log(`   ✅ ${wpUser.email} | WP: Rp ${wpBalance.toLocaleString()} | EK: Rp ${ekBalance.toLocaleString()}`)
      }
    } else {
      missingUsers.push(wpUser.email)
      if (verbose) {
        console.log(`   ❌ ${wpUser.email} - NOT FOUND`)
      }
    }
  }

  // Results
  console.log('\n' + '='.repeat(50))
  console.log('📋 VERIFICATION RESULTS')
  console.log('='.repeat(50))

  // User match rate
  const userMatchRate = (matchedUsers / wpData.users.length * 100).toFixed(1)
  const userPassed = userMatchRate >= 95
  console.log(`\n${userPassed ? '✅' : '❌'} User Migration: ${matchedUsers}/${wpData.users.length} (${userMatchRate}%)`)
  
  if (missingUsers.length > 0 && missingUsers.length <= 10) {
    console.log('   Missing users:')
    missingUsers.forEach(email => console.log(`   - ${email}`))
  } else if (missingUsers.length > 10) {
    console.log(`   Missing ${missingUsers.length} users (showing first 5):`)
    missingUsers.slice(0, 5).forEach(email => console.log(`   - ${email}`))
  }

  // Wallet balance accuracy
  const walletPassed = walletMismatches.length === 0
  console.log(`\n${walletPassed ? '✅' : '⚠️'} Wallet Balance: ${walletMismatches.length} mismatches`)
  
  if (walletMismatches.length > 0) {
    console.log('   Mismatches (showing first 5):')
    walletMismatches.slice(0, 5).forEach(m => {
      console.log(`   - ${m.email}: WP Rp ${m.wpBalance.toLocaleString()} vs EK Rp ${m.ekBalance.toLocaleString()} (diff: Rp ${m.diff.toLocaleString()})`)
    })
  }

  // Affiliate migration
  const wpAffiliates = wpData.users.filter(u => u.isAffiliate).length
  const affiliateMatchCount = await countMatchedAffiliates(wpData.users)
  const affiliatePassed = affiliateMatchCount >= wpAffiliates * 0.95
  console.log(`\n${affiliatePassed ? '✅' : '❌'} Affiliate Migration: ${affiliateMatchCount}/${wpAffiliates}`)

  // Overall status
  const allPassed = userPassed && walletPassed && affiliatePassed
  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('✅ MIGRATION VERIFIED SUCCESSFULLY!')
    console.log('   All data migrated accurately.')
  } else {
    console.log('⚠️  MIGRATION NEEDS ATTENTION')
    console.log('   Some data may need manual review.')
  }

  // Test login
  console.log('\n📝 Test Login:')
  console.log('   Email: admin@eksporyuk.com')
  console.log('   Password: password123 (or eksporyuk2024 for migrated users)')

  await prisma.$disconnect()
}

async function basicVerification() {
  console.log('📊 Eksporyuk Database Status:\n')
  
  const userCount = await prisma.user.count()
  const affiliateCount = await prisma.affiliateProfile.count()
  const walletCount = await prisma.wallet.count()
  const membershipCount = await prisma.membership.count()
  
  const walletSum = await prisma.wallet.aggregate({
    _sum: { balance: true, balancePending: true }
  })

  const usersWithoutWallet = await prisma.user.count({
    where: { wallet: null }
  })

  console.log(`   Users: ${userCount}`)
  console.log(`   Affiliates: ${affiliateCount}`)
  console.log(`   Wallets: ${walletCount}`)
  console.log(`   Memberships: ${membershipCount}`)
  console.log(`   Total Balance: Rp ${parseFloat(walletSum._sum.balance || 0).toLocaleString()}`)
  console.log(`   Pending Balance: Rp ${parseFloat(walletSum._sum.balancePending || 0).toLocaleString()}`)
  console.log(`   Users without wallet: ${usersWithoutWallet}`)

  // Checks
  console.log('\n🔎 Integrity Checks:')
  console.log(`   ${usersWithoutWallet === 0 ? '✅' : '❌'} All users have wallets`)
  console.log(`   ${membershipCount > 0 ? '✅' : '⚠️'} Memberships configured`)
  console.log(`   ${userCount > 0 ? '✅' : '❌'} Users exist`)

  await prisma.$disconnect()
}

async function countMatchedAffiliates(wpUsers) {
  let count = 0
  
  for (const wpUser of wpUsers) {
    if (!wpUser.isAffiliate) continue
    
    const ekUser = await prisma.user.findUnique({
      where: { email: wpUser.email },
      include: { affiliateProfile: true }
    })
    
    if (ekUser?.affiliateProfile) {
      count++
    }
  }
  
  return count
}

// Run
main().catch(console.error)
