const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed sample data...\n')

  // Get admin user (assuming first user is admin)
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.error('❌ No admin user found! Please create an admin user first.')
    return
  }

  console.log(`✅ Found admin user: ${adminUser.email}`)

  // Create MentorProfile for admin if doesn't exist
  let mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: adminUser.id }
  })

  if (!mentorProfile) {
    mentorProfile = await prisma.mentorProfile.create({
      data: {
        userId: adminUser.id,
        bio: 'Expert in export business with 10+ years experience',
        expertise: 'Export Strategy, International Trade, Business Development',
        totalStudents: 0,
        totalEarnings: 0,
        commissionRate: 50,
        isActive: true,
      }
    })
    console.log(`✅ Created mentor profile for admin`)
  }

  // 1. Create Sample Groups
  console.log('\n📁 Creating sample groups...')
  
  const group1 = await prisma.group.upsert({
    where: { id: 'sample-group-ekspor-pemula' },
    update: {},
    create: {
      id: 'sample-group-ekspor-pemula',
      name: 'Komunitas Ekspor Pemula',
      description: 'Komunitas untuk eksportir pemula yang baru memulai bisnis ekspor',
      type: 'PUBLIC',
      ownerId: adminUser.id,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${group1.name}`)

  const group2 = await prisma.group.upsert({
    where: { id: 'sample-group-ekspor-advanced' },
    update: {},
    create: {
      id: 'sample-group-ekspor-advanced',
      name: 'Ekspor Advanced Masterclass',
      description: 'Grup eksklusif untuk eksportir berpengalaman',
      type: 'PRIVATE',
      ownerId: adminUser.id,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${group2.name}`)

  const group3 = await prisma.group.upsert({
    where: { id: 'sample-group-vip' },
    update: {},
    create: {
      id: 'sample-group-vip',
      name: 'VIP Member Eksklusif',
      description: 'Grup VIP dengan akses premium resources dan mentoring',
      type: 'PRIVATE',
      ownerId: adminUser.id,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${group3.name}`)

  // 2. Create Sample Courses
  console.log('\n📚 Creating sample courses...')

  const course1 = await prisma.course.upsert({
    where: { id: 'sample-course-basic' },
    update: {},
    create: {
      id: 'sample-course-basic',
      title: 'Dasar-dasar Ekspor untuk Pemula',
      description: 'Pelajari fundamental ekspor dari A-Z, cocok untuk yang baru memulai',
      price: 500000,
      originalPrice: 1000000,
      duration: 12,
      level: 'BEGINNER',
      isPublished: true,
      groupId: group1.id,
      mentorId: mentorProfile.id,
    },
  })
  console.log(`  ✓ Created: ${course1.title}`)

  const course2 = await prisma.course.upsert({
    where: { id: 'sample-course-intermediate' },
    update: {},
    create: {
      id: 'sample-course-intermediate',
      title: 'Strategi Ekspor untuk Scale Business',
      description: 'Tingkatkan volume ekspor Anda dengan strategi proven yang tepat',
      price: 1500000,
      originalPrice: 3000000,
      duration: 20,
      level: 'INTERMEDIATE',
      isPublished: true,
      groupId: group2.id,
      mentorId: mentorProfile.id,
    },
  })
  console.log(`  ✓ Created: ${course2.title}`)

  const course3 = await prisma.course.upsert({
    where: { id: 'sample-course-advanced' },
    update: {},
    create: {
      id: 'sample-course-advanced',
      title: 'Export Mastery: Legal & Compliance',
      description: 'Master compliance, legal documents, dan international trade regulations',
      price: 2500000,
      originalPrice: 5000000,
      duration: 30,
      level: 'ADVANCED',
      isPublished: true,
      groupId: group3.id,
      mentorId: mentorProfile.id,
    },
  })
  console.log(`  ✓ Created: ${course3.title}`)

  const course4 = await prisma.course.upsert({
    where: { id: 'sample-course-bonus' },
    update: {},
    create: {
      id: 'sample-course-bonus',
      title: 'BONUS: Marketing Digital untuk Eksportir',
      description: 'Strategi pemasaran digital untuk menjangkau buyer internasional',
      price: 0,
      originalPrice: 1500000,
      duration: 8,
      level: 'INTERMEDIATE',
      isPublished: true,
      mentorId: mentorProfile.id,
    },
  })
  console.log(`  ✓ Created: ${course4.title}`)

  // 3. Create Sample Memberships with Groups & Courses
  console.log('\n💎 Creating sample memberships...')

  const membershipBasic = await prisma.membership.upsert({
    where: { id: 'sample-membership-basic' },
    update: {},
    create: {
      id: 'sample-membership-basic',
      name: 'Membership Basic',
      slug: 'basic',
      description: 'Akses ke komunitas dan 1 kursus dasar',
      duration: 'ONE_MONTH',
      price: 500000,
      originalPrice: 1000000,
      features: [
        'Akses Komunitas Ekspor Pemula',
        '1 Kursus: Dasar-dasar Ekspor',
        'Lifetime access ke course materials',
        'Sertifikat digital',
      ],
      isBestSeller: false,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${membershipBasic.name}`)

  // Clear existing relations first
  await prisma.membershipGroup.deleteMany({
    where: { membershipId: membershipBasic.id }
  })
  await prisma.membershipCourse.deleteMany({
    where: { membershipId: membershipBasic.id }
  })

  // Link Basic Membership to Groups
  await prisma.membershipGroup.createMany({
    data: [
      { membershipId: membershipBasic.id, groupId: group1.id },
    ],
  })

  // Link Basic Membership to Courses
  await prisma.membershipCourse.createMany({
    data: [
      { membershipId: membershipBasic.id, courseId: course1.id },
    ],
  })
  console.log(`    → Linked: 1 group, 1 course`)

  const membershipPro = await prisma.membership.upsert({
    where: { id: 'sample-membership-pro' },
    update: {},
    create: {
      id: 'sample-membership-pro',
      name: 'Membership PRO',
      slug: 'pro',
      description: 'Full akses ke 2 grup dan 3 kursus premium',
      duration: 'THREE_MONTHS',
      price: 2500000,
      originalPrice: 5000000,
      features: [
        'Akses 2 Komunitas (Pemula + Advanced)',
        '3 Kursus Premium',
        'Live Q&A session bulanan',
        'Priority support',
        'Sertifikat profesional',
      ],
      isBestSeller: true,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${membershipPro.name}`)

  // Clear existing relations first
  await prisma.membershipGroup.deleteMany({
    where: { membershipId: membershipPro.id }
  })
  await prisma.membershipCourse.deleteMany({
    where: { membershipId: membershipPro.id }
  })

  // Link Pro Membership to Groups
  await prisma.membershipGroup.createMany({
    data: [
      { membershipId: membershipPro.id, groupId: group1.id },
      { membershipId: membershipPro.id, groupId: group2.id },
    ],
  })

  // Link Pro Membership to Courses
  await prisma.membershipCourse.createMany({
    data: [
      { membershipId: membershipPro.id, courseId: course1.id },
      { membershipId: membershipPro.id, courseId: course2.id },
      { membershipId: membershipPro.id, courseId: course4.id },
    ],
  })
  console.log(`    → Linked: 2 groups, 3 courses`)

  const membershipVIP = await prisma.membership.upsert({
    where: { id: 'sample-membership-vip' },
    update: {},
    create: {
      id: 'sample-membership-vip',
      name: 'Membership VIP',
      slug: 'vip',
      description: 'All-access pass dengan personal mentoring',
      duration: 'TWELVE_MONTHS',
      price: 10000000,
      originalPrice: 20000000,
      features: [
        'Akses SEMUA Komunitas & Groups',
        'Akses SEMUA Kursus (sekarang & yang akan datang)',
        '1-on-1 Personal Mentoring (2x/bulan)',
        'Priority email & WA support 24/7',
        'Exclusive networking events',
        'Sertifikat Master Eksportir',
        'Update content selamanya',
      ],
      isBestSeller: false,
      isActive: true,
    },
  })
  console.log(`  ✓ Created: ${membershipVIP.name}`)

  // Clear existing relations first
  await prisma.membershipGroup.deleteMany({
    where: { membershipId: membershipVIP.id }
  })
  await prisma.membershipCourse.deleteMany({
    where: { membershipId: membershipVIP.id }
  })

  // Link VIP Membership to ALL Groups
  await prisma.membershipGroup.createMany({
    data: [
      { membershipId: membershipVIP.id, groupId: group1.id },
      { membershipId: membershipVIP.id, groupId: group2.id },
      { membershipId: membershipVIP.id, groupId: group3.id },
    ],
  })

  // Link VIP Membership to ALL Courses
  await prisma.membershipCourse.createMany({
    data: [
      { membershipId: membershipVIP.id, courseId: course1.id },
      { membershipId: membershipVIP.id, courseId: course2.id },
      { membershipId: membershipVIP.id, courseId: course3.id },
      { membershipId: membershipVIP.id, courseId: course4.id },
    ],
  })
  console.log(`    → Linked: 3 groups, 4 courses`)

  console.log('\n✨ Sample data seeding completed!\n')
  console.log('📊 Summary:')
  console.log(`   - Groups: 3`)
  console.log(`   - Courses: 4`)
  console.log(`   - Memberships: 3`)
  console.log(`\n🔗 Relationships:`)
  console.log(`   - Basic: 1 group + 1 course`)
  console.log(`   - PRO: 2 groups + 3 courses`)
  console.log(`   - VIP: 3 groups + 4 courses (ALL ACCESS)`)
  console.log(`\n✅ Ready to test membership integration!`)
}

main()
  .catch((e) => {
    console.error('\n❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
