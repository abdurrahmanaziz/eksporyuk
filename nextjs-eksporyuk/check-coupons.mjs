import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCoupons() {
  console.log('📋 Cek kupon affiliate...\n');
  
  const affiliate = await prisma.affiliateProfile.findFirst({
    where: { user: { role: 'AFFILIATE' } },
    include: { user: true }
  });
  
  if (!affiliate) {
    console.log('❌ Affiliate tidak ditemukan');
    return;
  }
  
  const coupons = await prisma.coupon.findMany({
    where: {
      createdBy: affiliate.userId,
      isActive: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`👤 Affiliate: ${affiliate.user.email}`);
  console.log(`📊 Total kupon aktif: ${coupons.length}\n`);
  
  if (coupons.length > 0) {
    console.log('Kupon yang tersedia:');
    coupons.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.code} - ${c.discountType} ${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : 'K'}`);
      console.log(`     membershipIds: ${JSON.stringify(c.membershipIds)}`);
      console.log(`     productIds: ${JSON.stringify(c.productIds)}`);
      console.log(`     courseIds: ${JSON.stringify(c.courseIds)}`);
      console.log('');
    });
  } else {
    console.log('⚠️  Belum ada kupon dibuat!');
    console.log('💡 Buat kupon di /affiliate/coupons terlebih dahulu');
  }
  
  await prisma.$disconnect();
}

checkCoupons().catch(console.error);
