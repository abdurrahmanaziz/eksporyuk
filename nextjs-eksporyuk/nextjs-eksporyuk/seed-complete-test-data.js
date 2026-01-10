/**
 * Complete Test Data Seeder
 * Run: node seed-complete-test-data.js
 * 
 * Creates all necessary test users and data for comprehensive testing
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting complete test data seeding...\n')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // ============================================
  // 1. USERS - ALL ROLES
  // ============================================
  console.log('👤 Creating users for all roles...')

  // Note: FOUNDER/CO_FOUNDER are tracked via isFounder/isCoFounder fields, not role enum
  // Available roles: ADMIN, MENTOR, AFFILIATE, MEMBER_PREMIUM, MEMBER_FREE
  const users = [
    {
      email: 'founder@eksporyuk.com',
      username: 'founder',
      name: 'Founder EksporYuk',
      password: hashedPassword,
      role: 'ADMIN', // Founders use ADMIN role with isFounder flag
      isFounder: true,
      revenueSharePercent: 60,
      emailVerified: true,
      isActive: true,
    },
    {
      email: 'cofounder@eksporyuk.com',
      username: 'cofounder',
      name: 'Co-Founder EksporYuk',
      password: hashedPassword,
      role: 'ADMIN', // Co-Founders use ADMIN role with isCoFounder flag
      isCoFounder: true,
      revenueSharePercent: 40,
      emailVerified: true,
      isActive: true,
    },
    {
      email: 'mentor@eksporyuk.com',
      username: 'mentor',
      name: 'Mentor Ekspor',
      password: hashedPassword,
      role: 'MENTOR',
      emailVerified: true,
      isActive: true,
    },
    {
      email: 'premium@eksporyuk.com',
      username: 'premium',
      name: 'Member Premium',
      password: hashedPassword,
      role: 'MEMBER_PREMIUM',
      emailVerified: true,
      isActive: true,
    },
  ]

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!existing) {
      const user = await prisma.user.create({ data: userData })
      console.log(`  ✅ Created: ${user.name} (${user.role})`)

      // Create wallet for each user
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalPayout: 0,
        }
      })
      console.log(`     💰 Wallet created`)
    } else {
      console.log(`  ⏭️  Skipped: ${userData.email} (already exists)`)
    }
  }

  // ============================================
  // 2. MENTOR PROFILE
  // ============================================
  console.log('\n👨‍🏫 Creating mentor profile...')
  
  const mentor = await prisma.user.findUnique({
    where: { email: 'mentor@eksporyuk.com' }
  })

  if (mentor) {
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentor.id }
    })

    if (!existingProfile) {
      await prisma.mentorProfile.create({
        data: {
          userId: mentor.id,
          expertise: 'Export Business, International Trade, Product Sourcing',
          bio: 'Experienced mentor with 10+ years in export business',
          commissionRate: 30,
          isActive: true,
        }
      })
      console.log('  ✅ Mentor profile created')
    } else {
      console.log('  ⏭️  Mentor profile already exists')
    }
  }

  // ============================================
  // 3. MEMBERSHIP PLANS
  // ============================================
  console.log('\n📦 Creating membership plans...')

  const memberships = [
    {
      name: 'Starter',
      slug: 'starter',
      checkoutSlug: 'starter',
      description: 'Paket pemula untuk belajar ekspor',
      duration: 'ONE_MONTH',
      price: 299000,
      originalPrice: 499000,
      affiliateCommissionRate: 20,
      features: JSON.stringify(['Akses 2 course dasar', 'Group komunitas', 'Materi PDF']),
      isActive: true,
    },
    {
      name: 'Professional',
      slug: 'professional',
      checkoutSlug: 'professional',
      description: 'Paket lengkap untuk eksportir serius',
      duration: 'SIX_MONTHS',
      price: 1499000,
      originalPrice: 2499000,
      affiliateCommissionRate: 25,
      features: JSON.stringify(['Semua course', 'Group VIP', 'Mentoring bulanan', 'Database buyer']),
      isMostPopular: true,
      isActive: true,
    },
    {
      name: 'Lifetime',
      slug: 'lifetime',
      checkoutSlug: 'lifetime',
      description: 'Akses selamanya tanpa perpanjangan',
      duration: 'LIFETIME',
      price: 4999000,
      originalPrice: 9999000,
      affiliateCommissionRate: 30,
      features: JSON.stringify(['Semua akses selamanya', 'Private mentoring', 'Bonus eksklusif', 'Priority support']),
      isBestSeller: true,
      isActive: true,
    },
  ]

  for (const membershipData of memberships) {
    const existing = await prisma.membership.findUnique({
      where: { slug: membershipData.slug }
    })

    if (!existing) {
      await prisma.membership.create({ data: membershipData })
      console.log(`  ✅ Created: ${membershipData.name}`)
    } else {
      console.log(`  ⏭️  Skipped: ${membershipData.name} (already exists)`)
    }
  }

  // ============================================
  // 4. USER MEMBERSHIP (Premium User)
  // ============================================
  console.log('\n🎫 Creating user membership for premium user...')

  const premiumUser = await prisma.user.findUnique({
    where: { email: 'premium@eksporyuk.com' }
  })

  const professionalMembership = await prisma.membership.findUnique({
    where: { slug: 'professional' }
  })

  if (premiumUser && professionalMembership) {
    const existingMembership = await prisma.userMembership.findFirst({
      where: { userId: premiumUser.id }
    })

    if (!existingMembership) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6) // 6 months

      await prisma.userMembership.create({
        data: {
          userId: premiumUser.id,
          membershipId: professionalMembership.id,
          startDate,
          endDate,
          isActive: true,
          status: 'ACTIVE',
          activatedAt: new Date(),
        }
      })
      console.log('  ✅ Premium user membership activated')
    } else {
      console.log('  ⏭️  Premium user already has membership')
    }
  }

  // ============================================
  // 5. AFFILIATE PROFILE
  // ============================================
  console.log('\n🔗 Creating affiliate profile...')

  const affiliate = await prisma.user.findFirst({
    where: { role: 'AFFILIATE' }
  })

  if (affiliate) {
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: affiliate.id }
    })

    if (!existingProfile) {
      await prisma.affiliateProfile.create({
        data: {
          userId: affiliate.id,
          affiliateCode: `AFF${affiliate.id.slice(0, 6).toUpperCase()}`,
          shortLink: `https://eksporyuk.com/ref/${affiliate.username || 'affiliate'}`,
          tier: 1,
          commissionRate: 30,
          isActive: true,
          applicationStatus: 'APPROVED',
          approvedAt: new Date(),
          welcomeShown: true,
          onboardingCompleted: true,
        }
      })
      console.log('  ✅ Affiliate profile created')
    } else {
      console.log('  ⏭️  Affiliate profile already exists')
    }
  }

  // ============================================
  // 6. SAMPLE TRANSACTIONS
  // ============================================
  console.log('\n💳 Creating sample transactions...')

  if (premiumUser && professionalMembership) {
    // Successful transaction
    const existingTx = await prisma.transaction.findFirst({
      where: { userId: premiumUser.id, status: 'SUCCESS' }
    })

    if (!existingTx) {
      await prisma.transaction.create({
        data: {
          userId: premiumUser.id,
          amount: professionalMembership.price,
          status: 'SUCCESS',
          type: 'MEMBERSHIP',
          paymentMethod: 'BANK_TRANSFER',
          paidAt: new Date(),
          invoiceNumber: `INV-${Date.now()}`,
          description: `Membership: ${professionalMembership.name}`,
        }
      })
      console.log('  ✅ Success transaction created')
    }

    // Pending transaction
    const existingPending = await prisma.transaction.findFirst({
      where: { status: 'PENDING' }
    })

    if (!existingPending) {
      const freeUser = await prisma.user.findFirst({
        where: { role: 'MEMBER_FREE' }
      })

      if (freeUser) {
        await prisma.transaction.create({
          data: {
            userId: freeUser.id,
            amount: professionalMembership.price,
            status: 'PENDING',
            type: 'MEMBERSHIP',
            paymentMethod: 'VIRTUAL_ACCOUNT',
            invoiceNumber: `INV-PENDING-${Date.now()}`,
            description: `Membership: ${professionalMembership.name}`,
          }
        })
        console.log('  ✅ Pending transaction created')
      }
    } else {
      console.log('  ⏭️  Pending transaction already exists')
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50))
  console.log('📊 SEEDING COMPLETE!')
  console.log('='.repeat(50))

  const userCount = await prisma.user.count()
  const membershipCount = await prisma.membership.count()
  const transactionCount = await prisma.transaction.count()

  console.log(`
  Users: ${userCount}
  Memberships: ${membershipCount}
  Transactions: ${transactionCount}

  📝 TEST ACCOUNTS:
  ─────────────────────────────────────────
  | Role          | Email                    | Password    |
  ─────────────────────────────────────────
  | FOUNDER       | founder@eksporyuk.com    | password123 |
  | CO_FOUNDER    | cofounder@eksporyuk.com  | password123 |
  | MENTOR        | mentor@eksporyuk.com     | password123 |
  | MEMBER_PREMIUM| premium@eksporyuk.com    | password123 |
  ─────────────────────────────────────────
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
