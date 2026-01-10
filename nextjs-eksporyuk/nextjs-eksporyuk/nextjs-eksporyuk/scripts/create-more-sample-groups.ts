import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMoreSampleGroups() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.error('❌ Admin user not found!')
      return
    }

    const groups = [
      {
        name: 'Eksportir Produk Fashion',
        slug: 'eksportir-produk-fashion',
        description: 'Grup khusus untuk eksportir fashion Indonesia. Diskusi trend fashion global, strategi branding, dan tips ekspor ke berbagai negara.',
        type: 'PUBLIC',
        avatar: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
        coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        requireApproval: false,
        isActive: true
      },
      {
        name: 'Komunitas Ekspor Furniture',
        slug: 'komunitas-ekspor-furniture',
        description: 'Bersama mengembangkan bisnis ekspor furniture dan kerajinan kayu Indonesia ke pasar internasional.',
        type: 'PRIVATE',
        avatar: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200',
        requireApproval: true,
        isActive: true
      },
      {
        name: 'Grup VIP Eksportir Premium',
        slug: 'grup-vip-eksportir-premium',
        description: 'Grup eksklusif untuk eksportir berpengalaman. Sharing strategi advanced, networking dengan buyer internasional.',
        type: 'HIDDEN',
        avatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
        coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200',
        requireApproval: true,
        isActive: true
      },
      {
        name: 'Eksportir Makanan & Minuman',
        slug: 'eksportir-makanan-minuman',
        description: 'Forum diskusi ekspor produk food & beverage. Tips sertifikasi halal, packaging, dan compliance standar internasional.',
        type: 'PUBLIC',
        avatar: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
        requireApproval: false,
        isActive: true
      },
      {
        name: 'Komunitas Ekspor Kosmetik',
        slug: 'komunitas-ekspor-kosmetik',
        description: 'Grup untuk eksportir produk kecantikan dan kosmetik. Diskusi regulasi BPOM, strategi marketing, dan trend beauty global.',
        type: 'PUBLIC',
        avatar: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
        coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
        requireApproval: false,
        isActive: true
      },
      {
        name: 'Grup Testing (Nonaktif)',
        slug: 'grup-testing-nonaktif',
        description: 'Grup untuk testing purposes - status nonaktif',
        type: 'PRIVATE',
        avatar: '',
        coverImage: '',
        requireApproval: false,
        isActive: false
      }
    ]

    console.log('🚀 Creating sample groups...\n')

    for (const groupData of groups) {
      try {
        const group = await prisma.group.create({
          data: {
            name: groupData.name,
            slug: groupData.slug,
            description: groupData.description,
            type: groupData.type as any,
            avatar: groupData.avatar,
            coverImage: groupData.coverImage,
            requireApproval: groupData.requireApproval,
            isActive: groupData.isActive,
            ownerId: adminUser.id,
            bannedWords: ['spam', 'iklan', 'promo'],
          }
        })
        console.log(`✅ Created: ${group.name} (${group.type}) - ${group.isActive ? 'Active' : 'Inactive'}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⏭️  Skipped: ${groupData.name} (already exists)`)
        } else {
          console.log(`❌ Error: ${groupData.name} - ${error.message}`)
        }
      }
    }

    const totalGroups = await prisma.group.count()
    const activeGroups = await prisma.group.count({ where: { isActive: true } })
    const publicGroups = await prisma.group.count({ where: { type: 'PUBLIC' } })
    const privateGroups = await prisma.group.count({ where: { type: 'PRIVATE' } })
    const hiddenGroups = await prisma.group.count({ where: { type: 'HIDDEN' } })

    console.log('\n📊 Summary:')
    console.log(`   Total Groups: ${totalGroups}`)
    console.log(`   Active: ${activeGroups}`)
    console.log(`   Inactive: ${totalGroups - activeGroups}`)
    console.log(`   Public: ${publicGroups}`)
    console.log(`   Private: ${privateGroups}`)
    console.log(`   Hidden: ${hiddenGroups}`)
    console.log('\n🎉 Done! Visit http://localhost:3001/admin/groups to see all groups')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createMoreSampleGroups()
