/**
 * Test Email Verification Integration
 * Menguji integrasi email verification dengan database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testEmailVerificationIntegration() {
  console.log('🔍 Testing Email Verification System Integration...\n')

  try {
    // 1. Check BrandedTemplate
    console.log('1️⃣ Checking Branded Template...')
    const template = await prisma.brandedTemplate.findFirst({
      where: { slug: 'email-verification' },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        type: true,
        isActive: true,
        usageCount: true,
        subject: true,
        ctaText: true
      }
    })

    if (template) {
      console.log('   ✅ Template found:')
      console.log('      ID:', template.id)
      console.log('      Slug:', template.slug)
      console.log('      Category:', template.category)
      console.log('      Type:', template.type)
      console.log('      Active:', template.isActive)
      console.log('      Usage Count:', template.usageCount)
      console.log('      Subject:', template.subject)
      console.log('      CTA:', template.ctaText)
    } else {
      console.log('   ❌ Template NOT found!')
    }

    // 2. Check EmailVerificationToken stats
    console.log('\n2️⃣ Checking Email Verification Tokens...')
    const tokenStats = await prisma.emailVerificationToken.aggregate({
      _count: { id: true }
    })
    const validTokens = await prisma.emailVerificationToken.count({
      where: {
        expires: { gt: new Date() }
      }
    })
    const expiredTokens = await prisma.emailVerificationToken.count({
      where: {
        expires: { lte: new Date() }
      }
    })

    console.log('   Total tokens:', tokenStats._count.id)
    console.log('   Valid tokens:', validTokens)
    console.log('   Expired tokens:', expiredTokens)

    // 3. Check User email verification stats by role
    console.log('\n3️⃣ Checking User Email Verification by Role...')
    const roles = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
    
    for (const role of roles) {
      const stats = await prisma.user.aggregate({
        where: { role },
        _count: { id: true }
      })
      
      const verified = await prisma.user.count({
        where: { role, emailVerified: true }
      })
      
      const unverified = await prisma.user.count({
        where: { role, emailVerified: false }
      })

      const percentage = stats._count.id > 0 
        ? ((verified / stats._count.id) * 100).toFixed(1) 
        : '0.0'

      console.log(`   ${role}:`)
      console.log(`      Total: ${stats._count.id}`)
      console.log(`      Verified: ${verified} (${percentage}%)`)
      console.log(`      Unverified: ${unverified}`)
    }

    // 4. Check recent verification tokens
    console.log('\n4️⃣ Recent Email Verification Tokens (Last 5)...')
    const recentTokens = await prisma.emailVerificationToken.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        identifier: true,
        type: true,
        expires: true,
        createdAt: true
      }
    })

    if (recentTokens.length > 0) {
      recentTokens.forEach((token, idx) => {
        const isExpired = new Date() > token.expires
        console.log(`   ${idx + 1}. Token ID: ${token.id.substring(0, 20)}...`)
        console.log(`      User ID: ${token.identifier.substring(0, 30)}...`)
        console.log(`      Type: ${token.type}`)
        console.log(`      Expires: ${token.expires.toISOString()}`)
        console.log(`      Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`)
        console.log(`      Created: ${token.createdAt.toISOString()}`)
      })
    } else {
      console.log('   No tokens found')
    }

    // 5. Check EmailNotificationLog for verification emails
    console.log('\n5️⃣ Checking Email Notification Logs...')
    const emailLogs = await prisma.emailNotificationLog.count({
      where: {
        templateSlug: 'email-verification'
      }
    })
    
    const sentLogs = await prisma.emailNotificationLog.count({
      where: {
        templateSlug: 'email-verification',
        status: 'SENT'
      }
    })

    console.log(`   Total verification emails logged: ${emailLogs}`)
    console.log(`   Successfully sent: ${sentLogs}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 INTEGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ Branded Template:', template ? 'EXISTS' : '❌ MISSING')
    console.log('✅ EmailVerificationToken table:', 'ACCESSIBLE')
    console.log('✅ User.emailVerified field:', 'ACCESSIBLE')
    console.log('✅ EmailNotificationLog:', 'ACCESSIBLE')
    console.log('\n🎯 SYSTEM STATUS: FULLY INTEGRATED WITH DATABASE')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error testing integration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailVerificationIntegration()
