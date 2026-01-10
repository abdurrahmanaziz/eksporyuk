const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MIGRASI PAKET 1 BULAN & 3 BULAN KE 6 BULAN ===\n');
  
  // Get 6 months plan untuk referensi
  const sixMonthsPlan = await prisma.membership.findFirst({
    where: { duration: 'SIX_MONTHS' }
  });
  
  if (!sixMonthsPlan) {
    console.error('❌ Paket 6 bulan tidak ditemukan!');
    return;
  }
  
  console.log(`✓ Paket 6 bulan ditemukan: ${sixMonthsPlan.name} (${sixMonthsPlan.slug})`);
  console.log(`  Harga: Rp ${Number(sixMonthsPlan.price).toLocaleString('id-ID')}\n`);
  
  // Get ONE_MONTH & THREE_MONTHS plans
  const oneMonthPlan = await prisma.membership.findFirst({
    where: { duration: 'ONE_MONTH' }
  });
  
  const threeMonthsPlan = await prisma.membership.findFirst({
    where: { duration: 'THREE_MONTHS' }
  });
  
  console.log('PAKET YANG AKAN DIHAPUS:');
  if (oneMonthPlan) {
    console.log(`- ${oneMonthPlan.name} (${oneMonthPlan.slug}) | ${oneMonthPlan.duration}`);
  }
  if (threeMonthsPlan) {
    console.log(`- ${threeMonthsPlan.name} (${threeMonthsPlan.slug}) | ${threeMonthsPlan.duration}`);
  }
  
  console.log('\n⚠️  MIGRASI DIMULAI...\n');
  
  // Update UserMemberships from ONE_MONTH to SIX_MONTHS plan
  if (oneMonthPlan) {
    const updateOneMonth = await prisma.userMembership.updateMany({
      where: { membershipId: oneMonthPlan.id },
      data: { membershipId: sixMonthsPlan.id }
    });
    
    console.log(`✓ Migrated ${updateOneMonth.count} user memberships from ONE_MONTH to SIX_MONTHS`);
  }
  
  // Update UserMemberships from THREE_MONTHS to SIX_MONTHS plan
  if (threeMonthsPlan) {
    const updateThreeMonths = await prisma.userMembership.updateMany({
      where: { membershipId: threeMonthsPlan.id },
      data: { membershipId: sixMonthsPlan.id }
    });
    
    console.log(`✓ Migrated ${updateThreeMonths.count} user memberships from THREE_MONTHS to SIX_MONTHS`);
  }
  
  console.log('\n=== HAPUS PAKET LAMA ===\n');
  
  // Delete ONE_MONTH plan
  if (oneMonthPlan) {
    await prisma.membership.delete({
      where: { id: oneMonthPlan.id }
    });
    console.log(`✓ Deleted ONE_MONTH plan: ${oneMonthPlan.name}`);
  }
  
  // Delete THREE_MONTHS plan
  if (threeMonthsPlan) {
    await prisma.membership.delete({
      where: { id: threeMonthsPlan.id }
    });
    console.log(`✓ Deleted THREE_MONTHS plan: ${threeMonthsPlan.name}`);
  }
  
  console.log('\n=== VERIFIKASI HASIL ===\n');
  
  // Verify no more ONE_MONTH or THREE_MONTHS
  const remainingOneMonth = await prisma.membership.count({
    where: { duration: 'ONE_MONTH' }
  });
  
  const remainingThreeMonths = await prisma.membership.count({
    where: { duration: 'THREE_MONTHS' }
  });
  
  console.log(`Remaining ONE_MONTH plans: ${remainingOneMonth}`);
  console.log(`Remaining THREE_MONTHS plans: ${remainingThreeMonths}`);
  
  // Show updated memberships count
  const totalSixMonths = await prisma.userMembership.count({
    where: { membershipId: sixMonthsPlan.id }
  });
  
  console.log(`\nTotal user memberships di paket 6 bulan: ${totalSixMonths}`);
  
  // Show all durations
  const allDurations = await prisma.membership.groupBy({
    by: ['duration'],
    _count: { duration: true }
  });
  
  console.log(`\n✅ MIGRASI SELESAI! Paket yang tersisa:\n`);
  allDurations.forEach(d => {
    console.log(`  - ${d.duration}: ${d._count.duration} paket`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
