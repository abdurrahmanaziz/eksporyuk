import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixGroupMembership() {
  try {
    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@eksporyuk.com' }
    })

    if (!user) {
      console.error('User not found')
      return
    }

    console.log('User found:', user.id, user.email)

    // Get the group
    const group = await prisma.group.findUnique({
      where: { slug: 'komunitas-ekspor-indonesia' }
    })

    if (!group) {
      console.error('Group not found')
      return
    }

    console.log('Group found:', group.id, group.name)

    // Check if membership exists
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id
        }
      }
    })

    if (existingMembership) {
      console.log('✅ Membership already exists')
      console.log('Role:', existingMembership.role)
      return
    }

    // Add user as member with ADMIN role
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'ADMIN',
        joinedAt: new Date()
      }
    })

    console.log('✅ User added as ADMIN member to the group')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixGroupMembership()
