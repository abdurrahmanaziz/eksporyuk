import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })

  if (!admin) {
    console.log('❌ Admin user not found')
    process.exit(1)
  }

  // Check if group already exists
  const existing = await prisma.group.findUnique({
    where: { slug: 'komunitas-ekspor-indonesia' }
  })

  if (existing) {
    console.log('✅ Group already exists:', existing.slug)
    return
  }

  const group = await prisma.group.create({
    data: {
      name: 'Komunitas Ekspor Indonesia',
      slug: 'komunitas-ekspor-indonesia',
      description: 'Komunitas untuk para eksportir Indonesia. Tempat berbagi tips, pengalaman, dan networking untuk eksportir.',
      type: 'PUBLIC',
      ownerId: admin.id,
      isActive: true,
      showStats: true,
      requireApproval: false,
      allowRichText: true,
      allowMedia: true,
      allowPolls: true,
      allowEvents: true,
      allowScheduling: true,
      allowReactions: true,
      allowMentions: true,
    }
  })

  // Add admin as member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: admin.id,
      role: 'OWNER',
    }
  })

  console.log('✅ Group created:', group.slug)
  console.log('📝 Name:', group.name)
  console.log('👤 Owner:', admin.name)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
