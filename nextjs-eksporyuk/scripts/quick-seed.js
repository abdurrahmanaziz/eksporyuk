const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Quick Seed Start...\n')

  const pw = await bcrypt.hash('password123', 10)
  const now = new Date()

  // 1. USERS
  console.log('👥 Creating 20 users...')
  
  const founder = await prisma.user.create({
    data: {
      email: 'founder@eksporyuk.com', name: 'Muhammad Founder', password: pw, role: 'ADMIN',
      isFounder: true, revenueSharePercent: 60, whatsapp: '+6281234560', phone: '08123456780',
      isActive: true, emailVerified: true,
      wallet: { create: { balance: 100000000 } }
    }
  })

  const cofounder = await prisma.user.create({
    data: {
      email: 'cofounder@eksporyuk.com', name: 'Ahmad Co-Founder', password: pw, role: 'ADMIN',
      isCoFounder: true, revenueSharePercent: 40, whatsapp: '+6281234561', phone: '08123456781',
      isActive: true, emailVerified: true,
      wallet: { create: { balance: 50000000 } }
    }
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@eksporyuk.com', name: 'Budi Admin', password: pw, role: 'ADMIN',
      whatsapp: '+6281234562', phone: '08123456782', isActive: true, emailVerified: true,
      wallet: { create: { balance: 5000000 } }
    }
  })

  const mentors = []
  for (let i = 1; i <= 3; i++) {
    const mentor = await prisma.user.create({
      data: {
        email: `mentor${i}@eksporyuk.com`, name: `Mentor ${i}`, password: pw, role: 'MENTOR',
        whatsapp: `+628123456${70 + i}`, phone: `0812345678${70 + i}`,
        isActive: true, emailVerified: true, bio: 'Experienced mentor',
        wallet: { create: { balance: 3000000 } },
        mentorProfile: {
          create: {
            bio: 'Expert mentor', expertise: 'Export', isActive: true,
            commissionRate: 40, totalEarnings: 10000000
          }
        }
      }
    })
    mentors.push(mentor)
  }

  const affiliates = []
  for (let i = 1; i <= 3; i++) {
    const aff = await prisma.user.create({
      data: {
        email: `affiliate${i}@eksporyuk.com`, name: `Affiliate ${i}`, password: pw, role: 'AFFILIATE',
        whatsapp: `+628123456${80 + i}`, phone: `0812345678${80 + i}`,
        isActive: true, emailVerified: true,
        wallet: { create: { balance: 2000000 } },
        affiliateProfile: {
          create: {
            affiliateCode: `AFF00${i}`, shortLink: `aff${i}`,
            commissionRate: 30, isActive: true, totalEarnings: 5000000, totalConversions: 20
          }
        }
      }
    })
    affiliates.push(aff)
  }

  const premiums = []
  for (let i = 1; i <= 5; i++) {
    const m = await prisma.user.create({
      data: {
        email: `premium${i}@eksporyuk.com`, name: `Premium ${i}`, password: pw, role: 'MEMBER_PREMIUM',
        whatsapp: `+628123457${i}0`, phone: `08123457${i}00`,
        isActive: true, emailVerified: true,
        wallet: { create: { balance: 500000 } }
      }
    })
    premiums.push(m)
  }

  const frees = []
  for (let i = 1; i <= 6; i++) {
    const m = await prisma.user.create({
      data: {
        email: `free${i}@eksporyuk.com`, name: `Free ${i}`, password: pw, role: 'MEMBER_FREE',
        whatsapp: `+628123458${i}0`, phone: `08123458${i}00`,
        isActive: true, emailVerified: i <= 3,
        wallet: { create: { balance: 0 } }
      }
    })
    frees.push(m)
  }

  // 2. MEMBERSHIPS
  console.log('📦 Creating 5 membership packages...')
  
  const m1 = await prisma.membership.create({
    data: {
      name: '1 Bulan', slug: 'paket-1bulan', description: 'Paket 1 bulan',
      duration: 'ONE_MONTH', price: 99000, originalPrice: 150000, discount: 34,
      features: JSON.stringify(['Akses 1 bulan', 'Materi lengkap']),
      isActive: true, salesPageUrl: 'https://kelaseksporyuk.com/'
    }
  })

  const m3 = await prisma.membership.create({
    data: {
      name: '3 Bulan', slug: 'paket-3bulan', description: 'Paket 3 bulan',
      duration: 'THREE_MONTHS', price: 249000, originalPrice: 450000, discount: 45,
      features: JSON.stringify(['Akses 3 bulan', 'Materi lengkap', 'Konsultasi']),
      isActive: true, salesPageUrl: 'https://kelaseksporyuk.com/3bulan'
    }
  })

  const m6 = await prisma.membership.create({
    data: {
      name: '6 Bulan', slug: 'paket-6bulan', description: 'Paket 6 bulan',
      duration: 'SIX_MONTHS', price: 449000, originalPrice: 831481, discount: 46,
      features: JSON.stringify(['Akses 6 bulan', 'Materi lengkap', 'Konsultasi', 'Badge']),
      isActive: true, isBestSeller: true, salesPageUrl: 'https://kelaseksporyuk.com/6bulan'
    }
  })

  const m12 = await prisma.membership.create({
    data: {
      name: '12 Bulan', slug: 'paket-12bulan', description: 'Paket 12 bulan',
      duration: 'TWELVE_MONTHS', price: 799000, originalPrice: 2282857, discount: 65,
      features: JSON.stringify(['Akses 12 bulan', 'Materi lengkap', 'Konsultasi', 'Badge', 'Sertifikat']),
      isActive: true, isBestSeller: true, isMostPopular: true, salesPageUrl: 'https://kelaseksporyuk.com/12bulan'
    }
  })

  const mlife = await prisma.membership.create({
    data: {
      name: 'Lifetime', slug: 'paket-lifetime', description: 'Akses seumur hidup',
      duration: 'LIFETIME', price: 1499000, originalPrice: 5000000, discount: 70,
      features: JSON.stringify(['Akses SEUMUR HIDUP', 'Semua materi', 'Sertifikat', 'Priority support']),
      isActive: true, isBestSeller: true, isMostPopular: true, salesPageUrl: 'https://kelaseksporyuk.com/lifetime'
    }
  })

  // 3. ACTIVE MEMBERSHIPS
  console.log('💎 Activating 5 memberships...')
  
  await prisma.userMembership.create({
    data: {
      userId: premiums[0].id, membershipId: m3.id,
      startDate: now, endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE', isActive: true, activatedAt: now, price: m3.price
    }
  })

  await prisma.userMembership.create({
    data: {
      userId: premiums[1].id, membershipId: m6.id,
      startDate: now, endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE', isActive: true, activatedAt: now, price: m6.price
    }
  })

  await prisma.userMembership.create({
    data: {
      userId: premiums[2].id, membershipId: mlife.id,
      startDate: now, endDate: new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE', isActive: true, activatedAt: now, price: mlife.price
    }
  })

  await prisma.userMembership.create({
    data: {
      userId: premiums[3].id, membershipId: m1.id,
      startDate: now, endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE', isActive: true, activatedAt: now, price: m1.price
    }
  })

  await prisma.userMembership.create({
    data: {
      userId: premiums[4].id, membershipId: m12.id,
      startDate: now, endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE', isActive: true, activatedAt: now, price: m12.price
    }
  })

  // 4. COUPONS
  console.log('🎟️  Creating 3 coupons...')
  
  await prisma.coupon.create({
    data: {
      code: 'WELCOME50', discountType: 'PERCENTAGE', discountValue: 50,
      isActive: true, validFrom: now,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100, usageCount: 5, createdBy: admin.id
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'NEWMEMBER', discountType: 'FIXED', discountValue: 100000,
      isActive: true, validFrom: now, usageLimit: 50, usageCount: 3, createdBy: admin.id
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'PREMIUM30', discountType: 'PERCENTAGE', discountValue: 30,
      isActive: true, validFrom: now,
      validUntil: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 200, usageCount: 12, createdBy: admin.id
    }
  })

  // 5. COURSES
  console.log('📚 Creating 4 courses...')
  
  const mentorProfiles = await prisma.mentorProfile.findMany()
  
  const c1 = await prisma.course.create({
    data: {
      title: 'Dasar-Dasar Ekspor', slug: 'dasar-ekspor',
      description: 'Pelajari fundamental ekspor', thumbnail: '/images/courses/1.jpg',
      price: 0, isPublished: true, level: 'BEGINNER', mentorId: mentorProfiles[0].id
    }
  })

  const c2 = await prisma.course.create({
    data: {
      title: 'Strategi Ekspor Jepang', slug: 'ekspor-jepang',
      description: 'Panduan ekspor ke Jepang', thumbnail: '/images/courses/2.jpg',
      price: 499000, isPublished: true, level: 'INTERMEDIATE', mentorId: mentorProfiles[0].id
    }
  })

  const c3 = await prisma.course.create({
    data: {
      title: 'Dokumentasi Ekspor', slug: 'dokumentasi',
      description: 'Master dokumen ekspor', thumbnail: '/images/courses/3.jpg',
      price: 299000, isPublished: true, level: 'INTERMEDIATE', mentorId: mentorProfiles[1].id
    }
  })

  const c4 = await prisma.course.create({
    data: {
      title: 'Mencari Buyer', slug: 'mencari-buyer',
      description: 'Teknik mencari buyer', thumbnail: '/images/courses/4.jpg',
      price: 399000, isPublished: true, level: 'INTERMEDIATE', mentorId: mentorProfiles[2].id
    }
  })

  // 6. ENROLLMENTS
  console.log('📝 Enrolling users...')
  
  for (const p of premiums) {
    await prisma.courseEnrollment.create({
      data: { userId: p.id, courseId: c1.id, progress: Math.floor(Math.random() * 80) + 20 }
    })
    await prisma.courseEnrollment.create({
      data: { userId: p.id, courseId: c2.id, progress: Math.floor(Math.random() * 60) }
    })
  }

  // 7. GROUPS
  console.log('👥 Creating 3 groups...')
  
  const g1 = await prisma.group.create({
    data: {
      name: 'Komunitas Ekspor', slug: 'komunitas-ekspor',
      description: 'Diskusi eksportir', type: 'PUBLIC', ownerId: admin.id, isActive: true
    }
  })

  const g2 = await prisma.group.create({
    data: {
      name: 'Premium Exclusive', slug: 'premium-exclusive',
      description: 'Group premium', type: 'PRIVATE', ownerId: admin.id,
      isActive: true, requireApproval: true
    }
  })

  const g3 = await prisma.group.create({
    data: {
      name: 'UKM Network', slug: 'ukm-network',
      description: 'Network UKM', type: 'PUBLIC', ownerId: mentors[1].id, isActive: true
    }
  })

  // 8. GROUP MEMBERS
  await prisma.groupMember.create({ data: { groupId: g1.id, userId: admin.id, role: 'OWNER' } })
  await prisma.groupMember.create({ data: { groupId: g2.id, userId: admin.id, role: 'OWNER' } })
  await prisma.groupMember.create({ data: { groupId: g3.id, userId: mentors[1].id, role: 'OWNER' } })

  for (const p of premiums) {
    await prisma.groupMember.create({ data: { groupId: g1.id, userId: p.id, role: 'MEMBER' } })
    await prisma.groupMember.create({ data: { groupId: g2.id, userId: p.id, role: 'MEMBER' } })
  }

  for (let i = 0; i < 3; i++) {
    await prisma.groupMember.create({ data: { groupId: g1.id, userId: frees[i].id, role: 'MEMBER' } })
  }

  // 9. POSTS
  console.log('📝 Creating 3 posts...')
  
  await prisma.post.create({
    data: {
      content: 'Halo! Saya baru join, ada tips ekspor untuk pemula?',
      authorId: frees[0].id, groupId: g1.id, type: 'POST', approvalStatus: 'APPROVED'
    }
  })

  await prisma.post.create({
    data: {
      content: 'Sharing ekspor pertama ke Jepang! 🎌',
      authorId: premiums[0].id, groupId: g2.id, type: 'POST',
      approvalStatus: 'APPROVED', isPinned: true
    }
  })

  await prisma.post.create({
    data: {
      content: '📢 Webinar gratis minggu depan!',
      authorId: mentors[2].id, groupId: g1.id, type: 'ANNOUNCEMENT', approvalStatus: 'APPROVED'
    }
  })

  // 10. PRODUCTS
  console.log('🛍️  Creating 2 products...')
  
  await prisma.product.create({
    data: {
      name: 'Template Dokumen Ekspor', slug: 'template-dokumen',
      description: 'Kumpulan template ekspor lengkap', price: 149000, originalPrice: 299000,
      productType: 'DIGITAL', productStatus: 'PUBLISHED', isActive: true, creatorId: admin.id
    }
  })

  await prisma.product.create({
    data: {
      name: 'Database Buyer 1000+', slug: 'database-buyer',
      description: 'Database buyer terverifikasi', price: 499000,
      productType: 'DIGITAL', productStatus: 'PUBLISHED', isActive: true, creatorId: admin.id
    }
  })

  // 11. EVENTS
  console.log('📅 Creating 2 events...')
  
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  await prisma.event.create({
    data: {
      title: 'Workshop Ekspor UKM', description: 'Workshop intensif 2 hari',
      startDate: future, endDate: new Date(future.getTime() + 2 * 24 * 60 * 60 * 1000),
      type: 'WORKSHOP', maxAttendees: 50, price: 299000, isPublished: true, creatorId: mentors[1].id
    }
  })

  await prisma.event.create({
    data: {
      title: 'Webinar Gratis Pengenalan Ekspor', description: 'Webinar gratis pemula',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      type: 'WEBINAR', maxAttendees: 200, price: 0, isPublished: true, creatorId: mentors[0].id
    }
  })

  // 12. TRANSACTIONS
  console.log('💰 Creating 4 transactions...')
  
  await prisma.transaction.create({
    data: {
      userId: premiums[0].id, type: 'MEMBERSHIP', amount: m3.price, status: 'SUCCESS',
      customerName: premiums[0].name, customerEmail: premiums[0].email,
      customerPhone: premiums[0].phone, paymentMethod: 'bank_transfer'
    }
  })

  await prisma.transaction.create({
    data: {
      userId: premiums[1].id, type: 'MEMBERSHIP', amount: m6.price, status: 'SUCCESS',
      customerName: premiums[1].name, customerEmail: premiums[1].email,
      customerPhone: premiums[1].phone, paymentMethod: 'ewallet'
    }
  })

  await prisma.transaction.create({
    data: {
      userId: premiums[2].id, type: 'MEMBERSHIP', amount: mlife.price, status: 'SUCCESS',
      customerName: premiums[2].name, customerEmail: premiums[2].email,
      customerPhone: premiums[2].phone, paymentMethod: 'bank_transfer'
    }
  })

  await prisma.transaction.create({
    data: {
      userId: frees[0].id, type: 'MEMBERSHIP', amount: m1.price, status: 'PENDING',
      customerName: frees[0].name, customerEmail: frees[0].email,
      customerPhone: frees[0].phone, paymentMethod: 'bank_transfer'
    }
  })

  console.log('\n✅ DONE! 20 users, 5 memberships, 4 courses, 3 groups, 2 products, 2 events')
  console.log('🔑 Login: admin@eksporyuk.com / password123\n')
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
