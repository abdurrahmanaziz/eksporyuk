import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  const password = await bcrypt.hash('password123', 10)
  const now = new Date()

  console.log('👥 Users...')
  
  // ADMINS
  const founder = await prisma.user.upsert({
    where: { email: 'founder@eksporyuk.com' },
    update: {},
    create: {
      email: 'founder@eksporyuk.com',
      name: 'Muhammad Founder',
      password: password,
      role: 'ADMIN',
      isFounder: true,
      revenueSharePercent: 60,
      whatsapp: '+62812345601',
      phone: '081234567801',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 100000000,
        }
      }
    }
  })

  // CO-FOUNDER
  const cofounder = await prisma.user.upsert({
    where: { email: 'cofounder@eksporyuk.com' },
    update: {},
    create: {
      email: 'cofounder@eksporyuk.com',
      name: 'Ahmad Co-Founder',
      password: password,
      role: 'ADMIN',
      isCoFounder: true,
      revenueSharePercent: 40,
      whatsapp: '+62812345602',
      phone: '081234567802',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 50000000,
        }
      }
    }
  })

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eksporyuk.com' },
    update: {},
    create: {
      email: 'admin@eksporyuk.com',
      name: 'Budi Administrator',
      password: password,
      role: 'ADMIN',
      whatsapp: '+62812345603',
      phone: '081234567803',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 5000000,
        }
      }
    }
  })

  // MENTORS
  const mentor1 = await prisma.user.upsert({
    where: { email: 'mentor@eksporyuk.com' },
    update: {},
    create: {
      email: 'mentor@eksporyuk.com',
      name: 'Siti Mentor',
      password: password,
      role: 'MENTOR',
      whatsapp: '+62812345604',
      phone: '081234567804',
      isActive: true,
      emailVerified: true,
      bio: 'Mentor berpengalaman di bidang ekspor-impor dengan pengalaman 10 tahun',
      wallet: {
        create: {
          balance: 3000000,
        }
      },
      mentorProfile: {
        create: {
          bio: 'Expert in export business with 10 years experience',
          expertise: 'Export Documentation, International Trade',
          isActive: true,
          commissionRate: 40,
          totalEarnings: 15000000,
        }
      }
    }
  })

  const mentor2 = await prisma.user.upsert({
    where: { email: 'mentor2@eksporyuk.com' },
    update: {},
    create: {
      email: 'mentor2@eksporyuk.com',
      name: 'Rahmat Pengajar',
      password: password,
      role: 'MENTOR',
      whatsapp: '+62812345614',
      phone: '081234567814',
      isActive: true,
      emailVerified: true,
      bio: 'International trade specialist',
      wallet: {
        create: {
          balance: 2500000,
        }
      },
      mentorProfile: {
        create: {
          bio: 'Specializing in international market entry strategies',
          expertise: 'Market Research, Business Development',
          isActive: true,
          commissionRate: 40,
          totalEarnings: 8000000,
        }
      }
    }
  })

  const mentor3 = await prisma.user.upsert({
    where: { email: 'mentor3@eksporyuk.com' },
    update: {},
    create: {
      email: 'mentor3@eksporyuk.com',
      name: 'Lia Instruktur',
      password: password,
      role: 'MENTOR',
      whatsapp: '+62812345624',
      phone: '081234567824',
      isActive: true,
      emailVerified: true,
      bio: 'Export documentation expert',
      wallet: {
        create: {
          balance: 2000000,
        }
      },
      mentorProfile: {
        create: {
          bio: 'Expert in all export documentation and compliance',
          expertise: 'Export Documentation, Customs Compliance',
          isActive: true,
          commissionRate: 40,
          totalEarnings: 6500000,
        }
      }
    }
  })

  // AFFILIATES
  const affiliate1 = await prisma.user.upsert({
    where: { email: 'affiliate@eksporyuk.com' },
    update: {},
    create: {
      email: 'affiliate@eksporyuk.com',
      name: 'Rina Affiliate',
      password: password,
      role: 'AFFILIATE',
      whatsapp: '+62812345605',
      phone: '081234567805',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 2000000,
        }
      },
      affiliateProfile: {
        create: {
          affiliateCode: 'AFF001',
          shortLink: 'rina-affiliate',
          commissionRate: 30,
          isActive: true,
          totalEarnings: 5000000,
          totalConversions: 25,
        }
      }
    }
  })

  const affiliate2 = await prisma.user.upsert({
    where: { email: 'affiliate2@eksporyuk.com' },
    update: {},
    create: {
      email: 'affiliate2@eksporyuk.com',
      name: 'Maya Marketing',
      password: password,
      role: 'AFFILIATE',
      whatsapp: '+62812345615',
      phone: '081234567815',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 1500000,
        }
      },
      affiliateProfile: {
        create: {
          affiliateCode: 'AFF002',
          shortLink: 'maya-marketing',
          commissionRate: 30,
          isActive: true,
          totalEarnings: 3200000,
          totalConversions: 18,
        }
      }
    }
  })

  const affiliate3 = await prisma.user.upsert({
    where: { email: 'affiliate3@eksporyuk.com' },
    update: {},
    create: {
      email: 'affiliate3@eksporyuk.com',
      name: 'Budi Promoter',
      password: password,
      role: 'AFFILIATE',
      whatsapp: '+62812345625',
      phone: '081234567825',
      isActive: true,
      emailVerified: true,
      wallet: {
        create: {
          balance: 1000000,
        }
      },
      affiliateProfile: {
        create: {
          affiliateCode: 'AFF003',
          shortLink: 'budi-promoter',
          commissionRate: 30,
          isActive: true,
          totalEarnings: 2100000,
          totalConversions: 12,
        }
      }
    }
  })

  // MEMBERS
  const premiumMembers = []
  for (let i = 1; i <= 5; i++) {
    const member = await prisma.user.upsert({
      where: { email: `premium${i}@eksporyuk.com` },
      update: {},
      create: {
        email: `premium${i}@eksporyuk.com`,
        name: `Member Premium ${i}`,
        password: password,
        role: 'MEMBER_PREMIUM',
        whatsapp: `+6281234560${i + 5}`,
        phone: `08123456780${i + 5}`,
        isActive: true,
        emailVerified: true,
        wallet: {
          create: {
            balance: 500000 * i,
          }
        }
      }
    })
    premiumMembers.push(member)
  }
  const freeMembers = []
  for (let i = 1; i <= 6; i++) {
    const member = await prisma.user.upsert({
      where: { email: `free${i}@eksporyuk.com` },
      update: {},
      create: {
        email: `free${i}@eksporyuk.com`,
        name: `Member Free ${i}`,
        password: password,
        role: 'MEMBER_FREE',
        whatsapp: `+6281234561${i}`,
        phone: `08123456781${i}`,
        isActive: true,
        emailVerified: i <= 3, // Only first 3 verified
        wallet: {
          create: {
            balance: 0,
          }
        }
      }
    })
    freeMembers.push(member)
  }

  console.log('📦 Memberships...')
  
  const membership1Month = await prisma.membership.upsert({
    where: { slug: 'paket-1bulan' },
    update: {},
    create: {
      name: '1 Bulan',
      slug: 'paket-1bulan',
      description: 'Paket membership 1 bulan',
      duration: 'ONE_MONTH',
      price: 99000,
      originalPrice: 150000,
      discount: 34,
      features: JSON.stringify([
        'Akses penuh selama 1 bulan',
        'Materi ekspor lengkap',
        'Konsultasi mentor',
        'Grup WhatsApp eksklusif',
      ]),
      isActive: true,
      isBestSeller: false,
      isMostPopular: false,
      salesPageUrl: 'https://kelaseksporyuk.com/',
    }
  })

  const membership3Month = await prisma.membership.upsert({
    where: { slug: 'paket-3bulan' },
    update: {},
    create: {
      name: '3 Bulan',
      slug: 'paket-3bulan',
      description: 'Paket membership 3 bulan',
      duration: 'THREE_MONTHS',
      price: 249000,
      originalPrice: 450000,
      discount: 45,
      features: JSON.stringify([
        'Akses penuh selama 3 bulan',
        'Materi ekspor lengkap',
        'Konsultasi mentor unlimited',
        'Grup WhatsApp eksklusif',
        'Update materi terbaru',
      ]),
      isActive: true,
      isBestSeller: false,
      isMostPopular: false,
      salesPageUrl: 'https://kelaseksporyuk.com/3bulan',
    }
  })

  const membership6Month = await prisma.membership.upsert({
    where: { slug: 'paket-6bulan' },
    update: {},
    create: {
      name: '6 Bulan',
      slug: 'paket-6bulan',
      description: 'Paket membership 6 bulan',
      duration: 'SIX_MONTHS',
      price: 449000,
      originalPrice: 831481,
      discount: 46,
      features: JSON.stringify([
        'Akses penuh selama 6 bulan',
        'Materi ekspor lengkap',
        'Konsultasi mentor unlimited',
        'Grup WhatsApp eksklusif',
        'Update materi terbaru',
        'Badge member 6 bulan',
      ]),
      isActive: true,
      isBestSeller: true,
      isMostPopular: false,
      salesPageUrl: 'https://kelaseksporyuk.com/6bulan',
    }
  })

  const membership12Month = await prisma.membership.upsert({
    where: { slug: 'paket-12bulan' },
    update: {},
    create: {
      name: '12 Bulan',
      slug: 'paket-12bulan',
      description: 'Paket membership 12 bulan - Paling Laris',
      duration: 'TWELVE_MONTHS',
      price: 799000,
      originalPrice: 2282857,
      discount: 65,
      features: JSON.stringify([
        'Akses penuh selama 12 bulan',
        'Materi ekspor lengkap',
        'Konsultasi mentor unlimited',
        'Grup WhatsApp eksklusif',
        'Update materi terbaru',
        'Bonus sertifikat',
        'Priority support',
        'Badge member tahunan',
      ]),
      isActive: true,
      isBestSeller: true,
      isMostPopular: true,
      salesPageUrl: 'https://kelaseksporyuk.com/12bulan',
    }
  })

  const membershipLifetime = await prisma.membership.upsert({
    where: { slug: 'paket-lifetime' },
    update: {},
    create: {
      name: 'Lifetime',
      slug: 'paket-lifetime',
      description: 'Akses seumur hidup - Best Investment!',
      duration: 'LIFETIME',
      price: 1499000,
      originalPrice: 5000000,
      discount: 70,
      features: JSON.stringify([
        'Akses SEUMUR HIDUP',
        'Semua materi ekspor',
        'Konsultasi mentor unlimited',
        'Grup WhatsApp eksklusif',
        'Update materi terbaru GRATIS',
        'Sertifikat eksklusif',
        'Priority support 24/7',
        'Badge member lifetime',
        'Bonus template dokumen',
        'Akses event eksklusif',
      ]),
      isActive: true,
      isBestSeller: true,
      isMostPopular: true,
      salesPageUrl: 'https://kelaseksporyuk.com/lifetime',
    }
  })

  console.log('💎 Active memberships...')

  const userMemberships = []
  // Premium member 1: 3 months
  userMemberships.push(await prisma.userMembership.create({
    data: {
      userId: premiumMembers[0].id,
      membershipId: membership3Month.id,
      startDate: now,
      endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isActive: true,
      activatedAt: now,
      price: membership3Month.price,
    }
  }))

  // Premium member 2: 6 months
  userMemberships.push(await prisma.userMembership.create({
    data: {
      userId: premiumMembers[1].id,
      membershipId: membership6Month.id,
      startDate: now,
      endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isActive: true,
      activatedAt: now,
      price: membership6Month.price,
    }
  }))

  // Premium member 3: Lifetime
  userMemberships.push(await prisma.userMembership.create({
    data: {
      userId: premiumMembers[2].id,
      membershipId: membershipLifetime.id,
      startDate: now,
      endDate: new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isActive: true,
      activatedAt: now,
      price: membershipLifetime.price,
    }
  }))

  // Premium member 4: 1 month
  userMemberships.push(await prisma.userMembership.create({
    data: {
      userId: premiumMembers[3].id,
      membershipId: membership1Month.id,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isActive: true,
      activatedAt: now,
      price: membership1Month.price,
    }
  }))

  // Premium member 5: 12 months
  userMemberships.push(await prisma.userMembership.create({
    data: {
      userId: premiumMembers[4].id,
      membershipId: membership12Month.id,
      startDate: now,
      endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isActive: true,
      activatedAt: now,
      price: membership12Month.price,
    }
  }))

  console.log('🎟️  Coupons...')

  await prisma.coupon.create({
    data: {
      code: 'WELCOME50',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      isActive: true,
      validFrom: now,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
      usageCount: 5,
      createdBy: admin.id,
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'NEWMEMBER',
      discountType: 'FIXED',
      discountValue: 100000,
      isActive: true,
      validFrom: now,
      usageLimit: 50,
      usageCount: 3,
      createdBy: admin.id,
    }
  })

  await prisma.coupon.create({
    data: {
      code: 'PREMIUM30',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      isActive: true,
      validFrom: now,
      validUntil: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 200,
      usageCount: 12,
      createdBy: admin.id,
    }
  })

  console.log('📚 Courses...')

  const mentorProfile1 = await prisma.mentorProfile.findUnique({ where: { userId: mentor1.id } })
  const mentorProfile2 = await prisma.mentorProfile.findUnique({ where: { userId: mentor2.id } })
  const mentorProfile3 = await prisma.mentorProfile.findUnique({ where: { userId: mentor3.id } })

  const course1 = await prisma.course.create({
    data: {
      title: 'Dasar-Dasar Ekspor untuk Pemula',
      slug: 'dasar-ekspor-pemula',
      description: 'Pelajari fundamental ekspor dari nol hingga bisa mengirim barang ke luar negeri',
      thumbnail: '/images/courses/ekspor-pemula.jpg',
      price: 0,
      isPublished: true,
      level: 'BEGINNER',
      mentorId: mentorProfile1!.id,
    }
  })

  const course2 = await prisma.course.create({
    data: {
      title: 'Strategi Ekspor ke Jepang',
      slug: 'strategi-ekspor-jepang',
      description: 'Panduan lengkap ekspor produk Indonesia ke pasar Jepang',
      thumbnail: '/images/courses/ekspor-jepang.jpg',
      price: 499000,
      isPublished: true,
      level: 'INTERMEDIATE',
      mentorId: mentorProfile1!.id,
    }
  })

  const course3 = await prisma.course.create({
    data: {
      title: 'Dokumentasi Ekspor Profesional',
      slug: 'dokumentasi-ekspor',
      description: 'Master semua dokumen ekspor: Invoice, Packing List, COO, dan lainnya',
      thumbnail: '/images/courses/dokumentasi.jpg',
      price: 299000,
      isPublished: true,
      level: 'INTERMEDIATE',
      mentorId: mentorProfile3!.id,
    }
  })

  const course4 = await prisma.course.create({
    data: {
      title: 'Mencari Buyer Internasional',
      slug: 'mencari-buyer',
      description: 'Teknik efektif menemukan dan menghubungi buyer potensial di seluruh dunia',
      thumbnail: '/images/courses/buyer.jpg',
      price: 399000,
      isPublished: true,
      level: 'INTERMEDIATE',
      mentorId: mentorProfile2!.id,
    }
  })

  console.log('📝 Enrollments...')

  let enrollmentCount = 0
  for (const member of premiumMembers) {
    await prisma.courseEnrollment.create({
      data: {
        userId: member.id,
        courseId: course1.id,
        progress: Math.floor(Math.random() * 80) + 20,
      }
    })
    enrollmentCount++

    await prisma.courseEnrollment.create({
      data: {
        userId: member.id,
        courseId: course2.id,
        progress: Math.floor(Math.random() * 60),
      }
    })
    enrollmentCount++
  }

  console.log('👥 Groups...')

  const group1 = await prisma.group.create({
    data: {
      name: 'Komunitas Ekspor Indonesia',
      slug: 'komunitas-ekspor',
      description: 'Wadah diskusi eksportir Indonesia untuk berbagi pengalaman',
      type: 'PUBLIC',
      ownerId: admin.id,
      isActive: true,
    }
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'Premium Member Exclusive',
      slug: 'premium-exclusive',
      description: 'Group eksklusif untuk member premium dengan akses ke mentor',
      type: 'PRIVATE',
      ownerId: admin.id,
      isActive: true,
      requireApproval: true,
    }
  })

  const group3 = await prisma.group.create({
    data: {
      name: 'UKM Ekspor Network',
      slug: 'ukm-ekspor',
      description: 'Networking UKM yang sedang atau ingin mulai ekspor',
      type: 'PUBLIC',
      ownerId: mentor2.id,
      isActive: true,
    }
  })

  console.log('👥 Members...')

  // Add owners
  await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      userId: admin.id,
      role: 'OWNER',
    }
  })

  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: admin.id,
      role: 'OWNER',
    }
  })

  await prisma.groupMember.create({
    data: {
      groupId: group3.id,
      userId: mentor2.id,
      role: 'OWNER',
    }
  })

  // Add premium members to groups
  let memberCount = 3
  for (const member of premiumMembers) {
    await prisma.groupMember.create({
      data: {
        groupId: group1.id,
        userId: member.id,
        role: 'MEMBER',
      }
    })

    await prisma.groupMember.create({
      data: {
        groupId: group2.id,
        userId: member.id,
        role: 'MEMBER',
      }
    })
    memberCount += 2
  }

  // Add some free members to public group
  for (let i = 0; i < 3; i++) {
    await prisma.groupMember.create({
      data: {
        groupId: group1.id,
        userId: freeMembers[i].id,
        role: 'MEMBER',
      }
    })
    memberCount++
  }

  console.log('📝 Posts...')

  await prisma.post.create({
    data: {
      content: 'Halo semuanya! Senang bisa bergabung di komunitas ini. Saya baru mulai belajar ekspor, ada tips untuk pemula?',
      authorId: freeMembers[0].id,
      groupId: group1.id,
      type: 'POST',
      approvalStatus: 'APPROVED',
    }
  })

  await prisma.post.create({
    data: {
      content: 'Share pengalaman ekspor pertama saya ke Jepang. Prosesnya tidak semudah yang dibayangkan, tapi worth it! 🎌',
      authorId: premiumMembers[0].id,
      groupId: group2.id,
      type: 'POST',
      approvalStatus: 'APPROVED',
      isPinned: true,
    }
  })

  await prisma.post.create({
    data: {
      content: '📢 Pengumuman: Webinar gratis tentang dokumentasi ekspor minggu depan! Jangan lupa daftar ya!',
      authorId: mentor3.id,
      groupId: group1.id,
      type: 'ANNOUNCEMENT',
      approvalStatus: 'APPROVED',
    }
  })

  console.log('🛍️  Products...')

  await prisma.product.create({
    data: {
      name: 'Template Dokumen Ekspor Lengkap',
      slug: 'template-dokumen-ekspor',
      description: 'Kumpulan template dokumen ekspor profesional (Invoice, Packing List, COO, dll) dalam format Word & Excel',
      price: 149000,
      originalPrice: 299000,
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      creatorId: admin.id,
    }
  })

  await prisma.product.create({
    data: {
      name: 'Database Buyer 1000+ Perusahaan',
      slug: 'database-buyer',
      description: 'Database kontak buyer/importir dari berbagai negara dengan informasi lengkap dan terverifikasi',
      price: 499000,
      productType: 'DIGITAL',
      productStatus: 'PUBLISHED',
      isActive: true,
      creatorId: admin.id,
    }
  })

  console.log('📅 Events...')

  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  await prisma.event.create({
    data: {
      title: 'Workshop: Ekspor untuk UKM',
      description: 'Workshop intensif 2 hari tentang cara memulai ekspor untuk UKM',
      startDate: futureDate,
      endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      type: 'WORKSHOP',
      maxAttendees: 50,
      price: 299000,
      isPublished: true,
      creatorId: mentor2.id,
    }
  })

  await prisma.event.create({
    data: {
      title: 'Webinar Gratis: Pengenalan Ekspor',
      description: 'Webinar gratis untuk pemula yang ingin tahu tentang dunia ekspor',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      type: 'WEBINAR',
      maxAttendees: 200,
      price: 0,
      isPublished: true,
      creatorId: mentor1.id,
    }
  })

  console.log('💰 Transactions...')

  // Success transactions
  await prisma.transaction.create({
    data: {
      userId: premiumMembers[0].id,
      type: 'MEMBERSHIP',
      amount: membership3Month.price,
      status: 'SUCCESS',
      customerName: premiumMembers[0].name,
      customerEmail: premiumMembers[0].email,
      customerPhone: premiumMembers[0].phone,
      paymentMethod: 'bank_transfer',
    }
  })

  await prisma.transaction.create({
    data: {
      userId: premiumMembers[1].id,
      type: 'MEMBERSHIP',
      amount: membership6Month.price,
      status: 'SUCCESS',
      customerName: premiumMembers[1].name,
      customerEmail: premiumMembers[1].email,
      customerPhone: premiumMembers[1].phone,
      paymentMethod: 'ewallet',
    }
  })

  await prisma.transaction.create({
    data: {
      userId: premiumMembers[2].id,
      type: 'MEMBERSHIP',
      amount: membershipLifetime.price,
      status: 'SUCCESS',
      customerName: premiumMembers[2].name,
      customerEmail: premiumMembers[2].email,
      customerPhone: premiumMembers[2].phone,
      paymentMethod: 'bank_transfer',
    }
  })

  // Pending transaction
  await prisma.transaction.create({
    data: {
      userId: freeMembers[0].id,
      type: 'MEMBERSHIP',
      amount: membership1Month.price,
      status: 'PENDING',
      customerName: freeMembers[0].name,
      customerEmail: freeMembers[0].email,
      customerPhone: freeMembers[0].phone,
      paymentMethod: 'bank_transfer',
    }
  })

  console.log('\n✅ SEEDED: 20 users, 5 memberships, 4 courses, 3 groups, 2 products, 2 events')
  console.log('🔑 Login: admin@eksporyuk.com / password123\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
