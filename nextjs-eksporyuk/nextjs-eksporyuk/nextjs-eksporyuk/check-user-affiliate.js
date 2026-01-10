const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserAffiliate() {
  try {
    console.log('�� Checking user: azizbiasa@gmail.com\n')
    
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
        status: true,
        isActive: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
      }
    })
    
    if (!affiliateProfile) {
      console.log('❌ No affiliate profile found!')
      console.log('\n💡 Solution: User needs to apply at /affiliate/apply')
      return
    }
    
    console.log('✅ Affiliate profile found:')
    console.log('   ID:', affiliateProfile.id)
    console.log('   Code:', affiliateProfile.affiliateCode || 'NOT SET')
    console.log('   Status:', affiliateProfile.status)
    console.log('   Active:', affiliateProfile.isActive)
    console.log('   Approved:', affiliateProfile.approvedAt ? 'YES' : 'NO')
    console.log('   Rejected:', affiliateProfile.rejectedAt ? 'YES' : 'NO')
    
    if (affiliateProfile.status !== 'APPROVED') {
      console.log('\n⚠️  WARNING: Affiliate status is NOT approved!')
      console.log('   Current status:', affiliateProfile.status)
      console.log('   💡 Admin needs to approve this affiliate')
    }
    
    if (!affiliateProfile.isActive) {
      console.log('\n⚠️  WARNING: Affiliate profile is NOT active!')
    }
    
    if (!affiliateProfile.affiliateCode) {
      console.log('\n⚠️  WARNING: No affiliate code set!')
      console.log('   �� Code should be auto-generated on approval')
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
        console.log(`   ${i + 1}. ${link.code} (${link.linkType} - ${target})`)
        console.log(`      URL: ${link.fullUrl?.substring(0, 80)}...`)
        console.log(`      Active: ${link.isActive}`)
      })
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
      take: 5
    })
    
    console.log(`   Active memberships: ${memberships.length}`)
    if (memberships.length > 0) {
      console.log('\n   Available for linking:')
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`)
        console.log(`      Slug: ${m.slug || m.checkoutSlug}`)
        console.log(`      Price: Rp ${m.price?.toLocaleString()}`)
        console.log(`      Commission: ${m.affiliateCommissionRate}%`)
      })
    } else {
      console.log('   ❌ No active memberships found!')
      console.log('   💡 Admin needs to activate memberships')
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    
    const canGenerate = 
      user.isActive && 
      !user.isSuspended && 
      affiliateProfile && 
      affiliateProfile.isActive && 
      affiliateProfile.status === 'APPROVED' && 
      affiliateProfile.affiliateCode && 
      memberships.length > 0
    
    if (canGenerate) {
      console.log('✅ User CAN generate affiliate links!')
      console.log('\n   Next steps:')
      console.log('   1. Login to https://eksporyuk.com')
      console.log('   2. Go to /affiliate/links')
      console.log('   3. Click "Generate Link"')
      console.log('   4. Select "Membership"')
      console.log('   5. Click "Generate Semua Link!"')
    } else {
      console.log('❌ User CANNOT generate links yet!')
      console.log('\n   Issues found:')
      if (!user.isActive) console.log('   - User account not active')
      if (user.isSuspended) console.log('   - User account suspended')
      if (!affiliateProfile) console.log('   - No affiliate profile')
      if (affiliateProfile && !affiliateProfile.isActive) console.log('   - Affiliate profile not active')
      if (affiliateProfile && affiliateProfile.status !== 'APPROVED') console.log('   - Affiliate not approved (status: ' + affiliateProfile.status + ')')
      if (affiliateProfile && !affiliateProfile.affiliateCode) console.log('   - No affiliate code')
      if (memberships.length === 0) console.log('   - No active memberships')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserAffiliate()
