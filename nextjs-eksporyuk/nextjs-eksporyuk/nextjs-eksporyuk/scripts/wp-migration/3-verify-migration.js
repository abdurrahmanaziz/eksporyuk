/**
 * Verify Migration Accuracy
 * Compare WordPress data vs Eksporyuk data
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises

const prisma = new PrismaClient()

async function verifyMigration(dataFile) {
  console.log('🔍 MIGRATION VERIFICATION\n')

  try {
    // Load original WordPress data
    console.log(`📂 Loading WordPress data from: ${dataFile}`)
    const rawData = await fs.readFile(dataFile, 'utf-8')
    const wpData = JSON.parse(rawData)

    const verification = {
      users: { match: 0, mismatch: 0, missing: 0, details: [] },
      wallets: { match: 0, mismatch: 0, details: [] },
      affiliates: { match: 0, mismatch: 0, details: [] },
      overall: { status: 'UNKNOWN', accuracy: 0 }
    }

    // ============================================
    // 1. VERIFY USERS
    // ============================================
    console.log('👥 Verifying Users...\n')

    for (const wpUser of wpData.users) {
      const eksporyukUser = await prisma.user.findUnique({
        where: { email: wpUser.email },
        include: { wallet: true, affiliateProfile: true }
      })

      if (!eksporyukUser) {
        console.log(`   ❌ Missing: ${wpUser.email}`)
        verification.users.missing++
        verification.users.details.push({
          email: wpUser.email,
          status: 'MISSING',
          issue: 'User not found in Eksporyuk'
        })
        continue
      }

      // Check role mapping
      let expectedRole = 'MEMBER_FREE'
      if (wpUser.role === 'affiliate') expectedRole = 'AFFILIATE'
      else if (wpUser.role === 'premium_member') expectedRole = 'MEMBER_PREMIUM'

      const roleMatch = eksporyukUser.role === expectedRole

      if (!roleMatch) {
        console.log(`   ⚠️  Role mismatch: ${wpUser.email}`)
        console.log(`      WP: ${wpUser.role} → Eksporyuk: ${eksporyukUser.role}`)
        verification.users.mismatch++
        verification.users.details.push({
          email: wpUser.email,
          status: 'MISMATCH',
          issue: `Role: WP=${wpUser.role}, Eksporyuk=${eksporyukUser.role}`
        })
      } else {
        console.log(`   ✅ Match: ${wpUser.email} | Role: ${eksporyukUser.role}`)
        verification.users.match++
      }

      // Verify wallet
      if (eksporyukUser.wallet) {
        const affiliateData = wpData.affiliates.find(a => a.wp_user_id === wpUser.wp_id)
        const expectedBalance = affiliateData ? affiliateData.balance : 0
        const actualBalance = parseFloat(eksporyukUser.wallet.balance.toString())

        if (Math.abs(actualBalance - expectedBalance) > 1) {
          console.log(`   ⚠️  Wallet mismatch: ${wpUser.email}`)
          console.log(`      Expected: Rp ${expectedBalance.toLocaleString()}, Got: Rp ${actualBalance.toLocaleString()}`)
          verification.wallets.mismatch++
          verification.wallets.details.push({
            email: wpUser.email,
            expectedBalance,
            actualBalance,
            difference: actualBalance - expectedBalance
          })
        } else {
          verification.wallets.match++
        }
      }

      // Verify affiliate profile
      if (expectedRole === 'AFFILIATE') {
        const affiliateData = wpData.affiliates.find(a => a.wp_user_id === wpUser.wp_id)
        
        if (!eksporyukUser.affiliateProfile && affiliateData) {
          console.log(`   ⚠️  Affiliate profile missing: ${wpUser.email}`)
          verification.affiliates.mismatch++
        } else if (eksporyukUser.affiliateProfile) {
          const codeMatch = eksporyukUser.affiliateProfile.affiliateCode === affiliateData?.affiliate_code
          if (!codeMatch) {
            console.log(`   ⚠️  Affiliate code mismatch: ${wpUser.email}`)
            verification.affiliates.mismatch++
          } else {
            verification.affiliates.match++
          }
        }
      }
    }

    // ============================================
    // 2. VERIFY TOTALS
    // ============================================
    console.log('\n💰 Verifying Totals...\n')

    // Count users in Eksporyuk
    const totalEksporyukUsers = await prisma.user.count()
    const totalAffiliates = await prisma.affiliateProfile.count()
    const totalWallets = await prisma.wallet.count()

    // Calculate total balance
    const wallets = await prisma.wallet.findMany()
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance.toString()), 0)
    const expectedBalance = wpData.affiliates.reduce((sum, a) => sum + a.balance, 0)

    console.log('📊 Comparison:')
    console.log(`   WordPress Users:      ${wpData.users.length}`)
    console.log(`   Eksporyuk Users:      ${totalEksporyukUsers}`)
    console.log(`   Match:                ${verification.users.match === wpData.users.length ? '✅' : '⚠️'}`)
    console.log()
    console.log(`   WordPress Affiliates: ${wpData.affiliates.length}`)
    console.log(`   Eksporyuk Affiliates: ${totalAffiliates}`)
    console.log(`   Match:                ${verification.affiliates.match === wpData.affiliates.length ? '✅' : '⚠️'}`)
    console.log()
    console.log(`   Expected Balance:     Rp ${expectedBalance.toLocaleString()}`)
    console.log(`   Actual Balance:       Rp ${totalBalance.toLocaleString()}`)
    console.log(`   Difference:           Rp ${Math.abs(totalBalance - expectedBalance).toLocaleString()}`)

    // ============================================
    // CALCULATE ACCURACY
    // ============================================
    const totalChecks = wpData.users.length
    const successfulChecks = verification.users.match
    const accuracy = (successfulChecks / totalChecks) * 100

    verification.overall.accuracy = accuracy
    
    if (accuracy === 100 && verification.wallets.mismatch === 0) {
      verification.overall.status = 'PERFECT'
    } else if (accuracy >= 95) {
      verification.overall.status = 'GOOD'
    } else if (accuracy >= 80) {
      verification.overall.status = 'ACCEPTABLE'
    } else {
      verification.overall.status = 'NEEDS_REVIEW'
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Overall Status:     ${verification.overall.status}`)
    console.log(`Accuracy:           ${accuracy.toFixed(2)}%`)
    console.log()
    console.log(`Users Match:        ${verification.users.match}/${totalChecks}`)
    console.log(`Users Missing:      ${verification.users.missing}`)
    console.log(`Users Mismatch:     ${verification.users.mismatch}`)
    console.log()
    console.log(`Wallets Match:      ${verification.wallets.match}`)
    console.log(`Wallets Mismatch:   ${verification.wallets.mismatch}`)
    console.log()
    console.log(`Affiliates Match:   ${verification.affiliates.match}`)
    console.log(`Affiliates Mismatch: ${verification.affiliates.mismatch}`)
    console.log('='.repeat(60))

    if (verification.overall.status === 'PERFECT') {
      console.log('\n✅ Migration is PERFECT! All data matches.')
    } else if (verification.overall.status === 'GOOD') {
      console.log('\n✅ Migration is GOOD. Minor issues detected.')
    } else if (verification.overall.status === 'ACCEPTABLE') {
      console.log('\n⚠️  Migration is ACCEPTABLE. Some issues need review.')
    } else {
      console.log('\n❌ Migration NEEDS REVIEW. Significant issues detected.')
    }

    // ============================================
    // TEST SAMPLE LOGINS
    // ============================================
    console.log('\n🔐 Testing Sample Logins...\n')
    
    const sampleUsers = wpData.users.slice(0, 5)
    for (const wpUser of sampleUsers) {
      const user = await prisma.user.findUnique({
        where: { email: wpUser.email }
      })

      if (user) {
        const canLogin = user.isActive && user.emailVerified
        console.log(`   ${canLogin ? '✅' : '❌'} ${wpUser.email} - ${canLogin ? 'Can login' : 'Cannot login'}`)
      }
    }

    console.log('\n📋 Next Steps:')
    if (verification.overall.status === 'PERFECT' || verification.overall.status === 'GOOD') {
      console.log('   1. ✅ Test login dengan beberapa user')
      console.log('   2. ✅ Verify commission calculations')
      console.log('   3. ✅ Ready untuk full migration (19k users)')
    } else {
      console.log('   1. ⚠️  Review mismatched users')
      console.log('   2. ⚠️  Fix issues and re-run import')
      console.log('   3. ⚠️  Verify before full migration')
    }

    return verification

  } catch (error) {
    console.error('\n❌ VERIFICATION ERROR:', error.message)
    console.error('\nFull error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
if (require.main === module) {
  const dataFile = process.argv[2]
  
  if (!dataFile) {
    console.error('❌ Error: Please provide data file path')
    console.error('Usage: node 3-verify-migration.js <path-to-extracted-data.json>')
    process.exit(1)
  }

  verifyMigration(dataFile)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { verifyMigration }
