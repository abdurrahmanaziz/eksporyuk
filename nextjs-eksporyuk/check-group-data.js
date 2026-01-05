import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGroupData() {
  try {
    console.log('🔍 Checking Group and GroupMember data...\n')
    
    // Check total groups
    const groupCount = await prisma.group.count()
    console.log(`📊 Total Groups: ${groupCount}`)
    
    // Check sample groups
    const groups = await prisma.group.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        ownerId: true,
        createdAt: true
      }
    })
    
    console.log('\n📋 Sample Groups:')
    groups.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.name} (${group.type}) - Owner: ${group.ownerId}`)
    })
    
    // Check total group members
    const memberCount = await prisma.groupMember.count()
    console.log(`\n👥 Total Group Members: ${memberCount}`)
    
    // Check sample group members
    const members = await prisma.groupMember.findMany({
      take: 10,
      select: {
        id: true,
        groupId: true,
        userId: true,
        role: true,
        joinedAt: true
      }
    })
    
    console.log('\n👤 Sample Group Members:')
    members.forEach((member, index) => {
      console.log(`  ${index + 1}. User ${member.userId} -> Group ${member.groupId} (${member.role})`)
    })
    
    // Check users
    const userCount = await prisma.user.count()
    console.log(`\n👤 Total Users: ${userCount}`)
    
    // Get sample user IDs
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    
    console.log('\n📱 Sample Users:')
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`)
    })
    
    // Check for specific user's groups (use first user as example)
    if (users.length > 0) {
      const testUserId = users[0].id
      console.log(`\n🔍 Checking groups for user: ${users[0].name} (${testUserId})`)
      
      const userGroups = await prisma.groupMember.findMany({
        where: {
          userId: testUserId
        },
        select: {
          groupId: true,
          role: true,
          joinedAt: true
        }
      })
      
      console.log(`Found ${userGroups.length} group memberships for this user:`)
      userGroups.forEach((membership, index) => {
        console.log(`  ${index + 1}. Group ${membership.groupId} as ${membership.role}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking group data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGroupData()