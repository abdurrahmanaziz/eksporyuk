import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestGroupMembership() {
  try {
    console.log('🔍 Creating test group memberships...\n')
    
    // Get a user that should have groups (not test admin)
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: 'admin@test.com'
        }
      },
      take: 3,
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    
    // Get available groups
    const groups = await prisma.group.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        type: true
      }
    })
    
    console.log('Available users:', users)
    console.log('Available groups:', groups)
    
    if (users.length > 0 && groups.length > 0) {
      const user = users[0]
      const group = groups[0]
      
      // Check if membership already exists
      const existingMembership = await prisma.groupMember.findFirst({
        where: {
          userId: user.id,
          groupId: group.id
        }
      })
      
      if (!existingMembership) {
        // Create group membership
        const newMembership = await prisma.groupMember.create({
          data: {
            id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            groupId: group.id,
            role: 'MEMBER',
            joinedAt: new Date()
          }
        })
        
        console.log('✅ Created group membership:', newMembership)
      } else {
        console.log('👍 Group membership already exists')
      }
      
      // Test the API call manually
      console.log(`\n🔍 Testing API for user: ${user.email}`)
      
      const userGroups = await prisma.groupMember.findMany({
        where: {
          userId: user.id
        },
        select: {
          id: true,
          groupId: true,
          role: true,
          joinedAt: true
        }
      })
      
      console.log(`Found ${userGroups.length} group memberships:`)
      userGroups.forEach((membership, index) => {
        console.log(`  ${index + 1}. Group ${membership.groupId} as ${membership.role}`)
      })
      
      // Try to get group details for these memberships
      for (const membership of userGroups) {
        try {
          const groupDetails = await prisma.group.findUnique({
            where: { id: membership.groupId },
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              isActive: true
            }
          })
          
          if (groupDetails) {
            console.log(`    Group Details: ${groupDetails.name} (${groupDetails.type})`)
          }
        } catch (error) {
          console.log(`    Error getting group details: ${error.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestGroupMembership()