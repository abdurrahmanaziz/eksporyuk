const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Nama-nama affiliate dari gambar WordPress Sejoli dengan earnings
  const wpAffiliates = [
    { name: 'Rahmat Al Fianto', wpEarning: 168945000 },
    { name: 'Asep Abdurrahman Wahid', wpEarning: 165150000 },
    { name: 'Hamid Baidowi', wpEarning: 131110000 },
    { name: 'Sutisna', wpEarning: 127750000 },
    { name: 'Yoga Andrian', wpEarning: 93085000 },
    { name: 'NgobrolinEkspor', wpEarning: 80582000 },
    { name: 'eko wibowo', wpEarning: 65777000 },
    { name: 'PintarEkspor', wpEarning: 53909000 },
    { name: 'Muhamad safrizal', wpEarning: 43800000 },
    { name: 'Brian', wpEarning: 36500000 },
  ];
  
  console.log('=== CHECKING TOP 10 WORDPRESS AFFILIATES ===\n');
  
  let foundCount = 0;
  let notFoundCount = 0;
  const problems = [];
  
  for (const item of wpAffiliates) {
    // Exact name search
    const user = await prisma.user.findFirst({
      where: { name: item.name },
      include: { 
        affiliateProfile: true
      }
    });
    
    if (user) {
      foundCount++;
      const hasAffiliate = user.affiliateProfile ? 'YES' : 'NO';
      const storedEarnings = Number(user.affiliateProfile?.totalEarnings || 0);
      
      // Get actual conversions
      let actualConversions = 0;
      if (user.affiliateProfile) {
        const conversionSum = await prisma.affiliateConversion.aggregate({
          where: { affiliateId: user.affiliateProfile.id },
          _sum: { commissionAmount: true }
        });
        actualConversions = Number(conversionSum._sum.commissionAmount || 0);
      }
      
      console.log(`✅ ${item.name}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has Affiliate Profile: ${hasAffiliate}`);
      console.log(`   WordPress Earnings: Rp ${item.wpEarning.toLocaleString('id-ID')}`);
      console.log(`   Our Stored Earnings: Rp ${storedEarnings.toLocaleString('id-ID')}`);
      console.log(`   Our Actual Conversions: Rp ${actualConversions.toLocaleString('id-ID')}`);
      
      if (hasAffiliate === 'NO') {
        console.log(`   ⚠️  PROBLEM: User exists but NO AFFILIATE PROFILE!`);
        problems.push({ name: item.name, issue: 'No affiliate profile' });
      } else if (storedEarnings === 0 && actualConversions === 0) {
        console.log(`   ⚠️  PROBLEM: Affiliate exists but NO CONVERSIONS!`);
        problems.push({ name: item.name, issue: 'No conversions' });
      }
    } else {
      notFoundCount++;
      console.log(`❌ ${item.name}: NOT FOUND IN DATABASE`);
      problems.push({ name: item.name, issue: 'User not found' });
    }
    console.log('');
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`SUMMARY:`);
  console.log(`  Found: ${foundCount}/10`);
  console.log(`  Not Found: ${notFoundCount}/10`);
  console.log(`  Problems: ${problems.length}`);
  
  if (problems.length > 0) {
    console.log(`\nPROBLEMS:`);
    problems.forEach(p => {
      console.log(`  - ${p.name}: ${p.issue}`);
    });
  }
  
  // Also check our top 10 vs WordPress top 10
  console.log(`\n${'='.repeat(50)}`);
  console.log(`OUR TOP 10 AFFILIATES BY EARNINGS:`);
  
  const ourTop10 = await prisma.affiliateProfile.findMany({
    include: { user: true },
    orderBy: { totalEarnings: 'desc' },
    take: 10
  });
  
  ourTop10.forEach((aff, i) => {
    console.log(`${i + 1}. ${aff.user?.name} - Rp ${Number(aff.totalEarnings).toLocaleString('id-ID')}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
