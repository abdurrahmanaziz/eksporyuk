const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding essential data...\n');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eksporyuk.com' },
    update: {},
    create: {
      email: 'admin@eksporyuk.com',
      name: 'Admin Eksporyuk',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      whatsapp: '+6281234567890',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user:', admin.email);

  // Create admin wallet
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 0,
      balancePending: 0,
    },
  });
  console.log('✅ Admin wallet created');

  // 2. Create Affiliate User
  const affiliatePassword = await bcrypt.hash('affiliate123', 10);
  const affiliate = await prisma.user.upsert({
    where: { email: 'abdurrahmanaziz83@gmail.com' },
    update: {},
    create: {
      email: 'abdurrahmanaziz83@gmail.com',
      name: 'Abdurrahman Aziz',
      username: 'abdurrahmanaziz',
      password: affiliatePassword,
      role: 'AFFILIATE',
      whatsapp: '+6281234567891',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Affiliate user:', affiliate.email);

  // Create affiliate wallet
  await prisma.wallet.upsert({
    where: { userId: affiliate.id },
    update: {},
    create: {
      userId: affiliate.id,
      balance: 0,
      balancePending: 0,
    },
  });

  // Create affiliate profile
  const affiliateProfile = await prisma.affiliateProfile.upsert({
    where: { userId: affiliate.id },
    update: {},
    create: {
      userId: affiliate.id,
      affiliateCode: 'abdurrahmanaziz',
      tier: 'BRONZE',
      isActive: true,
      profileCompleted: true,
      bankName: 'BCA',
      bankAccountName: 'Abdurrahman Aziz',
      bankAccountNumber: '1234567890',
    },
  });
  console.log('✅ Affiliate profile:', affiliateProfile.affiliateCode);

  // 3. Create Memberships
  const memberships = [
    {
      id: 'mem_promo_2025',
      name: 'Promo Akhir Tahun 2025',
      slug: 'promo-akhir-tahun-2025',
      description: 'Promo spesial akhir tahun 2025',
      price: 1348000,
      originalPrice: 2696000,
      durationDays: 365,
      isActive: true,
      isPublished: true,
      affiliateCommissionRate: 30,
      affiliateCommissionType: 'PERCENTAGE',
    },
    {
      id: 'mem_12_bulan',
      name: 'Paket 12 Bulan',
      slug: 'paket-12-bulan',
      description: 'Akses premium selama 12 bulan',
      price: 2696000,
      originalPrice: 2696000,
      durationDays: 365,
      isActive: true,
      isPublished: true,
      affiliateCommissionRate: 30,
      affiliateCommissionType: 'PERCENTAGE',
    },
    {
      id: 'mem_6_bulan',
      name: 'Paket 6 Bulan',
      slug: 'paket-6-bulan',
      description: 'Akses premium selama 6 bulan',
      price: 1498000,
      originalPrice: 1498000,
      durationDays: 180,
      isActive: true,
      isPublished: true,
      affiliateCommissionRate: 25,
      affiliateCommissionType: 'PERCENTAGE',
    },
    {
      id: 'mem_lifetime_ekspor',
      name: 'Paket Lifetime',
      slug: 'paket-lifetime',
      description: 'Akses seumur hidup',
      price: 4996000,
      originalPrice: 4996000,
      durationDays: null,
      isLifetime: true,
      isActive: true,
      isPublished: true,
      affiliateCommissionRate: 35,
      affiliateCommissionType: 'PERCENTAGE',
    },
  ];

  for (const mem of memberships) {
    await prisma.membership.upsert({
      where: { id: mem.id },
      update: mem,
      create: mem,
    });
    console.log('✅ Membership:', mem.name);
  }

  // 4. Create Products
  const product = await prisma.product.upsert({
    where: { id: 'prod_kelas_ekspor' },
    update: {},
    create: {
      id: 'prod_kelas_ekspor',
      name: 'Kelas Ekspor Sejoli',
      slug: 'kelas-ekspor-sejoli',
      description: 'Kelas lengkap belajar ekspor',
      price: 500000,
      type: 'DIGITAL',
      isActive: true,
      isPublished: true,
      affiliateCommissionRate: 20,
      affiliateCommissionType: 'PERCENTAGE',
    },
  });
  console.log('✅ Product:', product.name);

  // 5. Create Coupons
  const coupons = [
    {
      id: 'coupon_eksporyuk',
      code: 'EKSPORYUK',
      name: 'Diskon Eksporyuk',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxUses: 1000,
      usedCount: 0,
      isActive: true,
      isPublic: true,
    },
    {
      id: 'coupon_promo_2025',
      code: 'PROMOAKHIRTAHUN2025',
      name: 'Promo Akhir Tahun 2025',
      discountType: 'FIXED',
      discountValue: 1348000,
      maxUses: 500,
      usedCount: 0,
      isActive: true,
      isPublic: true,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { id: coupon.id },
      update: coupon,
      create: coupon,
    });
    console.log('✅ Coupon:', coupon.code);
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
