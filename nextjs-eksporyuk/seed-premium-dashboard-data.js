// Script untuk membuat sample data dashboard member premium
// Run: node seed-premium-dashboard-data.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Creating sample data for Premium Member Dashboard...\n')

  // 1. Get or create admin/mentor user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('❌ No admin user found. Please create one first.')
    return
  }

  // 2. Get premium member user
  let premiumMember = await prisma.user.findFirst({
    where: { role: 'MEMBER_PREMIUM' }
  })

  if (!premiumMember) {
    console.log('❌ No premium member found. Please create one first.')
    return
  }

  console.log(`📌 Admin: ${adminUser.name} (${adminUser.id})`)
  console.log(`📌 Premium Member: ${premiumMember.name} (${premiumMember.id})\n`)

  // 3. Get or create mentor profile for admin
  let mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: adminUser.id }
  })

  if (!mentorProfile) {
    mentorProfile = await prisma.mentorProfile.create({
      data: {
        userId: adminUser.id,
        expertise: 'Export Business, International Trade',
        bio: 'Expert praktisi ekspor dengan 10+ tahun pengalaman',
        isActive: true,
      }
    })
    console.log('✅ Created mentor profile for admin')
  }

  // 4. Delete existing sample data
  console.log('\n🧹 Cleaning existing sample data...')
  
  await prisma.userCourseProgress.deleteMany({
    where: { course: { title: { startsWith: '[SAMPLE]' } } }
  })
  await prisma.courseLesson.deleteMany({
    where: { module: { course: { title: { startsWith: '[SAMPLE]' } } } }
  })
  await prisma.courseModule.deleteMany({
    where: { course: { title: { startsWith: '[SAMPLE]' } } }
  })
  await prisma.course.deleteMany({
    where: { title: { startsWith: '[SAMPLE]' } }
  })
  await prisma.eventRSVP.deleteMany({
    where: { event: { title: { startsWith: '[SAMPLE]' } } }
  })
  await prisma.event.deleteMany({
    where: { title: { startsWith: '[SAMPLE]' } }
  })
  await prisma.product.deleteMany({
    where: { name: { startsWith: '[SAMPLE]' } }
  })

  // Also clean up groups
  await prisma.groupMember.deleteMany({
    where: { group: { name: { startsWith: '[SAMPLE]' } } }
  })
  await prisma.post.deleteMany({
    where: { group: { name: { startsWith: '[SAMPLE]' } } }
  })
  await prisma.group.deleteMany({
    where: { name: { startsWith: '[SAMPLE]' } }
  })

  // 5. Create sample courses
  console.log('\n📚 Creating sample courses...')

  const courses = [
    {
      title: '[SAMPLE] Panduan Lengkap Ekspor untuk Pemula',
      slug: 'sample-panduan-ekspor-pemula',
      description: 'Pelajari dasar-dasar ekspor dari nol hingga mahir. Cocok untuk pemula yang ingin memulai bisnis ekspor.',
      thumbnail: 'https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 0,
      level: 'Beginner',
      status: 'APPROVED',
      isPublished: true,
      monetizationType: 'SUBSCRIPTION',
      modules: [
        {
          title: 'Modul 1: Pengenalan Ekspor',
          lessons: [
            { title: 'Apa itu Ekspor?', duration: 15, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Mengapa Harus Ekspor?', duration: 12, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Jenis-jenis Produk Ekspor', duration: 20, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Modul 2: Persiapan Ekspor',
          lessons: [
            { title: 'Dokumen yang Diperlukan', duration: 18, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Cara Mendaftarkan Perusahaan Ekspor', duration: 25, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Modul 3: Mencari Buyer',
          lessons: [
            { title: 'Platform untuk Mencari Buyer', duration: 22, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Teknik Negosiasi dengan Buyer', duration: 30, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        }
      ],
      progress: 45, // User progress
      completedLessons: ['lesson-0-0', 'lesson-0-1', 'lesson-0-2'] // 3 dari 7 selesai
    },
    {
      title: '[SAMPLE] Strategi Marketing untuk Eksportir',
      slug: 'sample-strategi-marketing-eksportir',
      description: 'Pelajari teknik marketing digital untuk meningkatkan penjualan ekspor Anda ke pasar internasional.',
      thumbnail: 'https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 0,
      level: 'Intermediate',
      status: 'APPROVED',
      isPublished: true,
      monetizationType: 'SUBSCRIPTION',
      modules: [
        {
          title: 'Modul 1: Digital Marketing Basics',
          lessons: [
            { title: 'Introduction to Digital Marketing', duration: 20, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Social Media Marketing', duration: 25, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Modul 2: B2B Marketing',
          lessons: [
            { title: 'LinkedIn for Export Business', duration: 18, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Email Marketing Strategy', duration: 22, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        }
      ],
      progress: 0, // Belum dimulai
      completedLessons: []
    },
    {
      title: '[SAMPLE] Dokumen Ekspor: Invoice, Packing List, COO',
      slug: 'sample-dokumen-ekspor',
      description: 'Tutorial lengkap cara membuat dokumen ekspor yang benar sesuai standar internasional.',
      thumbnail: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 0,
      level: 'Beginner',
      status: 'APPROVED',
      isPublished: true,
      monetizationType: 'SUBSCRIPTION',
      modules: [
        {
          title: 'Modul 1: Invoice Ekspor',
          lessons: [
            { title: 'Komponen Invoice Ekspor', duration: 15, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Cara Membuat Invoice yang Benar', duration: 20, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Modul 2: Packing List',
          lessons: [
            { title: 'Format Packing List', duration: 12, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Modul 3: Certificate of Origin',
          lessons: [
            { title: 'Jenis-jenis COO', duration: 18, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Cara Mengurus COO', duration: 25, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        }
      ],
      progress: 100, // Sudah selesai
      completedLessons: ['lesson-0-0', 'lesson-0-1', 'lesson-1-0', 'lesson-2-0', 'lesson-2-1']
    }
  ]

  for (const courseData of courses) {
    const { modules, progress, completedLessons, ...courseInfo } = courseData
    
    // Create course
    const course = await prisma.course.create({
      data: {
        ...courseInfo,
        mentorId: mentorProfile.id,
        publishedAt: new Date(),
      }
    })
    console.log(`  ✅ Course: ${course.title}`)

    // Create modules and lessons
    let lessonIds = []
    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const moduleData = modules[mIdx]
      const module = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: moduleData.title,
          order: mIdx + 1,
        }
      })

      for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
        const lessonData = moduleData.lessons[lIdx]
        const lesson = await prisma.courseLesson.create({
          data: {
            moduleId: module.id,
            title: lessonData.title,
            content: `Content for ${lessonData.title}`,
            duration: lessonData.duration,
            videoUrl: lessonData.videoUrl,
            order: lIdx + 1,
          }
        })
        lessonIds.push(lesson.id)
      }
    }

    // Create user progress
    const totalLessons = lessonIds.length
    const completedCount = completedLessons.length
    const isCompleted = progress === 100

    await prisma.userCourseProgress.create({
      data: {
        userId: premiumMember.id,
        courseId: course.id,
        progress: progress,
        isCompleted: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedLessons: lessonIds.slice(0, completedCount),
        lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last 7 days
      }
    })
  }

  // 6. Create sample events
  console.log('\n📅 Creating sample events...')

  const now = new Date()
  const events = [
    {
      title: '[SAMPLE] Webinar: Strategi Ekspor ke Eropa 2025',
      description: 'Pelajari strategi dan tips ekspor ke pasar Eropa. Dibawakan oleh praktisi ekspor berpengalaman.',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
      type: 'WEBINAR',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
      meetingUrl: 'https://zoom.us/j/123456789',
      isPublished: true,
      price: 0,
    },
    {
      title: '[SAMPLE] Workshop: Cara Buat Dokumen Ekspor',
      description: 'Workshop praktis membuat dokumen ekspor lengkap. Peserta akan langsung praktek membuat Invoice, Packing List, dan COO.',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      type: 'WORKSHOP',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours
      meetingUrl: 'https://zoom.us/j/987654321',
      isPublished: true,
      price: 0,
    },
    {
      title: '[SAMPLE] Networking: Eksportir Indonesia Meetup',
      description: 'Acara networking untuk para eksportir Indonesia. Bangun koneksi dengan sesama pelaku ekspor dari berbagai daerah.',
      thumbnail: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
      type: 'MEETUP',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours
      location: 'Jakarta Convention Center',
      isPublished: true,
      price: 0,
    }
  ]

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        creatorId: adminUser.id,
      }
    })
    console.log(`  ✅ Event: ${event.title}`)

    // RSVP premium member to first event
    if (eventData.title.includes('Webinar')) {
      await prisma.eventRSVP.create({
        data: {
          eventId: event.id,
          userId: premiumMember.id,
          status: 'GOING',
        }
      })
    }
  }

  // 7. Create sample products
  console.log('\n🛒 Creating sample products...')

  const products = [
    {
      name: '[SAMPLE] Template Dokumen Ekspor Premium',
      slug: 'sample-template-dokumen-ekspor',
      description: 'Paket lengkap 50+ template dokumen ekspor siap pakai. Termasuk Invoice, Packing List, COO, Bill of Lading, dan lainnya.',
      shortDescription: '50+ template dokumen ekspor siap pakai',
      thumbnail: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 299000,
      originalPrice: 599000,
      category: 'template',
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      isFeatured: true,
    },
    {
      name: '[SAMPLE] Database 10.000+ Buyer Internasional',
      slug: 'sample-database-buyer',
      description: 'Akses database buyer internasional dari 50+ negara. Data lengkap dengan kontak, produk yang dicari, dan volume pembelian.',
      shortDescription: 'Database buyer dari 50+ negara',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 499000,
      originalPrice: 999000,
      category: 'database',
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      isFeatured: true,
    },
    {
      name: '[SAMPLE] E-book: Rahasia Sukses Ekspor',
      slug: 'sample-ebook-ekspor',
      description: 'E-book komprehensif berisi strategi dan pengalaman praktis dari eksportir sukses Indonesia.',
      shortDescription: 'Strategi dari eksportir sukses',
      thumbnail: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 149000,
      originalPrice: 249000,
      category: 'ebook',
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      isFeatured: false,
    },
    {
      name: '[SAMPLE] Kalkulator Biaya Ekspor',
      slug: 'sample-kalkulator-ekspor',
      description: 'Tool Excel untuk menghitung biaya ekspor dengan akurat. Termasuk formula untuk shipping, customs, dan margins.',
      shortDescription: 'Tool hitung biaya ekspor',
      thumbnail: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 99000,
      originalPrice: 199000,
      category: 'tool',
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      isFeatured: false,
    }
  ]

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        creatorId: adminUser.id,
      }
    })
    console.log(`  ✅ Product: ${product.name}`)
  }

  // 8. Create sample groups
  console.log('\n👥 Creating sample groups...')

  const groups = [
    {
      name: '[SAMPLE] Komunitas Eksportir Indonesia',
      slug: 'sample-komunitas-eksportir',
      description: 'Komunitas para eksportir Indonesia untuk berbagi pengalaman, tips, dan networking.',
      avatar: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
      coverImage: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260',
      type: 'PUBLIC',
      isActive: true,
    },
    {
      name: '[SAMPLE] Forum Diskusi UMKM Ekspor',
      slug: 'sample-forum-umkm-ekspor',
      description: 'Tempat diskusi khusus untuk pelaku UMKM yang ingin mulai atau sudah ekspor.',
      avatar: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=400',
      coverImage: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=1260',
      type: 'PUBLIC',
      isActive: true,
    },
    {
      name: '[SAMPLE] Private Club Member Premium',
      slug: 'sample-private-club-premium',
      description: 'Grup eksklusif untuk member premium dengan akses ke mentor dan diskusi private.',
      avatar: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400',
      coverImage: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260',
      type: 'PRIVATE',
      isActive: true,
    },
    {
      name: '[SAMPLE] Ekspor ke Eropa',
      slug: 'sample-ekspor-eropa',
      description: 'Diskusi khusus tentang ekspor ke pasar Eropa - regulasi, buyer, dan strategi.',
      avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
      coverImage: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260',
      type: 'PUBLIC',
      isActive: true,
    }
  ]

  for (const groupData of groups) {
    const group = await prisma.group.create({
      data: {
        ...groupData,
        ownerId: adminUser.id,
      }
    })

    // Add premium member to group
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: premiumMember.id,
        role: 'MEMBER',
      }
    })

    // Add admin as owner
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: adminUser.id,
        role: 'OWNER',
      }
    })

    // Create some sample posts
    const posts = [
      `Selamat datang di ${group.name}! Silakan perkenalkan diri Anda.`,
      'Tips hari ini: Pastikan dokumen ekspor Anda sudah lengkap sebelum pengiriman!',
      'Ada yang punya pengalaman ekspor ke negara Timur Tengah? Share di sini ya!',
    ]

    for (const content of posts) {
      await prisma.post.create({
        data: {
          authorId: adminUser.id,
          groupId: group.id,
          content,
          type: 'POST',
        }
      })
    }

    console.log(`  ✅ Group: ${group.name} (3 posts, 2 members)`)
  }

  // 9. Summary
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Sample data created successfully!')
  console.log('='.repeat(50))
  console.log(`
📊 Summary:
  - 3 Sample Courses (1 completed, 1 in progress, 1 not started)
  - 3 Sample Events (upcoming webinar, workshop, meetup)
  - 4 Sample Products (template, database, ebook, tool)
  - 4 Sample Groups (with posts and members)

📌 Login as Premium Member to see the dashboard:
  - Email: ${premiumMember.email}
  
🗑️ To remove sample data, run this script again (it cleans up first)
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
