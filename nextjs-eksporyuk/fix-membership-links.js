const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixMembershipData() {
  try {
    console.log('🔧 Fixing Membership Data...\n')
    
    // Fix the invalid URL in "6 Bulan" package
    const pkg6Month = await prisma.membership.findFirst({
      where: { name: '6 Bulan' }
    })
    
    if (pkg6Month) {
      if (pkg6Month.externalSalesUrl === 'kelaseksporyuk.com') {
        await prisma.membership.update({
          where: { id: pkg6Month.id },
          data: {
            externalSalesUrl: null  // Clear invalid URL
          }
        })
        console.log('✅ Fixed invalid URL in "6 Bulan" package\n')
      }
    }
    
    // Get ANY user
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.error('❌ No users found! Please create a user first.')
      return
    }
    
    console.log(`👤 Using user: ${user.name || 'Unknown'} (${user.email}, Role: ${user.role})\n`)
    
    // Get all memberships
    const memberships = await prisma.membership.findMany({
      where: { isActive: true }
    })
    
    console.log(`📦 Creating test affiliate links for ${memberships.length} memberships...\n`)
    
    // Create affiliate link for each membership
    for (const membership of memberships) {
      // Check if link already exists
      const existing = await prisma.affiliateLink.findFirst({
        where: {
          userId: user.id,
          membershipId: membership.id,
        }
      })
      
      if (existing) {
        console.log(`⏭️  Link already exists for "${membership.name}" (code: ${existing.code})`)
        console.log(`   URL: http://localhost:3000/aff/${user.id}/${existing.code}/`)
        continue
      }
      
      // Generate code
      const code = `TEST${Date.now().toString(36).toUpperCase().slice(-6)}`
      const baseUrl = 'http://localhost:3000'
      const affiliateBase = `${baseUrl}/aff/${user.id}/${code}`
      
      // Create link
      const link = await prisma.affiliateLink.create({
        data: {
          userId: user.id,
          membershipId: membership.id,
          code: code,
          fullUrl: `${affiliateBase}/`,
          linkType: 'SALESPAGE_INTERNAL',
        }
      })
      
      console.log(`✅ Created link for "${membership.name}":`)
      console.log(`   Code: ${code}`)
      console.log(`   URL: ${affiliateBase}/`)
      console.log(`   Checkout: ${affiliateBase}/checkout`)
      console.log(`   Alternative: ${affiliateBase}/0-link-alternatif`)
      console.log('')
    }
    
    console.log('\n✨ Done! You can now test the affiliate links.')
    console.log('\n💡 Example URLs to test:')
    const firstLink = await prisma.affiliateLink.findFirst({
      where: { membershipId: { not: null } },
      include: { membership: true }
    })
    
    if (firstLink) {
      const baseUrl = 'http://localhost:3000'
      console.log(`\n1. Salespage (will redirect to external URL or checkout):`)
      console.log(`   ${baseUrl}/aff/${user.id}/${firstLink.code}/`)
      console.log(`\n2. Direct Checkout:`)
      console.log(`   ${baseUrl}/aff/${user.id}/${firstLink.code}/checkout`)
      console.log(`\n3. Alternative Link:`)
      console.log(`   ${baseUrl}/aff/${user.id}/${firstLink.code}/0-link-alternatif`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMembershipData()
