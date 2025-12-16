const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UBAH PAKET 1 BULAN & 3 BULAN MENJADI 6 BULAN ===\n');
  
  // Strategi: Ubah duration dari ONE_MONTH & THREE_MONTHS menjadi SIX_MONTHS
  // Sehingga tidak perlu migrate user memberships (no unique constraint issue)
  
  // Get ONE_MONTH plan
  const oneMonthPlan = await prisma.membership.findFirst({
    where: { duration: 'ONE_MONTH' }
  });
  
  // Get THREE_MONTHS plan
  const threeMonthsPlan = await prisma.membership.findFirst({
    where: { duration: 'THREE_MONTHS' }
  });
  
  console.log('PAKET YANG AKAN DIUBAH:');
  
  if (oneMonthPlan) {
    console.log(`\n1. ${oneMonthPlan.name} (${oneMonthPlan.slug})`);
    console.log(`   Current: ${oneMonthPlan.duration} | Rp ${Number(oneMonthPlan.price).toLocaleString('id-ID')}`);
    
    const userCount = await prisma.userMembership.count({
      where: { membershipId: oneMonthPlan.id }
    });
    console.log(`   Users: ${userCount}`);
    
    // Update to SIX_MONTHS
    await prisma.membership.update({
      where: { id: oneMonthPlan.id },
      data: { 
        duration: 'SIX_MONTHS',
        name: '6 Bulan (upgrade dari 1 bulan)',
        slug: 'paket-6bulan-upgrade-1bulan'
      }
    });
    
    console.log(`   ✓ Updated to SIX_MONTHS`);
  }
  
  if (threeMonthsPlan) {
    console.log(`\n2. ${threeMonthsPlan.name} (${threeMonthsPlan.slug})`);
    console.log(`   Current: ${threeMonthsPlan.duration} | Rp ${Number(threeMonthsPlan.price).toLocaleString('id-ID')}`);
    
    const userCount = await prisma.userMembership.count({
      where: { membershipId: threeMonthsPlan.id }
    });
    console.log(`   Users: ${userCount}`);
    
    // Update to SIX_MONTHS
    await prisma.membership.update({
      where: { id: threeMonthsPlan.id },
      data: { 
        duration: 'SIX_MONTHS',
        name: '6 Bulan (upgrade dari 3 bulan)',
        slug: 'paket-6bulan-upgrade-3bulan'
      }
    });
    
    console.log(`   ✓ Updated to SIX_MONTHS`);
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
  
  // Show all durations
  const allDurations = await prisma.membership.groupBy({
    by: ['duration'],
    _count: { duration: true }
  });
  
  console.log(`\n✅ MIGRASI SELESAI! Paket yang tersisa:\n`);
  allDurations.forEach(d => {
    console.log(`  - ${d.duration}: ${d._count.duration} paket`);
  });
  
  // Show all plans
  const allPlans = await prisma.membership.findMany({
    select: {
      name: true,
      slug: true,
      duration: true,
      price: true,
      _count: {
        select: { userMemberships: true }
      }
    },
    orderBy: { price: 'asc' }
  });
  
  console.log('\n📦 SEMUA PAKET MEMBERSHIP:\n');
  allPlans.forEach(p => {
    console.log(`- ${p.name}`);
    console.log(`  Duration: ${p.duration} | Rp ${Number(p.price).toLocaleString('id-ID')}`);
    console.log(`  Users: ${p._count.userMemberships}`);
    console.log();
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
