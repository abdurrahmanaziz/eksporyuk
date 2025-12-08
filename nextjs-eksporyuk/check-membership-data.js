const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMembershipData() {
  try {
    console.log('🔍 Checking Membership Data...\n')
    
    // Get all memberships
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        duration: true,
        features: true,
        isActive: true,
        isPopular: true,
        salesPageUrl: true,
        _count: {
          select: {
            userMemberships: true,
            membershipGroups: true,
            membershipCourses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📦 Found ${memberships.length} membership packages:\n`)
    
    if (memberships.length === 0) {
      console.log('❌ NO MEMBERSHIP PLANS FOUND!')
      console.log('\n💡 Database is empty. Need to create plans.')
    } else {
      memberships.forEach((m, index) => {
        console.log(`\n${index + 1}. ${m.name} (${m.slug})`)
        console.log(`   💰 Price: Rp ${m.price?.toString() || '0'}`)
        console.log(`   📊 Original: Rp ${m.originalPrice?.toString() || '0'}`)
        console.log(`   ⏱️  Duration: ${m.duration || 'N/A'}`)
        console.log(`   🌟 Popular: ${m.isPopular ? 'Yes' : 'No'}`)
        console.log(`   ✅ Active: ${m.isActive ? 'Yes' : 'No'}`)
        console.log(`   🔗 Sales Page: ${m.salesPageUrl || 'Not set'}`)
        console.log(`   👥 Members: ${m._count.userMemberships}`)
        console.log(`   📚 Courses: ${m._count.membershipCourses}`)
        console.log(`   👨‍👩‍👧‍👦 Groups: ${m._count.membershipGroups}`)
        
        // Parse features
        if (m.features) {
          try {
            const features = typeof m.features === 'string' ? JSON.parse(m.features) : m.features
            if (Array.isArray(features)) {
              console.log(`   📋 Features: ${features.length} items`)
            }
          } catch (e) {
            console.log(`   ⚠️  Features parse error`)
          }
        } else {
          console.log(`   📋 Features: Not set`)
        }
      })
    }
    
    // Check if there are any affiliate links
    const totalUserMemberships = await prisma.userMembership.count()
    console.log(`\n\n📊 Summary:`)
    console.log(`   Total Plans: ${memberships.length}`)
    console.log(`   Total Active Members: ${totalUserMemberships}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMembershipData()
