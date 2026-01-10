const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullAudit() {
  console.log('=== AUDIT LENGKAP MEMBERSHIP & KUPON ===\n');
  
  // 1. CEK SEMUA MEMBERSHIP
  console.log('📦 1. SEMUA MEMBERSHIP:');
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      duration: true,
      price: true,
      isActive: true,
      status: true,
      showInGeneralCheckout: true
    },
    orderBy: { price: 'desc' }
  });
  
  memberships.forEach((m, i) => {
    console.log(`\n${i+1}. ${m.name}`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Slug: ${m.slug}`);
    console.log(`   Duration: ${m.duration}`);
    console.log(`   Price: Rp ${Number(m.price).toLocaleString()}`);
    console.log(`   isActive: ${m.isActive ? '✅' : '❌'}`);
    console.log(`   status: ${m.status}`);
    console.log(`   showInGeneralCheckout: ${m.showInGeneralCheckout ? '✅' : '❌'}`);
  });
  
  // 2. CEK KUPON AFFILIATE
  console.log('\n\n🎫 2. KUPON AFFILIATE:');
  const coupons = await prisma.coupon.findMany({
    where: { isAffiliateEnabled: true },
    select: {
      id: true,
      code: true,
      isActive: true,
      membershipIds: true,
      discountType: true,
      discountValue: true
    }
  });
  
  for (const c of coupons) {
    console.log(`\nKupon: ${c.code}`);
    console.log(`  isActive: ${c.isActive ? '✅' : '❌'}`);
    console.log(`  Discount: ${c.discountType} ${c.discountValue}`);
    console.log(`  MembershipIds: ${c.membershipIds ? c.membershipIds.length : 0} items`);
    
    if (c.membershipIds && c.membershipIds.length > 0) {
      console.log('  Applies to:');
      for (const mid of c.membershipIds) {
        const m = memberships.find(mem => mem.id === mid);
        if (m) {
          console.log(`    - ${m.name} (${m.duration}) - Active: ${m.isActive ? '✅' : '❌'}`);
        } else {
          console.log(`    - ❌ UNKNOWN ID: ${mid}`);
        }
      }
    }
  }
  
  // 3. CEK MEMBERSHIP YANG TIDAK ADA DI KUPON
  console.log('\n\n⚠️ 3. MEMBERSHIP TIDAK INCLUDE DI KUPON EKSPORYUK:');
  const eksporyukCoupon = coupons.find(c => c.code === 'EKSPORYUK');
  if (eksporyukCoupon && eksporyukCoupon.membershipIds) {
    const missingInCoupon = memberships.filter(m => 
      m.isActive && !eksporyukCoupon.membershipIds.includes(m.id)
    );
    if (missingInCoupon.length > 0) {
      missingInCoupon.forEach(m => {
        console.log(`  ❌ ${m.name} (${m.id}) - TIDAK ADA di kupon!`);
      });
    } else {
      console.log('  ✅ Semua membership aktif sudah include');
    }
  }
  
  await prisma.$disconnect();
}

fullAudit();
