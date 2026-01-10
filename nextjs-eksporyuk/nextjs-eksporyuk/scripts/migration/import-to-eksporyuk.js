/**
 * EKSPORYUK DATA IMPORTER
 * ========================
 * Import WordPress/Sejoli data into Eksporyuk platform
 * 
 * Usage:
 *   node scripts/migration/import-to-eksporyuk.js --file=wp-data/sejoli-export-100-users-xxx.json
 * 
 * Features:
 *   - User creation with proper role mapping
 *   - Wallet creation with balance
 *   - Affiliate profile creation
 *   - Commission records (optional)
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))
const dryRun = args.includes('--dry-run')
const skipExisting = args.includes('--skip-existing')

if (!fileArg) {
  console.log(`
📥 EKSPORYUK DATA IMPORTER
==========================

Usage:
  node scripts/migration/import-to-eksporyuk.js --file=<path-to-json>

Options:
  --file=<path>     Path to exported JSON file (required)
  --dry-run         Preview import without making changes
  --skip-existing   Skip users that already exist (by email)

Example:
  node scripts/migration/import-to-eksporyuk.js --file=wp-data/sejoli-export-100-users-1733721600000.json
  node scripts/migration/import-to-eksporyuk.js --file=wp-data/sejoli-export-100-users-1733721600000.json --dry-run
`)
  process.exit(1)
}

const inputFile = fileArg.replace('--file=', '')
const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(__dirname, inputFile)

async function main() {
  console.log('📥 EKSPORYUK DATA IMPORTER')
  console.log('==========================\n')
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  // Load export data
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  
  console.log(`📊 Import Data:`)
  console.log(`   Source: ${data.source}`)
  console.log(`   Exported At: ${data.exportedAt}`)
  console.log(`   Users: ${data.users.length}`)
  console.log(`   Affiliates: ${data.stats.totalAffiliates}`)
  console.log(`   Total Earnings: Rp ${data.stats.totalEarnings.toLocaleString()}`)
  console.log('')

  const results = {
    usersCreated: 0,
    usersSkipped: 0,
    usersFailed: 0,
    walletsCreated: 0,
    affiliatesCreated: 0,
    errors: []
  }

  // Process users
  console.log('👥 Importing users...\n')
  
  for (const wpUser of data.users) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: wpUser.user_email }
      })

      if (existingUser) {
        if (skipExisting) {
          console.log(`   ⏭️  Skip: ${wpUser.user_email} (already exists)`)
          results.usersSkipped++
          continue
        } else {
          // Update existing user
          if (!dryRun) {
            await updateExistingUser(existingUser, wpUser)
          }
          console.log(`   🔄 Update: ${wpUser.email}`)
          results.usersSkipped++
          continue
        }
      }

      // Map WordPress role to Eksporyuk role
      const role = mapRole(wpUser)
      
      // Generate temporary password (users will need to reset)
      const tempPassword = await bcrypt.hash('eksporyuk2024', 10)
      
      if (dryRun) {
        console.log(`   📝 Would create: ${wpUser.email} | Role: ${role} | Balance: Rp ${(wpUser.walletBalance || 0).toLocaleString()}`)
        results.usersCreated++
        continue
      }

      // Create user with wallet
      const user = await prisma.user.create({
        data: {
          email: wpUser.email,
          username: generateUsername(wpUser),
          name: wpUser.name || wpUser.username,
          password: tempPassword,
          role: role,
          phone: wpUser.phone,
          whatsapp: wpUser.whatsapp,
          address: wpUser.address,
          city: wpUser.city,
          province: wpUser.province,
          postalCode: wpUser.postalCode,
          emailVerified: true,
          isActive: true,
          createdAt: new Date(wpUser.registeredAt),
          
          // Create wallet with migrated balance
          wallet: {
            create: {
              balance: wpUser.walletBalance || 0,
              balancePending: 0
            }
          }
        },
        include: { wallet: true }
      })

      results.usersCreated++
      results.walletsCreated++
      
      console.log(`   ✅ Created: ${wpUser.email} | Role: ${role} | Wallet: Rp ${(wpUser.walletBalance || 0).toLocaleString()}`)

      // Create affiliate profile if user is affiliate
      if (wpUser.isAffiliate && wpUser.affiliateCode) {
        await createAffiliateProfile(user, wpUser)
        results.affiliatesCreated++
        console.log(`      🔗 Affiliate: ${wpUser.affiliateCode}`)
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${wpUser.email} - ${error.message}`)
      results.usersFailed++
      results.errors.push({
        email: wpUser.email,
        error: error.message
      })
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`   Users Created: ${results.usersCreated}`)
  console.log(`   Users Skipped: ${results.usersSkipped}`)
  console.log(`   Users Failed: ${results.usersFailed}`)
  console.log(`   Wallets Created: ${results.walletsCreated}`)
  console.log(`   Affiliates Created: ${results.affiliatesCreated}`)
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`)
    results.errors.slice(0, 10).forEach(e => {
      console.log(`   - ${e.email}: ${e.error}`)
    })
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more`)
    }
  }

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No actual changes were made')
    console.log('   Run without --dry-run to perform actual import')
  } else {
    console.log('\n✅ Import completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Run verification: node scripts/migration/verify-migration.js')
    console.log('   2. Test user login with password: eksporyuk2024')
    console.log('   3. Send password reset emails to users')
  }

  await prisma.$disconnect()
}

function mapRole(wpUser) {
  // Priority: Check if affiliate first
  if (wpUser.isAffiliate || wpUser.role === 'AFFILIATE') {
    return 'AFFILIATE'
  }
  
  // Map WordPress roles to Eksporyuk
  const roleMap = {
    'administrator': 'ADMIN',
    'ADMIN': 'ADMIN',
    'editor': 'MENTOR',
    'MENTOR': 'MENTOR',
    'author': 'MENTOR',
    'contributor': 'MEMBER_FREE',
    'subscriber': 'MEMBER_FREE',
    'customer': 'MEMBER_FREE',
    'MEMBER_FREE': 'MEMBER_FREE',
    'MEMBER_PREMIUM': 'MEMBER_PREMIUM',
    'AFFILIATE': 'AFFILIATE'
  }
  
  return roleMap[wpUser.role] || 'MEMBER_FREE'
}

function generateUsername(wpUser) {
  // Use WordPress username if available
  if (wpUser.username) {
    // Clean username: lowercase, remove special chars
    return wpUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  }
  
  // Generate from email
  const emailPrefix = wpUser.email.split('@')[0]
  return emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

async function updateExistingUser(existingUser, wpUser) {
  // Update wallet balance if higher in WordPress
  const wallet = await prisma.wallet.findUnique({
    where: { userId: existingUser.id }
  })

  if (wallet && wpUser.walletBalance > parseFloat(wallet.balance.toString())) {
    await prisma.wallet.update({
      where: { userId: existingUser.id },
      data: { balance: wpUser.walletBalance }
    })
  }

  // Update user info if missing
  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      phone: existingUser.phone || wpUser.phone,
      whatsapp: existingUser.whatsapp || wpUser.whatsapp,
      address: existingUser.address || wpUser.address,
      city: existingUser.city || wpUser.city,
      province: existingUser.province || wpUser.province
    }
  })
}

async function createAffiliateProfile(user, wpUser) {
  // Check if affiliate profile exists
  const existing = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id }
  })

  if (existing) return existing

  // Generate short link from affiliate code
  const shortLink = `https://eksporyuk.com/ref/${wpUser.affiliateCode}`

  return prisma.affiliateProfile.create({
    data: {
      userId: user.id,
      affiliateCode: wpUser.affiliateCode,
      shortLink: shortLink,
      shortLinkUsername: wpUser.affiliateCode,
      tier: wpUser.affiliateTier || 1,
      commissionRate: 30, // Default commission rate
      totalEarnings: wpUser.affiliateEarnings || 0,
      isActive: true,
      applicationStatus: 'APPROVED',
      approvedAt: new Date()
    }
  })
}

// Run
main().catch(console.error)
