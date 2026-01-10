import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 Creating sample affiliate learning materials...\n')
  
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!admin) {
    console.log('❌ Admin user not found')
    return
  }
  
  // Get or create mentor profile for admin
  let mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: admin.id }
  })
  
  if (!mentorProfile) {
    console.log('Creating mentor profile for admin...')
    mentorProfile = await prisma.mentorProfile.create({
      data: {
        userId: admin.id,
        expertise: ['Marketing', 'Sales', 'Affiliate'],
        bio: 'Admin EksporYuk',
        experience: 5
      }
    })
  }
  
  // Check if courses already exist
  const existing = await prisma.course.findFirst({
    where: {
      slug: { in: ['strategi-promosi-affiliate', 'teknik-closing-penjualan', 'content-marketing-affiliate'] }
    }
  })
  
  if (existing) {
    console.log('ℹ️  Sample courses already exist, updating flags...\n')
    
    await prisma.course.updateMany({
      where: {
        slug: { in: ['strategi-promosi-affiliate', 'teknik-closing-penjualan', 'content-marketing-affiliate'] }
      },
      data: {
        affiliateOnly: true,
        isAffiliateMaterial: true,
        isAffiliateTraining: false
      }
    })
    
    console.log('✅ Updated existing courses to be learning materials\n')
  } else {
    // Create sample learning material courses
    const learningMaterials = [
      {
        title: 'Strategi Promosi Affiliate',
        slug: 'strategi-promosi-affiliate',
        description: 'Pelajari berbagai strategi promosi efektif untuk meningkatkan penjualan affiliate Anda',
        level: 'INTERMEDIATE',
        monetizationType: 'FREE',
        price: 0,
        affiliateOnly: true,
        isAffiliateMaterial: true,
        isAffiliateTraining: false,
        isPublished: true,
        status: 'PUBLISHED',
        mentorId: mentorProfile.id
      },
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
        mentorId: mentorProfile.id
      }
    ]
    
    console.log('Creating 3 learning material courses...\n')
    
    for (const courseData of learningMaterials) {
      const course = await prisma.course.create({
        data: courseData
      })
      
      // Create a sample module
      const module = await prisma.courseModule.create({
        data: {
          title: 'Modul 1: Pengenalan',
          courseId: course.id,
          position: 1
        }
      })
      
      // Create a sample lesson
      await prisma.lesson.create({
        data: {
          title: 'Pengenalan Materi',
          moduleId: module.id,
          position: 1,
          content: `<h2>Selamat Datang!</h2><p>Ini adalah materi pembelajaran untuk ${course.title}</p>`,
          type: 'TEXT'
        }
      })
      
      console.log(`✅ Created: ${course.title}`)
    }
    
    console.log('\n')
  }
  
  // Show final categorization
  console.log('📊 Final Affiliate Course Categorization:\n')
  
  const allAffiliateCourses = await prisma.course.findMany({
    where: { affiliateOnly: true },
    select: {
      title: true,
      slug: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true,
      _count: {
        select: {
          modules: true,
          enrollments: true
        }
      }
    },
    orderBy: [
      { isAffiliateTraining: 'desc' },
      { createdAt: 'asc' }
    ]
  })
  
  const trainingWajib = allAffiliateCourses.filter(c => c.isAffiliateTraining)
  const materiBelajar = allAffiliateCourses.filter(c => c.isAffiliateMaterial)
  
  console.log(`🎯 Training Wajib (${trainingWajib.length}):`)
  trainingWajib.forEach(c => {
    console.log(`   ✓ ${c.title}`)
    console.log(`     ${c._count.modules} modules, ${c._count.enrollments} enrollments`)
  })
  
  console.log(`\n📖 Materi Belajar Opsional (${materiBelajar.length}):`)
  materiBelajar.forEach(c => {
    console.log(`   ✓ ${c.title}`)
    console.log(`     ${c._count.modules} modules, ${c._count.enrollments} enrollments`)
  })
  
  console.log('\n✨ Done! Visit /affiliate/training to see the categorized courses.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
