const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })
  
  if (!admin) {
    console.log('Admin user not found')
    return
  }
  
  console.log('Admin user:', admin.id, admin.name)
  
  // Get first group
  const group = await prisma.group.findFirst({
    where: { isActive: true }
  })
  
  if (!group) {
    console.log('No active group found')
    return
  }
  
  console.log('Group:', group.id, group.name)
  
  // Check if admin is member
  let member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: admin.id
      }
    }
  })
  
  // Add admin as member if not already
  if (!member) {
    console.log('Adding admin as group member...')
    member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: admin.id,
        role: 'OWNER'
      }
    })
  }
  
  console.log('Admin is member:', member.role)
  
  // Create test post
  const post = await prisma.post.create({
    data: {
      content: 'Ini adalah postingan test dari grup ' + group.name + '. Postingan ini harus muncul di feed komunitas dengan badge grup yang bisa diklik!',
      authorId: admin.id,
      groupId: group.id,
      type: 'POST',
      approvalStatus: 'APPROVED',
      commentsEnabled: true,
      isPinned: false
    }
  })
  
  console.log('\n✅ Post created successfully!')
  console.log('Post ID:', post.id)
  console.log('Content:', post.content)
  console.log('Group:', group.name)
  console.log('\nSekarang buka http://localhost:3000/community/feed untuk melihat hasilnya!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
