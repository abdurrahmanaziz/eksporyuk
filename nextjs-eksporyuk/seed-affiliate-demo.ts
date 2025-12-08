import { PrismaClient, MembershipDuration, CommissionType, ProductType, ProductStatus, AccessLevel, CourseStatus, CourseMonetizationType, EventType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMemberships() {
  console.log('🌱 Seeding memberships...');

  const memberships = [
    {
      name: 'Membership Ekspor Pemula',
      slug: 'membership-ekspor-pemula',
      checkoutSlug: 'beli-ekspor-pemula',
      description: 'Paket lengkap untuk pemula yang ingin memulai bisnis ekspor dari nol',
      duration: MembershipDuration.ONE_MONTH,
      price: 299000,
      originalPrice: 499000,
      discount: 40,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 30,
      features: JSON.stringify([
        'Akses grup komunitas eksklusif',
        'Materi ekspor untuk pemula',
        'Template dokumen ekspor',
        'Support via WhatsApp',
        'Update konten bulanan'
      ]),
      isBestSeller: false,
      isPopular: true,
      isActive: true,
      salesPageUrl: 'https://eksporyuk.com/membership/pemula',
    },
    {
      name: 'Membership Professional Eksportir',
      slug: 'membership-professional',
      checkoutSlug: 'beli-professional',
      description: 'Untuk eksportir serius yang ingin scale up bisnis dengan strategi profesional',
      duration: MembershipDuration.THREE_MONTHS,
      price: 799000,
      originalPrice: 1499000,
      discount: 47,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 35,
      features: JSON.stringify([
        'Semua fitur Pemula',
        '10+ course premium',
        'Konsultasi 1-on-1',
        'Database buyer internasional',
        'Tools kalkulasi ekspor',
        'Sertifikat digital'
      ]),
      isBestSeller: true,
      isPopular: true,
      isMostPopular: true,
      isActive: true,
      salesPageUrl: 'https://eksporyuk.com/membership/professional',
    },
    {
      name: 'Membership Lifetime Access',
      slug: 'membership-lifetime',
      checkoutSlug: 'beli-lifetime',
      description: 'Akses selamanya ke SEMUA konten, tools, dan update tanpa batas waktu',
      duration: MembershipDuration.LIFETIME,
      price: 4999000,
      originalPrice: 9999000,
      discount: 50,
      commissionType: CommissionType.FLAT,
      affiliateCommissionRate: 1000000,
      features: JSON.stringify([
        'Akses SELAMANYA',
        'Semua course gratis',
        'Semua produk gratis',
        'Unlimited konsultasi',
        'VIP support',
        'Early access fitur baru'
      ]),
      isBestSeller: true,
      isPopular: false,
      isActive: true,
      salesPageUrl: 'https://eksporyuk.com/membership/lifetime',
    }
  ];

  for (const membership of memberships) {
    const existing = await prisma.membership.findUnique({
      where: { slug: membership.slug }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${membership.name} - already exists`);
      continue;
    }

    await prisma.membership.create({ data: membership });
    console.log(`✅ Created: ${membership.name}`);
  }
}

async function seedProducts() {
  console.log('\n🌱 Seeding products...');

  // Get or create a user to be the creator
  let creator = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  });

  if (!creator) {
    creator = await prisma.user.findFirst();
  }

  if (!creator) {
    console.log('⚠️  No user found to be product creator. Skipping products.');
    return;
  }

  const products = [
    {
      creatorId: creator.id,
      name: 'Template Dokumen Ekspor Lengkap',
      slug: 'template-dokumen-ekspor',
      checkoutSlug: 'beli-template-ekspor',
      description: 'Kumpulan lengkap template dokumen ekspor yang sudah terbukti digunakan oleh ribuan eksportir sukses. Termasuk Invoice, Packing List, Certificate of Origin, dan 20+ dokumen lainnya.',
      shortDescription: 'Template lengkap untuk semua kebutuhan dokumen ekspor',
      price: 199000,
      originalPrice: 399000,
      thumbnail: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
      salesPageUrl: 'https://eksporyuk.com/product/template-dokumen',
      productType: ProductType.DIGITAL,
      productStatus: ProductStatus.PUBLISHED,
      accessLevel: AccessLevel.PUBLIC,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 40,
      isActive: true,
      isFeatured: true,
      soldCount: 127,
      tags: JSON.stringify(['template', 'dokumen', 'ekspor', 'digital']),
    },
    {
      creatorId: creator.id,
      name: 'E-Book: Rahasia Sukses Ekspor ke Eropa',
      slug: 'ebook-ekspor-eropa',
      checkoutSlug: 'beli-ebook-eropa',
      description: 'Panduan lengkap 200+ halaman tentang cara ekspor ke pasar Eropa. Mulai dari riset produk, mencari buyer, negosiasi, hingga shipping dan payment terms.',
      shortDescription: 'Panduan lengkap ekspor ke pasar Eropa',
      price: 149000,
      originalPrice: 299000,
      thumbnail: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      salesPageUrl: 'https://eksporyuk.com/product/ebook-eropa',
      productType: ProductType.DIGITAL,
      productStatus: ProductStatus.PUBLISHED,
      accessLevel: AccessLevel.PUBLIC,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 35,
      isActive: true,
      isFeatured: true,
      soldCount: 89,
      tags: JSON.stringify(['ebook', 'ekspor', 'eropa', 'panduan']),
    },
    {
      creatorId: creator.id,
      name: 'Database 1000+ Buyer Internasional',
      slug: 'database-buyer',
      checkoutSlug: 'beli-database-buyer',
      description: 'Database verified buyer dari berbagai negara yang aktif mencari supplier dari Indonesia. Termasuk contact person, email, produk yang dicari, dan volume order.',
      shortDescription: 'Database verified buyer dari seluruh dunia',
      price: 499000,
      originalPrice: 999000,
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      salesPageUrl: 'https://eksporyuk.com/product/database-buyer',
      productType: ProductType.DIGITAL,
      productStatus: ProductStatus.PUBLISHED,
      accessLevel: AccessLevel.PREMIUM,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 30,
      isActive: true,
      isFeatured: true,
      soldCount: 45,
      tags: JSON.stringify(['database', 'buyer', 'ekspor', 'b2b']),
    },
    {
      creatorId: creator.id,
      name: 'Tools Kalkulasi Harga Ekspor Otomatis',
      slug: 'tools-kalkulasi-ekspor',
      checkoutSlug: 'beli-tools-kalkulasi',
      description: 'Software berbasis Excel untuk menghitung harga ekspor, termasuk FOB, CIF, profit margin, pajak, dan biaya-biaya lainnya secara otomatis. Sudah include tutorial penggunaan.',
      shortDescription: 'Software kalkulasi harga ekspor otomatis',
      price: 299000,
      originalPrice: 599000,
      thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      salesPageUrl: 'https://eksporyuk.com/product/tools-kalkulasi',
      productType: ProductType.DIGITAL,
      productStatus: ProductStatus.PUBLISHED,
      accessLevel: AccessLevel.PUBLIC,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 35,
      isActive: true,
      isFeatured: false,
      soldCount: 67,
      tags: JSON.stringify(['tools', 'software', 'kalkulasi', 'ekspor']),
    }
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${product.name} - already exists`);
      continue;
    }

    await prisma.product.create({ data: product });
    console.log(`✅ Created: ${product.name}`);
  }
}

async function seedCourses() {
  console.log('\n🌱 Seeding courses...');

  // Get or create a mentor profile
  let mentor = await prisma.mentorProfile.findFirst();

  if (!mentor) {
    // Try to find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@eksporyuk.com' }
    });

    if (adminUser) {
      // Create mentor profile for admin
      mentor = await prisma.mentorProfile.create({
        data: {
          userId: adminUser.id,
          bio: 'Mentor ekspor profesional dengan pengalaman 10+ tahun',
          expertise: 'Ekspor, Bisnis Internasional, B2B Marketing',
          commissionRate: 30,
          isActive: true,
          rating: 4.8,
          totalStudents: 1250,
          totalCourses: 8,
          totalEarnings: 0,
        }
      });
      console.log('✅ Created mentor profile for admin');
    } else {
      console.log('⚠️  No user found to create mentor. Skipping courses.');
      return;
    }
  }

  const courses = [
    {
      mentorId: mentor.id,
      title: 'Kelas Ekspor untuk Pemula',
      slug: 'kelas-ekspor-pemula',
      checkoutSlug: 'beli-kelas-ekspor-pemula',
      description: 'Kursus lengkap untuk pemula yang ingin memulai bisnis ekspor dari nol. Belajar step-by-step dari riset produk, mencari buyer, negosiasi, hingga pengiriman barang. Dengan studi kasus nyata dan template siap pakai.',
      thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400',
      price: 499000,
      originalPrice: 999000,
      mentorCommissionPercent: 50,
      duration: 30,
      level: 'Pemula',
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
      monetizationType: CourseMonetizationType.PAID,
      enrollmentCount: 234,
      rating: 4.7,
      affiliateOnly: false,
    },
    {
      mentorId: mentor.id,
      title: 'Mastering Export Documentation',
      slug: 'mastering-export-documentation',
      checkoutSlug: 'beli-export-documentation',
      description: 'Pelajari semua tentang dokumen ekspor: Invoice, Packing List, Bill of Lading, Certificate of Origin, dan dokumen penting lainnya. Termasuk cara mengisi, tips menghindari rejection, dan contoh dokumen asli.',
      thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
      price: 399000,
      originalPrice: 799000,
      mentorCommissionPercent: 50,
      duration: 20,
      level: 'Menengah',
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
      monetizationType: CourseMonetizationType.PAID,
      enrollmentCount: 156,
      rating: 4.8,
      affiliateOnly: false,
    },
    {
      mentorId: mentor.id,
      title: 'Strategi Negosiasi dengan Buyer Internasional',
      slug: 'negosiasi-buyer-internasional',
      checkoutSlug: 'beli-negosiasi-internasional',
      description: 'Teknik negosiasi profesional untuk mendapatkan deal terbaik dengan buyer luar negeri. Belajar komunikasi cross-culture, menangani objection, dan closing deal dengan payment term yang aman.',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      price: 599000,
      originalPrice: 1199000,
      mentorCommissionPercent: 50,
      duration: 25,
      level: 'Menengah',
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
      monetizationType: CourseMonetizationType.PAID,
      enrollmentCount: 98,
      rating: 4.9,
      affiliateOnly: false,
    },
    {
      mentorId: mentor.id,
      title: 'Digital Marketing untuk Eksportir',
      slug: 'digital-marketing-eksportir',
      checkoutSlug: 'beli-digital-marketing',
      description: 'Cara memanfaatkan digital marketing (LinkedIn, Alibaba, IndiaMART, dll) untuk mencari buyer dan promosi produk ekspor. Termasuk strategi SEO, content marketing, dan email outreach yang proven work.',
      thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400',
      price: 699000,
      originalPrice: 1399000,
      mentorCommissionPercent: 50,
      duration: 40,
      level: 'Lanjutan',
      status: CourseStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
      monetizationType: CourseMonetizationType.PAID,
      enrollmentCount: 167,
      rating: 4.8,
      affiliateOnly: false,
    }
  ];

  for (const course of courses) {
    const existing = await prisma.course.findUnique({
      where: { slug: course.slug }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${course.title} - already exists`);
      continue;
    }

    await prisma.course.create({ data: course });
    console.log(`✅ Created: ${course.title}`);
  }
}

async function seedEvents() {
  console.log('\n🌱 Seeding events...');

  // Get or create a user to be the creator
  let creator = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  });

  if (!creator) {
    creator = await prisma.user.findFirst();
  }

  if (!creator) {
    console.log('⚠️  No user found to be event creator. Skipping events.');
    return;
  }

  // Create events for next 30 days
  const today = new Date();
  
  const events = [
    {
      creatorId: creator.id,
      title: 'Webinar: Cara Mencari Buyer di Alibaba',
      description: 'Webinar eksklusif tentang strategi mencari dan approach buyer melalui platform Alibaba.com. Langsung praktek dan live demo. Akan dibagikan juga template email yang proven work untuk mendapat respon buyer.',
      thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      type: EventType.WEBINAR,
      startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
      meetingUrl: 'https://zoom.us/j/123456789',
      meetingId: '123 456 789',
      meetingPassword: 'ekspor123',
      maxAttendees: 100,
      price: 99000,
      commissionType: CommissionType.PERCENTAGE,
      commissionRate: 30,
      isPublished: true,
      isFeatured: true,
    },
    {
      creatorId: creator.id,
      title: 'Workshop: Export Documentation Masterclass',
      description: 'Workshop intensif 3 jam tentang dokumen ekspor. Peserta akan praktek langsung mengisi dokumen Invoice, Packing List, Bill of Lading, dan Certificate of Origin dengan bimbingan mentor berpengalaman.',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      type: EventType.WORKSHOP,
      startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      meetingUrl: 'https://zoom.us/j/987654321',
      meetingId: '987 654 321',
      meetingPassword: 'workshop2025',
      maxAttendees: 50,
      price: 199000,
      commissionType: CommissionType.PERCENTAGE,
      commissionRate: 35,
      isPublished: true,
      isFeatured: true,
    },
    {
      creatorId: creator.id,
      title: 'Meetup Eksportir Indonesia',
      description: 'Gathering offline untuk para eksportir di Jakarta. Networking, sharing session, dan diskusi santai tentang perkembangan bisnis ekspor. Bonus: Door prize menarik untuk peserta!',
      thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
      type: EventType.MEETUP,
      startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4 hours
      location: 'Hotel Aston Priority, Jakarta Selatan',
      maxAttendees: 150,
      price: 0, // Free event
      isPublished: true,
      isFeatured: true,
    },
    {
      creatorId: creator.id,
      title: 'Live Training: Negosiasi Payment Terms',
      description: 'Sesi live training tentang cara negosiasi payment terms yang aman dengan buyer internasional. Belajar tentang LC, TT, DP, dan metode payment lainnya. Plus tips menghindari scam dan penipuan.',
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
      type: EventType.WEBINAR,
      startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // +1.5 hours
      meetingUrl: 'https://zoom.us/j/555777888',
      meetingId: '555 777 888',
      meetingPassword: 'payment2025',
      maxAttendees: 200,
      price: 149000,
      commissionType: CommissionType.PERCENTAGE,
      commissionRate: 30,
      isPublished: true,
      isFeatured: false,
    },
    {
      creatorId: creator.id,
      title: 'Coaching Session: Scale Up Bisnis Ekspor',
      description: 'Session coaching eksklusif untuk eksportir yang sudah running dan ingin scale up. Membahas strategi ekspansi, team building, sistem operasional, dan cara meningkatkan profit margin.',
      thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400',
      type: EventType.CONFERENCE,
      startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      endDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // +5 hours
      meetingUrl: 'https://zoom.us/j/111222333',
      meetingId: '111 222 333',
      meetingPassword: 'scaleup123',
      maxAttendees: 30,
      price: 499000,
      commissionType: CommissionType.FLAT,
      commissionRate: 150000,
      isPublished: true,
      isFeatured: true,
    }
  ];

  for (const event of events) {
    // Check if similar event exists (same title and start date)
    const existing = await prisma.event.findFirst({
      where: { 
        title: event.title,
        startDate: event.startDate
      }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${event.title} - already exists`);
      continue;
    }

    await prisma.event.create({ data: event });
    console.log(`✅ Created: ${event.title}`);
  }
}

async function main() {
  console.log('🚀 Starting Affiliate Demo Data Seeder...\n');
  console.log('This will create sample data for:');
  console.log('- Memberships');
  console.log('- Products');
  console.log('- Courses');
  console.log('- Events\n');
  
  try {
    await seedMemberships();
    await seedProducts();
    await seedCourses();
    await seedEvents();
    
    console.log('\n🎉 All done! Your affiliate demo data is ready.');
    console.log('\n📊 Summary:');
    
    const membershipCount = await prisma.membership.count();
    const productCount = await prisma.product.count();
    const courseCount = await prisma.course.count();
    const eventCount = await prisma.event.count();
    
    console.log(`   - Memberships: ${membershipCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - Events: ${eventCount}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
