/**
 * Import Sejoli Data to Eksporyuk
 * Import extracted WordPress data ke platform Eksporyuk
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs').promises
const path = require('path')

const prisma = new PrismaClient()

async function importToEksporyuk(dataFile) {
  console.log('📥 IMPORT SEJOLI DATA TO EKSPORYUK\n')

  try {
    // Load extracted data
    console.log(`📂 Loading data from: ${dataFile}`)
    const rawData = await fs.readFile(dataFile, 'utf-8')
    const data = JSON.parse(rawData)

    console.log('\n📊 Data Overview:')
    console.log(`  Users: ${data.users.length}`)
    console.log(`  Memberships: ${data.memberships.length}`)
    console.log(`  Affiliates: ${data.affiliates.length}`)
    console.log(`  Commissions: ${data.commissions.length}`)

    const importResults = {
      users: { success: 0, failed: 0, skipped: 0 },
      wallets: { created: 0, failed: 0 },
      affiliateProfiles: { created: 0, failed: 0 },
      errors: []
    }

    // ============================================
    // 1. IMPORT USERS
    // ============================================
    console.log('\n👥 Importing Users...')

    for (const wpUser of data.users) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: wpUser.email }
        })

        if (existingUser) {
          console.log(`   ⏭️  Skipped: ${wpUser.email} (already exists)`)
          importResults.users.skipped++
          continue
        }

        // Map WordPress role to Eksporyuk role
        let eksporyukRole = 'MEMBER_FREE'
        if (wpUser.role === 'affiliate') {
          eksporyukRole = 'AFFILIATE'
        } else if (wpUser.role === 'premium_member') {
          eksporyukRole = 'MEMBER_PREMIUM'
        }

        // Generate default password (user harus reset)
        const defaultPassword = await bcrypt.hash('ekspor123', 10)

        // Get affiliate data if exists
        const affiliateData = data.affiliates.find(a => a.wp_user_id === wpUser.wp_id)

        // Create user with wallet
        const user = await prisma.user.create({
          data: {
            email: wpUser.email,
            username: wpUser.username,
            name: wpUser.name,
            password: defaultPassword,
            role: eksporyukRole,
            whatsapp: wpUser.whatsapp,
            emailVerified: true, // Already verified in WordPress
            isActive: true,
            createdAt: new Date(wpUser.registered_date),
            wallet: {
              create: {
                balance: affiliateData ? affiliateData.balance : 0,
                balancePending: 0
              }
            }
          },
          include: { wallet: true }
        })

        console.log(`   ✅ Created: ${user.email} | Role: ${user.role} | Balance: Rp ${affiliateData?.balance || 0}`)
        importResults.users.success++

        // Create wallet if not created
        if (user.wallet) {
          importResults.wallets.created++
        }

        // Create affiliate profile if user is affiliate
        if (eksporyukRole === 'AFFILIATE' && affiliateData) {
          try {
            await prisma.affiliateProfile.create({
              data: {
                userId: user.id,
                affiliateCode: affiliateData.affiliate_code,
                shortLink: `https://eksporyuk.com/${affiliateData.affiliate_code}`,
                commissionRate: 30.0, // Default, bisa disesuaikan
                totalEarnings: affiliateData.total_commission,
                isActive: true,
                applicationStatus: 'APPROVED'
              }
            })
            console.log(`      💼 Affiliate profile created: ${affiliateData.affiliate_code}`)
            importResults.affiliateProfiles.created++
          } catch (error) {
            console.log(`      ⚠️ Failed to create affiliate profile: ${error.message}`)
            importResults.affiliateProfiles.failed++
          }
        }

      } catch (error) {
        console.log(`   ❌ Failed: ${wpUser.email} - ${error.message}`)
        importResults.users.failed++
        importResults.errors.push({
          type: 'user',
          email: wpUser.email,
          error: error.message
        })
      }
    }

    // ============================================
    // 2. IMPORT MEMBERSHIPS (Optional - jika ada membership aktif)
    // ============================================
    console.log('\n💳 Processing Memberships...')
    console.log('   ℹ️  Membership data extracted but not imported yet')
    console.log('   → Will be processed in phase 2 after user verification')

    // ============================================
    // 3. IMPORT COMMISSIONS (Historical data - optional)
    // ============================================
    console.log('\n💰 Processing Commissions...')
    console.log('   ℹ️  Commission history extracted')
    console.log('   → Historical commissions already reflected in wallet balance')
    console.log('   → Detailed history can be imported separately if needed')

    // ============================================
    // SAVE IMPORT LOG
    // ============================================
    const logDir = path.join(__dirname, 'import-logs')
    await fs.mkdir(logDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logFile = path.join(logDir, `import-log-${timestamp}.json`)

    await fs.writeFile(
      logFile,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        sourceFile: dataFile,
        results: importResults,
        summary: {
          totalUsersProcessed: data.users.length,
          usersCreated: importResults.users.success,
          usersSkipped: importResults.users.skipped,
          usersFailed: importResults.users.failed,
          walletsCreated: importResults.wallets.created,
          affiliateProfilesCreated: importResults.affiliateProfiles.created
        }
      }, null, 2)
    )

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Users Created:           ${importResults.users.success}`)
    console.log(`⏭️  Users Skipped:           ${importResults.users.skipped}`)
    console.log(`❌ Users Failed:            ${importResults.users.failed}`)
    console.log(`💰 Wallets Created:         ${importResults.wallets.created}`)
    console.log(`💼 Affiliate Profiles:      ${importResults.affiliateProfiles.created}`)
    console.log('='.repeat(60))

    if (importResults.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      importResults.errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`)
      })
      if (importResults.errors.length > 5) {
        console.log(`   ... and ${importResults.errors.length - 5} more`)
      }
    }

    console.log(`\n📁 Import log saved to: ${logFile}`)
    console.log('\n🎉 Import completed!')
    console.log(`\n📋 Next step: Run verification script:\n   node 3-verify-migration.js`)

    return importResults

  } catch (error) {
    console.error('\n❌ IMPORT ERROR:', error.message)
    console.error('\nFull error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
if (require.main === module) {
  const dataFile = process.argv[2]
  
  if (!dataFile) {
    console.error('❌ Error: Please provide data file path')
    console.error('Usage: node 2-import-to-eksporyuk.js <path-to-extracted-data.json>')
    process.exit(1)
  }

  importToEksporyuk(dataFile)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { importToEksporyuk }
