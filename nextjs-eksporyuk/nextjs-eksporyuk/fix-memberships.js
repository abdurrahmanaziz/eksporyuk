const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Data harga dari Sejoli API
const MEMBERSHIP_DATA = {
  'Lifetime': {
    price: 999000,
    durationMonths: null, // null = lifetime
    sejoliProductIds: [28, 93, 179, 1529, 3840, 4684, 6068, 6810, 11207, 13401, 15234, 16956, 17920, 19296, 20852]
  },
  '12 Bulan': {
    price: 899000,
    durationMonths: 12,
    sejoliProductIds: [8683, 13399]
  },
  '6 Bulan': {
    price: 699000,
    durationMonths: 6,
    sejoliProductIds: [8684, 13400]
  },
  '3 Bulan': {
    price: 399000,
    durationMonths: 3,
    sejoliProductIds: []
  },
  '1 Bulan': {
    price: 199000,
    durationMonths: 1,
    sejoliProductIds: []
  }
};

// Commission per membership type
const COMMISSION_MAP = {
  'Lifetime': 325000,
  '12 Bulan': 250000,  // Sesuai commision map: 8683/13399
  '6 Bulan': 200000,   // Sesuai commission map: 8684/13400
  '3 Bulan': 100000,
  '1 Bulan': 50000
};

async function main() {
  console.log('=== FIX MEMBERSHIP PLANS ===\n');
  
  // Update membership plans
  for (const [name, data] of Object.entries(MEMBERSHIP_DATA)) {
    const updated = await prisma.membership.updateMany({
      where: { name },
      data: {
        price: data.price,
        durationMonths: data.durationMonths,
        affiliateCommissionRate: COMMISSION_MAP[name],
        affiliateCommissionType: 'FLAT',
        isActive: true
      }
    });
    console.log(`✓ Updated "${name}": Price=Rp ${data.price.toLocaleString('id-ID')}, Duration=${data.durationMonths || 'Lifetime'} months, Commission=Rp ${COMMISSION_MAP[name].toLocaleString('id-ID')}`);
  }
  
  // Show updated plans
  console.log('\n=== MEMBERSHIP PLANS AFTER UPDATE ===');
  const plans = await prisma.membership.findMany({ orderBy: { price: 'desc' }});
  plans.forEach(p => {
    console.log(`- ${p.name} | Rp ${Number(p.price).toLocaleString('id-ID')} | ${p.durationMonths || 'Lifetime'} months | Commission: Rp ${Number(p.affiliateCommissionRate).toLocaleString('id-ID')}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

