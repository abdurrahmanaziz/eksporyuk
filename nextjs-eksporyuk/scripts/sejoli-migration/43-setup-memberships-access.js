/**
 * Setup Memberships, Product Mapping & User Access
 * 
 * 1. Buat 3 paket membership: 6 bulan, 12 bulan, lifetime
 * 2. Map produk ke membership berdasarkan nama produk
 * 3. Buat UserMembership untuk user yang sudah transaksi
 * 4. Update role user menjadi MEMBER_PREMIUM
 * 
 * SAFE: Tidak menghapus data apapun
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Product name patterns for each membership type
const MEMBERSHIP_PATTERNS = {
  SIX_MONTHS: [
    '6 Bulan',
    '6 bulan'
  ],
  TWELVE_MONTHS: [
    '12 Bulan', 
    '12 bulan'
  ],
  LIFETIME: [
    'Lifetime',
    'lifetime',
    'Bundling',
    'bundling',
    'Kelas Eksporyuk', // Original main product
    'Kelas Bimbingan',
    'eksporyuk' // Original product
  ]
};

// Products that grant membership access (exclude events, webinars, renewals, etc)
const MEMBERSHIP_PRODUCTS = [
  'Paket Ekspor Yuk Lifetime',
  'Bundling Kelas Ekspor + Aplikasi EYA',
  'Kelas Eksporyuk',
  'Kelas Ekspor Yuk 12 Bulan',
  'Paket Ekspor Yuk 6 Bulan',
  'Kelas Bimbingan Ekspor Yuk',
  'Paket Ekspor Yuk 12 Bulan',
  'Kelas Ekspor Yuk 6 Bulan',
  'eksporyuk',
  'Eksporyuk Prelaunch',
  'Promo MEI Paket Lifetime 2025',
  'Promo Paket Lifetime THR 2025',
  'Promo Juli Happy 1-7 Juli 2024',
  'Promo Kemerdekaan',
  'Promo Merdeka Ke-80',
  'Promo 10.10 2025',
  'Promo Lifetime Tahun Baru Islam 1447 Hijriah',
  'Ultah Ekspor Yuk'
];

// Products that don't grant membership (webinar, event, renewal, jasa, tools)
const NON_MEMBERSHIP_KEYWORDS = [
  'Webinar', 'Zoom', 'Kopdar', 'Workshop', 'Tiket',
  'Re Kelas', 'Renewal',
  'Jasa', 'Website',
  'Aplikasi EYA', 'EYA DEKSTOP', 'Ekspor Yuk Automation',
  'Donasi', 'Kaos', 'Katalog', 'Company Profile',
  'Gratis', 'Umroh', 'Titip Barang', 'Trade Expo',
  'DP Trade', 'Legalitas'
];

function getMembershipDuration(productName) {
  // Check if it's a non-membership product
  for (const keyword of NON_MEMBERSHIP_KEYWORDS) {
    if (productName.includes(keyword)) {
      return null; // No membership
    }
  }
  
  // Check 6 bulan patterns
  for (const pattern of MEMBERSHIP_PATTERNS.SIX_MONTHS) {
    if (productName.includes(pattern)) {
      return 'SIX_MONTHS';
    }
  }
  
  // Check 12 bulan patterns
  for (const pattern of MEMBERSHIP_PATTERNS.TWELVE_MONTHS) {
    if (productName.includes(pattern)) {
      return 'TWELVE_MONTHS';
    }
  }
  
  // Check lifetime patterns (default for main products)
  for (const pattern of MEMBERSHIP_PATTERNS.LIFETIME) {
    if (productName.includes(pattern)) {
      return 'LIFETIME';
    }
  }
  
  // Check if it's in membership products list
  if (MEMBERSHIP_PRODUCTS.includes(productName)) {
    return 'LIFETIME'; // Default to lifetime for main products
  }
  
  return null; // No membership
}

function calculateEndDate(duration, startDate) {
  const date = new Date(startDate);
  
  switch (duration) {
    case 'SIX_MONTHS':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'TWELVE_MONTHS':
      date.setMonth(date.getMonth() + 12);
      break;
    case 'LIFETIME':
      date.setFullYear(date.getFullYear() + 100); // 100 years = lifetime
      break;
  }
  
  return date;
}

async function main() {
  console.log('==========================================');
  console.log('SETUP MEMBERSHIPS & USER ACCESS');
  console.log('==========================================\n');

  // 1. Get KELAS BIMBINGAN course ID
  console.log('📚 Finding KELAS BIMBINGAN course...');
  const kelasBimbingan = await prisma.course.findFirst({
    where: { title: { contains: 'KELAS BIMBINGAN' } }
  });
  
  if (!kelasBimbingan) {
    console.log('❌ KELAS BIMBINGAN not found! Please run lesson migration first.');
    return;
  }
  console.log(`   Found: ${kelasBimbingan.title} (${kelasBimbingan.id})`);

  // 2. Create/update 3 memberships
  console.log('\n📦 Creating/updating memberships...');
  
  const memberships = [
    {
      name: 'Paket Ekspor Yuk 6 Bulan',
      slug: 'paket-6-bulan',
      checkoutSlug: 'checkout-6-bulan',
      description: 'Akses kelas ekspor selama 6 bulan dengan materi lengkap dan grup support',
      duration: 'SIX_MONTHS',
      price: 699000,
      originalPrice: 899000,
      discount: 22,
      affiliateCommissionRate: 250000,
      commissionType: 'FLAT',
      features: JSON.stringify([
        'Akses KELAS BIMBINGAN EKSPOR YUK',
        'Materi video lengkap',
        'Grup support WhatsApp',
        'Zoominar bulanan',
        'Zoom mingguan',
        'Durasi akses 6 bulan'
      ]),
      isBestSeller: false,
      isPopular: true,
      isActive: true,
      status: 'PUBLISHED'
    },
    {
      name: 'Paket Ekspor Yuk 12 Bulan',
      slug: 'paket-12-bulan',
      checkoutSlug: 'checkout-12-bulan',
      description: 'Akses kelas ekspor selama 12 bulan dengan materi lengkap dan grup support',
      duration: 'TWELVE_MONTHS',
      price: 899000,
      originalPrice: 1299000,
      discount: 30,
      affiliateCommissionRate: 300000,
      commissionType: 'FLAT',
      features: JSON.stringify([
        'Akses KELAS BIMBINGAN EKSPOR YUK',
        'Materi video lengkap',
        'Grup support WhatsApp',
        'Zoominar bulanan',
        'Zoom mingguan',
        'Durasi akses 12 bulan'
      ]),
      isBestSeller: true,
      isPopular: true,
      isActive: true,
      status: 'PUBLISHED'
    },
    {
      name: 'Paket Ekspor Yuk Lifetime',
      slug: 'paket-lifetime',
      checkoutSlug: 'checkout-lifetime',
      description: 'Akses LIFETIME kelas ekspor dengan semua benefit premium',
      duration: 'LIFETIME',
      price: 999000,
      originalPrice: 1999000,
      discount: 50,
      affiliateCommissionRate: 325000,
      commissionType: 'FLAT',
      features: JSON.stringify([
        'Akses KELAS BIMBINGAN EKSPOR YUK SELAMANYA',
        'Materi video lengkap',
        'Grup support WhatsApp VIP',
        'Zoominar bulanan',
        'Zoom mingguan',
        'Update materi gratis selamanya',
        'Priority support'
      ]),
      isBestSeller: true,
      isPopular: true,
      isMostPopular: true,
      isActive: true,
      status: 'PUBLISHED'
    }
  ];

  const membershipMap = {}; // duration -> membershipId

  for (const m of memberships) {
    let membership = await prisma.membership.findFirst({
      where: { slug: m.slug }
    });

    if (membership) {
      // Update existing
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: m
      });
      console.log(`   ✅ Updated: ${m.name}`);
    } else {
      // Create new
      membership = await prisma.membership.create({
        data: m
      });
      console.log(`   ✅ Created: ${m.name}`);
    }

    membershipMap[m.duration] = membership.id;

    // Link membership to course
    const existingLink = await prisma.membershipCourse.findFirst({
      where: { membershipId: membership.id, courseId: kelasBimbingan.id }
    });

    if (!existingLink) {
      await prisma.membershipCourse.create({
        data: {
          membershipId: membership.id,
          courseId: kelasBimbingan.id
        }
      });
      console.log(`      → Linked to ${kelasBimbingan.title}`);
    }
  }

  // 3. Get all products
  console.log('\n🏷️ Mapping products to memberships...');
  const products = await prisma.product.findMany({
    where: {
      slug: { startsWith: 'sejoli-' }
    }
  });
  
  console.log(`   Found ${products.length} Sejoli products`);

  let productsMapped = 0;
  let productsSkipped = 0;

  for (const product of products) {
    const duration = getMembershipDuration(product.name);
    
    if (duration && membershipMap[duration]) {
      // Create MembershipProduct link if not exists
      const existing = await prisma.membershipProduct.findFirst({
        where: { productId: product.id }
      });

      if (!existing) {
        await prisma.membershipProduct.create({
          data: {
            membershipId: membershipMap[duration],
            productId: product.id
          }
        });
        productsMapped++;
      }
    } else {
      productsSkipped++;
    }
  }
  
  console.log(`   Mapped: ${productsMapped} products`);
  console.log(`   Skipped: ${productsSkipped} products (webinar/event/jasa/tools)`);

  // 4. Create UserMembership for transactions
  console.log('\n👥 Creating UserMembership for buyers...');
  
  // Get all SUCCESS transactions with products
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      productId: { not: null }
    },
    select: {
      id: true,
      userId: true,
      productId: true,
      amount: true,
      createdAt: true
    }
  });

  console.log(`   Found ${transactions.length} successful transactions`);

  // Group by user to avoid duplicates and get their best membership
  const userMemberships = {}; // userId -> { membershipId, duration, startDate, transactionId, price }
  
  for (const tx of transactions) {
    const product = await prisma.product.findUnique({
      where: { id: tx.productId }
    });
    
    if (!product) continue;
    
    const duration = getMembershipDuration(product.name);
    if (!duration || !membershipMap[duration]) continue;
    
    const membershipId = membershipMap[duration];
    
    // Priority: LIFETIME > TWELVE_MONTHS > SIX_MONTHS
    const durationPriority = {
      'LIFETIME': 3,
      'TWELVE_MONTHS': 2,
      'SIX_MONTHS': 1
    };
    
    if (!userMemberships[tx.userId]) {
      userMemberships[tx.userId] = {
        membershipId,
        duration,
        startDate: tx.createdAt,
        transactionId: tx.id,
        price: tx.amount
      };
    } else {
      // Keep the higher priority membership
      const currentPriority = durationPriority[userMemberships[tx.userId].duration];
      const newPriority = durationPriority[duration];
      
      if (newPriority > currentPriority) {
        userMemberships[tx.userId] = {
          membershipId,
          duration,
          startDate: tx.createdAt,
          transactionId: tx.id,
          price: tx.amount
        };
      }
    }
  }

  let membershipsCreated = 0;
  let membershipsSkipped = 0;
  let usersUpgraded = 0;

  for (const [userId, data] of Object.entries(userMemberships)) {
    // Check if UserMembership already exists
    const existing = await prisma.userMembership.findFirst({
      where: { userId, membershipId: data.membershipId }
    });

    if (existing) {
      membershipsSkipped++;
      continue;
    }

    // Calculate end date
    const endDate = calculateEndDate(data.duration, data.startDate);

    try {
      await prisma.userMembership.create({
        data: {
          userId,
          membershipId: data.membershipId,
          startDate: data.startDate,
          endDate,
          isActive: true,
          status: 'ACTIVE',
          activatedAt: data.startDate,
          price: data.price,
          transactionId: data.transactionId
        }
      });
      membershipsCreated++;

      // Update user role to MEMBER_PREMIUM
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (user && user.role === 'MEMBER_FREE') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_PREMIUM' }
        });
        usersUpgraded++;
      }
    } catch (error) {
      // Likely unique constraint violation, skip
      membershipsSkipped++;
    }
  }

  console.log(`   UserMemberships created: ${membershipsCreated}`);
  console.log(`   UserMemberships skipped (existing): ${membershipsSkipped}`);
  console.log(`   Users upgraded to MEMBER_PREMIUM: ${usersUpgraded}`);

  // 5. Summary
  console.log('\n==========================================');
  console.log('SUMMARY');
  console.log('==========================================');
  
  // Count memberships by type
  const sixMonthUsers = await prisma.userMembership.count({
    where: { membershipId: membershipMap['SIX_MONTHS'] }
  });
  const twelveMonthUsers = await prisma.userMembership.count({
    where: { membershipId: membershipMap['TWELVE_MONTHS'] }
  });
  const lifetimeUsers = await prisma.userMembership.count({
    where: { membershipId: membershipMap['LIFETIME'] }
  });

  console.log('\nMembership Distribution:');
  console.log(`   6 Bulan: ${sixMonthUsers} users`);
  console.log(`   12 Bulan: ${twelveMonthUsers} users`);
  console.log(`   Lifetime: ${lifetimeUsers} users`);
  console.log(`   Total: ${sixMonthUsers + twelveMonthUsers + lifetimeUsers} premium members`);

  // Count roles
  const premiumCount = await prisma.user.count({
    where: { role: 'MEMBER_PREMIUM' }
  });
  const freeCount = await prisma.user.count({
    where: { role: 'MEMBER_FREE' }
  });

  console.log('\nUser Roles:');
  console.log(`   MEMBER_PREMIUM: ${premiumCount}`);
  console.log(`   MEMBER_FREE: ${freeCount}`);

  await prisma.$disconnect();
  console.log('\n✅ Setup completed successfully!');
}

main().catch(console.error);
