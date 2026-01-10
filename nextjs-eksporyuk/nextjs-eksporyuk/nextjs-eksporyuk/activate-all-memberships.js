const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAll() {
  console.log('=== MENGAKTIFKAN SEMUA MEMBERSHIP ===\n');
  
  // Update semua membership jadi aktif
  const result = await prisma.membership.updateMany({
    where: {},
    data: {
      isActive: true,
      status: 'PUBLISHED'
    }
  });
  
  console.log('✅ Total membership diaktifkan:', result.count);
  console.log('');
  
  // Cek hasil
  const all = await prisma.membership.findMany({
    orderBy: { price: 'desc' }
  });
  
  console.log('=== STATUS SETELAH UPDATE ===\n');
  all.forEach((m, i) => {
    console.log((i+1) + '. ' + m.name);
    console.log('   isActive: ' + (m.isActive ? '✅ YES' : '❌ NO'));
    console.log('   status: ' + m.status);
    console.log('');
  });
  
  // Get all membership IDs
  const allIds = all.map(m => m.id);
  console.log('=== UPDATE KUPON EKSPORYUK ===\n');
  
  // Update kupon EKSPORYUK dengan semua membership IDs
  const coupon = await prisma.coupon.updateMany({
    where: { code: 'EKSPORYUK' },
    data: {
      membershipIds: allIds,
      isActive: true
    }
  });
  
  console.log('✅ Kupon EKSPORYUK updated dengan', allIds.length, 'membership');
  
  // Verify
  const updated = await prisma.coupon.findFirst({
    where: { code: 'EKSPORYUK' }
  });
  
  if (updated) {
    console.log('');
    console.log('Kupon EKSPORYUK sekarang berlaku untuk:');
    for (const id of updated.membershipIds) {
      const m = all.find(mem => mem.id === id);
      if (m) console.log('  ✅ ' + m.name);
    }
  }
  
  await prisma.$disconnect();
}

activateAll();
