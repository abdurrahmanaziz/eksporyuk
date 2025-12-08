const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing save post functionality...\n')
  
  // Get admin user
  const user = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })
  
  if (!user) {
    console.log('❌ Admin user not found')
    return
  }
  
  console.log('✅ User:', user.name)
  
  // Get a post
  const post = await prisma.post.findFirst({
    include: {
      author: { select: { name: true } },
      group: { select: { name: true } }
    }
  })
  
  if (!post) {
    console.log('❌ No posts found')
    return
  }
  
  console.log('✅ Test post:', post.id)
  console.log('   Content:', post.content.substring(0, 50))
  console.log('   Author:', post.author.name)
  console.log('   Group:', post.group?.name || 'Personal')
  
  // Check if already saved
  const existing = await prisma.savedPost.findUnique({
    where: {
      postId_userId: {
        postId: post.id,
        userId: user.id
      }
    }
  })
  
  console.log('\n📌 Current save status:', existing ? 'SAVED' : 'NOT SAVED')
  
  if (existing) {
    console.log('   Saved at:', existing.createdAt)
    console.log('   Save ID:', existing.id)
  }
  
  // Try to save/unsave
  if (existing) {
    console.log('\n🗑️  Removing save...')
    await prisma.savedPost.delete({
      where: { id: existing.id }
    })
    console.log('✅ Save removed successfully')
  } else {
    console.log('\n💾 Saving post...')
    const saved = await prisma.savedPost.create({
      data: {
        userId: user.id,
        postId: post.id
      }
    })
    console.log('✅ Post saved successfully')
    console.log('   Save ID:', saved.id)
  }
  
  // Verify
  const final = await prisma.savedPost.findUnique({
    where: {
      postId_userId: {
        postId: post.id,
        userId: user.id
      }
    }
  })
  
  console.log('\n✨ Final status:', final ? 'SAVED' : 'NOT SAVED')
  
  // Show all saved posts
  const allSaved = await prisma.savedPost.findMany({
    where: { userId: user.id },
    include: {
      post: {
        select: {
          content: true,
          group: { select: { name: true } }
        }
      }
    }
  })
  
  console.log(`\n📚 Total saved posts: ${allSaved.length}`)
  allSaved.forEach((s, i) => {
    console.log(`${i + 1}. ${s.post.content.substring(0, 40)}... (${s.post.group?.name || 'Personal'})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
