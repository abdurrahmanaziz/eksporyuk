const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedGroups() {
  console.log('🌱 Seeding groups...')

  try {
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    })

    if (!admin) {
      console.error('❌ Admin user not found! Please create an admin user first.')
      return
    }

    // Create sample groups
    const groups = [
      {
        name: 'Komunitas Eksportir Pemula',
        description:
          'Tempat berkumpul dan belajar bagi eksportir pemula. Sharing pengalaman, tips, dan trik memulai bisnis ekspor.',
        type: 'PUBLIC',
        avatar: null,
        coverImage: null,
        ownerId: admin.id,
      },
      {
        name: 'Eksportir Pro Indonesia',
        description:
          'Komunitas eksklusif untuk eksportir profesional. Diskusi strategi bisnis, networking, dan kolaborasi.',
        type: 'PRIVATE',
        avatar: null,
        coverImage: null,
        ownerId: admin.id,
      },
      {
        name: 'Forum Legalitas & Dokumen Ekspor',
        description:
          'Diskusi seputar legalitas, dokumen, dan regulasi ekspor. Tanya jawab dengan ahli dan sesama member.',
        type: 'PUBLIC',
        avatar: null,
        coverImage: null,
        ownerId: admin.id,
      },
      {
        name: 'Marketplace & Buyer Network',
        description:
          'Berbagi informasi buyer, marketplace, dan opportunity bisnis ekspor. Connect dengan calon pembeli.',
        type: 'PUBLIC',
        avatar: null,
        coverImage: null,
        ownerId: admin.id,
      },
      {
        name: 'VIP Mentoring Circle',
        description:
          'Grup eksklusif mentoring dengan founder. Diskusi mendalam dan guidance langsung.',
        type: 'HIDDEN',
        avatar: null,
        coverImage: null,
        ownerId: admin.id,
      },
    ]

    for (const groupData of groups) {
      const group = await prisma.group.create({
        data: groupData,
      })

      // Add owner as member with OWNER role
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: admin.id,
          role: 'OWNER',
        },
      })

      console.log(`✅ Created group: ${group.name}`)

      // Create a welcome post
      await prisma.post.create({
        data: {
          content: `Selamat datang di ${group.name}! 🎉\n\nMari kita gunakan grup ini untuk berbagi, belajar, dan berkembang bersama. Jangan ragu untuk bertanya dan berbagi pengalaman Anda.\n\nSelamat bergabung!`,
          type: 'POST',
          isPinned: true,
          authorId: admin.id,
          groupId: group.id,
        },
      })

      console.log(`  ✅ Created welcome post`)
    }

    // Get all users (besides admin) and add them to public groups
    const users = await prisma.user.findMany({
      where: {
        id: { not: admin.id },
      },
      take: 5,
    })

    const publicGroups = await prisma.group.findMany({
      where: {
        type: 'PUBLIC',
      },
    })

    for (const user of users) {
      for (const group of publicGroups.slice(0, 2)) {
        // Add to first 2 public groups
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: user.id,
            role: 'MEMBER',
          },
        })
      }
      console.log(`✅ Added ${user.name} to ${publicGroups.length} groups`)
    }

    console.log('\n✅ Group seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding groups:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedGroups()
