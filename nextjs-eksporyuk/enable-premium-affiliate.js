/**
 * Script untuk mengaktifkan fitur affiliate untuk semua user MEMBER_PREMIUM yang sudah ada
 * Ini untuk memastikan user premium lama juga mendapat akses affiliate
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function enableAffiliateForExistingPremiumUsers() {
  console.log('=== Enabling Affiliate Access for Existing Premium Users ===\n')

  try {
    // 1. Update all MEMBER_PREMIUM users to have affiliateMenuEnabled = true
    console.log('1. Updating affiliateMenuEnabled for all MEMBER_PREMIUM users...')
    
    const updateResult = await prisma.user.updateMany({
      where: {
        role: 'MEMBER_PREMIUM',
        affiliateMenuEnabled: false
      },
      data: {
        affiliateMenuEnabled: true
      }
    })

    console.log(`✅ Updated ${updateResult.count} premium users with affiliateMenuEnabled`)

    // 2. Find premium users without affiliate profiles
    console.log('\n2. Creating affiliate profiles for premium users...')
    
    const premiumUsersWithoutProfile = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        affiliateProfile: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    console.log(`Found ${premiumUsersWithoutProfile.length} premium users without affiliate profile`)

    for (const user of premiumUsersWithoutProfile) {
      // Generate unique affiliate code
      let affiliateCode = 'PREMIUM' + Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Ensure uniqueness
      let codeExists = await prisma.affiliateProfile.findFirst({
        where: { affiliateCode }
      })
      
      while (codeExists) {
        affiliateCode = 'PREMIUM' + Math.random().toString(36).substring(2, 8).toUpperCase()
        codeExists = await prisma.affiliateProfile.findFirst({
          where: { affiliateCode }
        })
      }

      await prisma.affiliateProfile.create({
        data: {
          id: `affiliate-${user.id}-${Date.now()}`,
          userId: user.id,
          affiliateCode,
          isActive: true,
          tier: 'BRONZE',
          totalEarnings: 0,
          totalReferrals: 0
        }
      })

      console.log(`✅ Created affiliate profile for ${user.email}: ${affiliateCode}`)
    }

    // 3. Add AFFILIATE role to UserRole table
    console.log('\n3. Adding AFFILIATE role to UserRole table...')
    
    const premiumUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      select: { id: true, email: true }
    })

    for (const user of premiumUsers) {
      const existingRole = await prisma.userRole.findUnique({
        where: {
          userId_role: {
            userId: user.id,
            role: 'AFFILIATE'
          }
        }
      })

      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            id: `${user.id}-AFFILIATE-${Date.now()}`,
            userId: user.id,
            role: 'AFFILIATE'
          }
        })
        console.log(`✅ Added AFFILIATE role for ${user.email}`)
      }
    }

    // 4. Final summary
    console.log('\n=== Final Summary ===')
    
    const stats = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      include: {
        affiliateProfile: true,
        roles: {
          where: { role: 'AFFILIATE' }
        }
      }
    })

    console.log(`Total MEMBER_PREMIUM users: ${stats.length}`)
    console.log(`With affiliateMenuEnabled: ${stats.filter(u => u.affiliateMenuEnabled).length}`)
    console.log(`With affiliate profile: ${stats.filter(u => u.affiliateProfile).length}`)
    console.log(`With AFFILIATE role: ${stats.filter(u => u.roles.length > 0).length}`)

    console.log('\n🎉 All existing premium users now have affiliate access!')
    
    // Display some examples
    console.log('\n=== Sample Users ===')
    for (const user of stats.slice(0, 3)) {
      console.log(`${user.email}:`)
      console.log(`  - affiliateMenuEnabled: ${user.affiliateMenuEnabled}`)
      console.log(`  - affiliateCode: ${user.affiliateProfile?.affiliateCode || 'N/A'}`)
      console.log(`  - hasAffiliateRole: ${user.roles.length > 0}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
enableAffiliateForExistingPremiumUsers()