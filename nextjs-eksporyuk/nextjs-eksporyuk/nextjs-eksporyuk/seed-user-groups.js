import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addUserToGroups() {
  try {
    console.log('🔍 Adding users to groups for testing...\n')
    
    // Get the test admin user
    const testAdminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      select: { id: true, email: true, name: true }
    })

    if (testAdminUser) {
      console.log(`Found test admin user: ${testAdminUser.name} (${testAdminUser.email})`)
      
      // Get all groups
      const groups = await prisma.group.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })
      
      console.log(`\nFound ${groups.length} active groups`)
      
      // Add test admin to groups with different roles
      const roles = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']
      
      for (let i = 0; i < Math.min(groups.length, 4); i++) {
        const group = groups[i]
        const role = roles[i]
        
        // Check if membership already exists
        const existing = await prisma.groupMember.findFirst({
          where: {
            userId: testAdminUser.id,
            groupId: group.id
          }
        })
        
        if (!existing) {
          const membership = await prisma.groupMember.create({
            data: {
              id: `membership_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
              userId: testAdminUser.id,
              groupId: group.id,
              role: role,
              joinedAt: new Date()
            }
          })
          
          console.log(`✅ Added test admin as ${role} to ${group.name}`)
        } else {
          console.log(`👍 Test admin already member of ${group.name}`)
        }
      }
    } else {
      console.log('❌ Test admin user not found')
    }
    
    // Also get another regular user and add them to groups
    const regularUser = await prisma.user.findFirst({
      where: {
        email: { not: 'admin@test.com' }
      },
      select: { id: true, email: true, name: true }
    })

    if (regularUser) {
      console.log(`\n✅ Found regular user: ${regularUser.name} (${regularUser.email})`)
      
      // Get some groups
      const groups = await prisma.group.findMany({
        where: { isActive: true },
        take: 3,
        select: { id: true, name: true }
      })
      
      for (const group of groups) {
        const existing = await prisma.groupMember.findFirst({
          where: {
            userId: regularUser.id,
            groupId: group.id
          }
        })
        
        if (!existing) {
          await prisma.groupMember.create({
            data: {
              id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: regularUser.id,
              groupId: group.id,
              role: 'MEMBER',
              joinedAt: new Date()
            }
          })
          
          console.log(`✅ Added ${regularUser.name} to ${group.name}`)
        }
      }
    }
    
    // Verify the updates
    console.log('\n📊 Verification:')
    
    if (testAdminUser) {
      const testAdminGroups = await prisma.groupMember.count({
        where: { userId: testAdminUser.id }
      })
      console.log(`Test admin is now in ${testAdminGroups} groups`)
    }
    
    if (regularUser) {
      const regularUserGroups = await prisma.groupMember.count({
        where: { userId: regularUser.id }
      })
      console.log(`Regular user is now in ${regularUserGroups} groups`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addUserToGroups()