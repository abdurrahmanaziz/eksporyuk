import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleGroup() {
  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN'
      }
    })

    if (!adminUser) {
      console.error('❌ Admin user not found!')
      return
    }

    console.log('✓ Found admin user:', adminUser.email)

    // Create sample group
    const group = await prisma.group.create({
      data: {
        name: 'Komunitas Ekspor Jepang',
        slug: 'komunitas-ekspor-jepang',
        description: 'Komunitas untuk para eksportir yang ingin menembus pasar Jepang. Berbagi tips, pengalaman, dan strategi ekspor ke negeri sakura.',
        type: 'PUBLIC',
        avatar: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400',
        coverImage: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200',
        ownerId: adminUser.id,
        requireApproval: false,
        bannedWords: ['spam', 'iklan', 'promo', 'judi'],
        isActive: true
      },
      include: {
        owner: true,
        _count: {
          select: {
            members: true,
            posts: true,
            courses: true,
            products: true
          }
        }
      }
    })

    console.log('\n✅ Sample group created successfully!')
    console.log('📋 Group Details:')
    console.log('   Name:', group.name)
    console.log('   Slug:', group.slug)
    console.log('   Type:', group.type)
    console.log('   Owner:', group.owner.name || group.owner.email)
    console.log('   Status:', group.isActive ? 'Active' : 'Inactive')
    console.log('   Created:', group.createdAt)
    console.log('\n🎉 You can now view this group at: http://localhost:3001/admin/groups')

  } catch (error: any) {
    console.error('❌ Error creating sample group:', error.message)
    
    if (error.code === 'P2002') {
      console.log('\n💡 Group already exists! Check your admin panel.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createSampleGroup()
