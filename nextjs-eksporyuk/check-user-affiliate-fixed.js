const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserAffiliate() {
  try {
    console.log('🔍 Checking user: azizbiasa@gmail.com\n')
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isSuspended: true,
      }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found:')
    console.log('   ID:', user.id)
    console.log('   Name:', user.name)
    console.log('   Email:', user.email)
    console.log('   Username:', user.username)
    console.log('   Role:', user.role)
    console.log('   Active:', user.isActive)
    console.log('   Suspended:', user.isSuspended)
    
    // Check affiliate profile
    console.log('\n🔍 Checking affiliate profile...')
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        affiliateCode: true,
        applicationStatus: true,  // CORRECT FIELD
        isActive: true,
        approvedAt: true,
        createdAt: true,
        tier: true,
        commissionRate: true,
        totalClicks: true,
        totalConversions: true,
        totalSales: true,
        totalEarnings: true,
      }
    })
    
    if (!affiliateProfile) {
      console.log('❌ No affiliate profile found!')
      console.log('\n💡 Solution: User needs to apply at /affiliate/apply')
      console.log('   Or admin needs to create affiliate profile for this user')
      return
    }
    
    console.log('✅ Affiliate profile found:')
    console.log('   ID:', affiliateProfile.id)
    console.log('   Code:', affiliateProfile.affiliateCode || 'NOT SET')
    console.log('   Application Status:', affiliateProfile.applicationStatus)
    console.log('   Active:', affiliateProfile.isActive)
    console.log('   Approved:', affiliateProfile.approvedAt ? 'YES (' + affiliateProfile.approvedAt.toISOString() + ')' : 'NO')
    console.log('   Tier:', affiliateProfile.tier)
    console.log('   Commission Rate:', affiliateProfile.commissionRate + '%')
    console.log('   Total Clicks:', affiliateProfile.totalClicks)
    console.log('   Total Conversions:', affiliateProfile.totalConversions)
    console.log('   Total Sales: Rp', affiliateProfile.totalSales?.toLocaleString() || 0)
    console.log('   Total Earnings: Rp', affiliateProfile.totalEarnings?.toLocaleString() || 0)
    
    if (affiliateProfile.applicationStatus !== 'APPROVED') {
      console.log('\n⚠️  WARNING: Application status is NOT approved!')
      console.log('   Current status:', affiliateProfile.applicationStatus)
      console.log('   💡 Admin needs to approve this affiliate')
    }
    
    if (!affiliateProfile.isActive) {
      console.log('\n⚠️  WARNING: Affiliate profile is NOT active!')
    }
    
    if (!affiliateProfile.affiliateCode) {
      console.log('\n⚠️  WARNING: No affiliate code set!')
      console.log('   💡 Code should be auto-generated on creation')
    }
    
    // Check existing links
    console.log('\n📊 Checking existing affiliate links...')
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: affiliateProfile.id },
      select: {
        id: true,
        code: true,
        linkType: true,
        membershipId: true,
        productId: true,
        courseId: true,
        supplierId: true,
        fullUrl: true,
        isActive: true,
        createdAt: true,
        clicks: true,
        conversions: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`   Total links: ${links.length}`)
    
    if (links.length > 0) {
      console.log('\n   Latest 5 links:')
      links.forEach((link, i) => {
        const target = link.membershipId ? 'MEMBERSHIP' : 
                      link.productId ? 'PRODUCT' : 
                      link.courseId ? 'COURSE' : 
                      link.supplierId ? 'SUPPLIER' : 'UNKNOWN'
        console.log(`\n   ${i + 1}. Code: ${link.code}`)
        console.log(`      Type: ${link.linkType} → ${target}`)
        console.log(`      URL: ${link.fullUrl?.substring(0, 70)}...`)
        console.log(`      Active: ${link.isActive}`)
        console.log(`      Clicks: ${link.clicks}, Conversions: ${link.conversions}`)
        console.log(`      Created: ${link.createdAt.toISOString()}`)
      })
    } else {
      console.log('   ℹ️  No links created yet')
    }
    
    // Check memberships available
    console.log('\n📋 Checking available memberships...')
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        price: true,
        affiliateCommissionRate: true,
      },
      take: 10
    })
    
    console.log(`   Active memberships: ${memberships.length}`)
    if (memberships.length > 0) {
      console.log('\n   Available for linking:')
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`)
        console.log(`      Slug: ${m.slug || m.checkoutSlug}`)
        console.log(`      Checkout: ${m.checkoutSlug}`)
        console.log(`      Price: Rp ${m.price?.toLocaleString()}`)
        console.log(`      Commission: ${m.affiliateCommissionRate}%`)
      })
    } else {
      console.log('   ❌ No active memberships found!')
      console.log('   💡 Admin needs to activate memberships')
    }
    
    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 DIAGNOSIS & SOLUTION')
    console.log('='.repeat(70))
    
    const canGenerate = 
      user.isActive && 
      !user.isSuspended && 
      affiliateProfile && 
      affiliateProfile.isActive && 
      affiliateProfile.applicationStatus === 'APPROVED' && 
      affiliateProfile.affiliateCode && 
      memberships.length > 0
    
    if (canGenerate) {
      console.log('✅ User CAN generate affiliate links!')
      console.log('\n📍 Steps to generate:')
      console.log('   1. Login to https://eksporyuk.com/auth/login')
      console.log('   2. Email: azizbiasa@gmail.com')
      console.log('   3. Navigate to /affiliate/links')
      console.log('   4. Click tab "Generate Link"')
      console.log('   5. Select "Membership"')
      console.log('   6. (Optional) Select specific membership or leave empty for all')
      console.log('   7. (Optional) Select coupon')
      console.log('   8. Click "Generate Semua Link!"')
      console.log('\n   Expected: Links will be created and appear in list')
    } else {
      console.log('❌ User CANNOT generate links!')
      console.log('\n🔧 Issues found & solutions:')
      
      if (!user.isActive) {
        console.log('\n   ❌ User account not active')
        console.log('      → Admin: Activate user account')
      }
      
      if (user.isSuspended) {
        console.log('\n   ❌ User account suspended')
        console.log('      → Admin: Unsuspend user account')
      }
      
      if (!affiliateProfile) {
        console.log('\n   ❌ No affiliate profile')
        console.log('      → User: Apply at /affiliate/apply')
        console.log('      → Admin: Create affiliate profile manually')
      } else {
        if (!affiliateProfile.isActive) {
          console.log('\n   ❌ Affiliate profile not active')
          console.log('      → Admin: Set isActive = true in database')
        }
        
        if (affiliateProfile.applicationStatus !== 'APPROVED') {
          console.log('\n   ❌ Application not approved')
          console.log('      → Current status:', affiliateProfile.applicationStatus)
          console.log('      → Admin: Approve affiliate at /admin/affiliates')
          console.log('      → Or update applicationStatus to APPROVED in database')
        }
        
        if (!affiliateProfile.affiliateCode) {
          console.log('\n   ❌ No affiliate code')
          console.log('      → Admin: Generate code manually in database')
        }
      }
      
      if (memberships.length === 0) {
        console.log('\n   ❌ No active memberships')
        console.log('      → Admin: Activate at least 1 membership')
      }
    }
    
    console.log('\n' + '='.repeat(70))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserAffiliate()
