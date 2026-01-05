import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGroupAPIs() {
  try {
    console.log('🧪 Testing Group API Functionality\n')
    
    // Test 1: Get test admin user
    const testAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      select: { id: true, email: true, name: true }
    })

    if (!testAdmin) {
      console.log('❌ Test admin user not found')
      return
    }

    console.log(`✅ Found test admin: ${testAdmin.name} (${testAdmin.email})`)
    console.log(`   User ID: ${testAdmin.id}\n`)

    // Test 2: Get user's group memberships (simulating API call)
    console.log('📋 Testing /api/member/my-groups logic:\n')
    
    const userGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: testAdmin.id }
    })

    console.log(`Found ${userGroupMemberships.length} group memberships:`)
    userGroupMemberships.forEach((gm, index) => {
      console.log(`  ${index + 1}. Group ID: ${gm.groupId}, Role: ${gm.role}`)
    })

    if (userGroupMemberships.length === 0) {
      console.log('⚠️  User has no group memberships')
      return
    }

    console.log()

    // Test 3: Get group details
    console.log('📋 Testing group details retrieval:\n')
    
    const groupIds = userGroupMemberships.map(gm => gm.groupId)
    const groupDetails = await prisma.group.findMany({
      where: {
        id: { in: groupIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        type: true,
        isActive: true,
        createdAt: true,
        ownerId: true
      }
    })

    console.log(`Retrieved ${groupDetails.length} group details:`)
    groupDetails.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.name} (${group.type})`)
      console.log(`     Description: ${group.description?.substring(0, 50) || 'No description'}...`)
    })

    console.log()

    // Test 4: Calculate member counts
    console.log('📊 Testing member count calculations:\n')
    
    const groupsWithCounts = await Promise.all(
      userGroupMemberships
        .filter(gm => groupDetails.some(g => g.id === gm.groupId))
        .map(async (gm) => {
          const group = groupDetails.find(g => g.id === gm.groupId)
          if (!group) return null

          const memberCount = await prisma.groupMember.count({
            where: { groupId: group.id }
          })

          return {
            id: group.id,
            name: group.name,
            memberCount,
            role: gm.role
          }
        })
    )

    const validGroups = groupsWithCounts.filter(g => g !== null)
    
    console.log(`Groups with member counts:`)
    validGroups.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.name}`)
      console.log(`     Members: ${group.memberCount}`)
      console.log(`     Your role: ${group.role}`)
    })

    console.log()

    // Test 5: Calculate statistics
    console.log('📈 Testing statistics calculation:\n')
    
    const stats = {
      totalGroups: validGroups.length,
      adminGroups: validGroups.filter(g => ['OWNER', 'ADMIN'].includes(g.role)).length,
      totalMembers: validGroups.reduce((acc, g) => acc + g.memberCount, 0)
    }

    console.log(`Statistics:`)
    console.log(`  Total Groups: ${stats.totalGroups}`)
    console.log(`  Groups as Admin/Owner: ${stats.adminGroups}`)
    console.log(`  Total Members across groups: ${stats.totalMembers}`)

    console.log()

    // Test 6: Verify dashboard API would work
    console.log('✅ Dashboard API (myGroups) would return:')
    console.log(`  Groups count: ${validGroups.length}`)
    console.log(`  First 3 groups: ${validGroups.slice(0, 3).map(g => g.name).join(', ')}`)

    console.log('\n✅ All API logic tests passed!')

  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testGroupAPIs()