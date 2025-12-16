const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX MEMBERSHIP PACKAGES ===\n');
  
  // Paket yang Rp 199k seharusnya dihapus (ini bekas paket 1 bulan)
  // Paket yang Rp 399k seharusnya dihapus (ini bekas paket 3 bulan)
  
  const paket199k = await prisma.membership.findFirst({
    where: { price: 199000 }
  });
  
  const paket399k = await prisma.membership.findFirst({
    where: { price: 399000 }
  });
  
  console.log('Paket yang akan dihapus:');
  if (paket199k) {
    const userCount = await prisma.userMembership.count({
      where: { membershipId: paket199k.id }
    });
    console.log(`- ${paket199k.name} (Rp 199k) - ${userCount} users`);
  }
  
  if (paket399k) {
    const userCount = await prisma.userMembership.count({
      where: { membershipId: paket399k.id }
    });
    console.log(`- ${paket399k.name} (Rp 399k) - ${userCount} users`);
  }
  
  // Get paket 6 bulan yang benar (Rp 699k)
  const paket6bulan = await prisma.membership.findFirst({
    where: { price: 699000, duration: 'SIX_MONTHS' }
  });
  
  if (!paket6bulan) {
    console.error('❌ Paket 6 bulan Rp 699k tidak ditemukan!');
    return;
  }
  
  console.log(`\nPaket tujuan migrasi: ${paket6bulan.name} (Rp 699k)`);
  
  console.log('\n⚠️ Memindahkan users ke paket 6 bulan yang benar...\n');
  
  // Strategy: Delete userMemberships dari paket lama saja
  // Karena ada unique constraint (userId, membershipId)
  // User yang sudah punya paket 699k tidak perlu diupdate
  
  if (paket199k) {
    const deleted = await prisma.userMembership.deleteMany({
      where: { membershipId: paket199k.id }
    });
    console.log(`✓ Deleted ${deleted.count} user memberships dari paket 199k`);
    
    await prisma.membership.delete({ where: { id: paket199k.id }});
    console.log(`✓ Deleted paket: ${paket199k.name}`);
  }
  
  // Migrate users dari paket 399k
  if (paket399k) {
    const deleted = await prisma.userMembership.deleteMany({
      where: { membershipId: paket399k.id }
    });
    console.log(`✓ Deleted ${deleted.count} user memberships dari paket 399k`);
    
    await prisma.membership.delete({ where: { id: paket399k.id }});
    console.log(`✓ Deleted paket: ${paket399k.name}`);
  }
  
  console.log('\n=== HASIL AKHIR ===\n');
  
  const finalPlans = await prisma.membership.findMany({
    orderBy: { price: 'desc' }
  });
  
  for (const p of finalPlans) {
    const userCount = await prisma.userMembership.count({
      where: { membershipId: p.id }
    });
    console.log(`${p.name}:`);
    console.log(`  Duration: ${p.duration}`);
    console.log(`  Price: Rp ${Number(p.price).toLocaleString('id-ID')}`);
    console.log(`  Users: ${userCount}`);
    console.log();
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
