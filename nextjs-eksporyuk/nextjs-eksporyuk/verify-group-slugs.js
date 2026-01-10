import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyGroupSlugs() {
  try {
    console.log('🔍 Verifying group slugs...\n')
    
    // Get test admin user
    const testAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      select: { id: true }
    })

    if (!testAdmin) {
      console.log('❌ Test admin not found')
      return
    }

    // Get user's groups with slug
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: testAdmin.id }
    })

    console.log(`Found ${userGroups.length} group memberships\n`)

    // Get group details with slug
    const groupIds = userGroups.map(ug => ug.groupId)
    const groupDetails = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true
      }
    })

    console.log('✅ Group Details:')
    groupDetails.forEach((group, index) => {
      const correctLink = group.slug ? `/community/groups/${group.slug}` : '/community/groups'
      const wrongLink = `/member/groups/${group.id}`
      
      console.log(`\n${index + 1}. ${group.name} (${group.type})`)
      console.log(`   ID: ${group.id}`)
      console.log(`   Slug: ${group.slug}`)
      console.log(`   ❌ Wrong link: ${wrongLink}`)
      console.log(`   ✅ Correct link: ${correctLink}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyGroupSlugs()