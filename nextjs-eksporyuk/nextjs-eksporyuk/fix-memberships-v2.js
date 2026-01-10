const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping membership name ke data yang benar
const MEMBERSHIP_DATA = {
  'Lifetime': {
    price: 999000,
    duration: 'LIFETIME',
    commissionRate: 325000
  },
  '12 Bulan': {
    price: 899000,
    duration: 'TWELVE_MONTHS',
    commissionRate: 250000
  },
  '6 Bulan': {
    price: 699000,
    duration: 'SIX_MONTHS',
    commissionRate: 200000
  },
  '3 Bulan': {
    price: 399000,
    duration: 'THREE_MONTHS',
    commissionRate: 100000
  },
  '1 Bulan': {
    price: 199000,
    duration: 'ONE_MONTH',
    commissionRate: 50000
  }
};

async function main() {
  console.log('=== FIX MEMBERSHIP PLANS ===\n');
  
  // Update each membership plan
  for (const [name, data] of Object.entries(MEMBERSHIP_DATA)) {
    const updated = await prisma.membership.updateMany({
      where: { name },
      data: {
        price: data.price,
        duration: data.duration,
        affiliateCommissionRate: data.commissionRate,
        commissionType: 'FLAT',
        isActive: true
      }
    });
    console.log(`✓ Updated "${name}": Price=Rp ${data.price.toLocaleString('id-ID')}, Duration=${data.duration}, Commission=Rp ${data.commissionRate.toLocaleString('id-ID')}`);
  }
  
  // Show updated plans
  console.log('\n=== MEMBERSHIP PLANS AFTER UPDATE ===');
  const plans = await prisma.membership.findMany({ orderBy: { price: 'desc' }});
  plans.forEach(p => {
    console.log(`- ${p.name} | Rp ${Number(p.price).toLocaleString('id-ID')} | ${p.duration} | Commission: Rp ${Number(p.affiliateCommissionRate).toLocaleString('id-ID')} (${p.commissionType})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

