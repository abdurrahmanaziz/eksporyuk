const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing simplified feed query...\n')
  
  const user = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })
  
  console.log('User:', user?.name)
  
  // Simple query first - just get all posts
  const allPosts = await prisma.post.findMany({
    include: {
      author: { select: { id: true, name: true } },
      group: { select: { id: true, name: true, slug: true } }
    },
    take: 5
  })
  
  console.log('\nAll posts:', allPosts.length)
  allPosts.forEach(p => {
    console.log(`  - ${p.id}: "${p.content.substring(0, 50)}..." by ${p.author.name}`)
    console.log(`    Group: ${p.group?.name || 'Personal'}`)
    console.log(`    Status: ${p.approvalStatus}`)
  })
  
  // Now try the problematic query
  console.log('\n\nTrying feed query with OR conditions...')
  
  const feedPosts = await prisma.post.findMany({
    where: {
      OR: [
        { approvalStatus: 'APPROVED' },
        { approvalStatus: null }
      ]
    },
    include: {
      author: { select: { id: true, name: true } },
      group: { select: { id: true, name: true, slug: true } }
    },
    take: 5
  })
  
  console.log('Feed posts:', feedPosts.length)
  feedPosts.forEach(p => {
    console.log(`  - ${p.id}: group=${p.group?.name || 'Personal'}, status=${p.approvalStatus}`)
  })
}

main()
  .catch(e => {
    console.error('ERROR:', e.message)
    console.error(e)
  })
  .finally(() => prisma.$disconnect())
