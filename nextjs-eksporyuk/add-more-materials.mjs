import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📚 Adding more learning materials...\n')
  
  // Get admin and mentor profile
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: admin.id }
  })
  
  // Check existing
  const existing = await prisma.course.findMany({
    where: {
      slug: { in: ['teknik-closing-penjualan', 'content-marketing-affiliate'] }
    }
  })
  
  if (existing.length > 0) {
    console.log(`ℹ️  Found ${existing.length} existing courses, updating them...\n`)
    
    await prisma.course.updateMany({
      where: {
        slug: { in: ['teknik-closing-penjualan', 'content-marketing-affiliate'] }
      },
      data: {
        affiliateOnly: true,
        isAffiliateMaterial: true,
        isAffiliateTraining: false,
        isPublished: true,
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })
    
    console.log('✅ Updated existing courses to be published learning materials\n')
  } else {
    console.log('Creating new learning material courses...\n')
    
    const materials = [
      {
        title: 'Teknik Closing Penjualan',
        slug: 'teknik-closing-penjualan',
        description: 'Kuasai teknik closing yang terbukti meningkatkan konversi penjualan Anda',
        level: 'INTERMEDIATE',
        monetizationType: 'FREE',
        price: 0,
        affiliateOnly: true,
        isAffiliateMaterial: true,
        isAffiliateTraining: false,
        isPublished: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        mentorId: mentorProfile.id
      },
      {
        title: 'Content Marketing untuk Affiliate',
        slug: 'content-marketing-affiliate',
        description: 'Belajar membuat konten menarik yang menghasilkan penjualan affiliate',
        level: 'BEGINNER',
        monetizationType: 'FREE',
        price: 0,
        affiliateOnly: true,
        isAffiliateMaterial: true,
        isAffiliateTraining: false,
        isPublished: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        mentorId: mentorProfile.id
      }
    ]
    
    for (const mat of materials) {
      const course = await prisma.course.create({ data: mat })
      console.log(`✅ Created: ${course.title}`)
    }
  }
  
  // Final summary
  const allAffiliate = await prisma.course.findMany({
    where: {
      affiliateOnly: true,
      isPublished: true,
      status: 'PUBLISHED'
    },
    select: {
      title: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true
    }
  })
  
  const training = allAffiliate.filter(c => c.isAffiliateTraining)
  const materials = allAffiliate.filter(c => c.isAffiliateMaterial)
  
  console.log('\n📊 Final Status:')
  console.log(`🎯 Training Wajib: ${training.length}`)
  training.forEach(c => console.log(`   ✓ ${c.title}`))
  
  console.log(`\n📖 Materi Belajar: ${materials.length}`)
  materials.forEach(c => console.log(`   ✓ ${c.title}`))
  
  console.log('\n✨ Done! Refresh /affiliate/training untuk melihat semua courses')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
