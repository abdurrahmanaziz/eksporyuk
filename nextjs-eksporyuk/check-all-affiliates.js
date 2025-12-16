const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAffiliateData() {
  console.log('🔍 Checking ALL Affiliate Data Consistency...\n');
  
  // Get all users with AFFILIATE role
  const affiliates = await prisma.user.findMany({
    where: { role: 'AFFILIATE' },
    include: {
      wallet: true,
      affiliateProfile: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`📊 Total Affiliates: ${affiliates.length}\n`);
  
  const issues = [];
  
  for (const affiliate of affiliates) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`👤 Affiliate: ${affiliate.name || affiliate.username}`);
    console.log(`   Email: ${affiliate.email}`);
    console.log(`   ID: ${affiliate.id}`);
    
    if (!affiliate.affiliateProfile) {
      console.log(`   ⚠️  NO AFFILIATE PROFILE`);
      issues.push({
        email: affiliate.email,
        issue: 'Missing AffiliateProfile',
      });
      continue;
    }
    
    const profileId = affiliate.affiliateProfile.id;
    
    // Get actual data from conversions
    const conversionsData = await prisma.affiliateConversion.aggregate({
      where: { affiliateId: profileId },
      _sum: { commissionAmount: true },
      _count: true,
    });
    
    // Get actual clicks
    const clicksCount = await prisma.affiliateClick.count({
      where: { affiliateId: profileId },
    });
    
    const actualEarnings = Number(conversionsData._sum.commissionAmount || 0);
    const actualConversions = conversionsData._count;
    const actualClicks = clicksCount;
    
    // Compare with stored values
    const walletEarnings = Number(affiliate.wallet?.totalEarnings || 0);
    const walletBalance = Number(affiliate.wallet?.balance || 0);
    const profileEarnings = Number(affiliate.affiliateProfile.totalEarnings || 0);
    const profileConversions = affiliate.affiliateProfile.totalConversions;
    const profileClicks = affiliate.affiliateProfile.totalClicks;
    
    console.log(`\n   💰 EARNINGS:`);
    console.log(`      Wallet.balance:              Rp ${walletBalance.toLocaleString()}`);
    console.log(`      Wallet.totalEarnings:        Rp ${walletEarnings.toLocaleString()}`);
    console.log(`      AffiliateProfile.totalEarnings: Rp ${profileEarnings.toLocaleString()}`);
    console.log(`      Actual from Conversions:     Rp ${actualEarnings.toLocaleString()}`);
    
    console.log(`\n   📊 CONVERSIONS:`);
    console.log(`      AffiliateProfile.totalConversions: ${profileConversions}`);
    console.log(`      Actual from DB:                   ${actualConversions}`);
    
    console.log(`\n   👆 CLICKS:`);
    console.log(`      AffiliateProfile.totalClicks: ${profileClicks}`);
    console.log(`      Actual from DB:              ${actualClicks}`);
    
    // Check consistency (allow small rounding differences)
    const earningsMatch = Math.abs(walletEarnings - actualEarnings) < 10;
    const conversionsMatch = profileConversions === actualConversions;
    const clicksMatch = profileClicks === actualClicks;
    
    if (earningsMatch && conversionsMatch && clicksMatch) {
      console.log(`\n   ✅ ALL DATA CONSISTENT`);
    } else {
      console.log(`\n   ⚠️  INCONSISTENCY DETECTED:`);
      const issueDetails = [];
      
      if (!earningsMatch) {
        console.log(`      - Earnings: Wallet(${walletEarnings}) vs Actual(${actualEarnings})`);
        issueDetails.push(`Earnings mismatch: ${walletEarnings} vs ${actualEarnings}`);
      }
      if (!conversionsMatch) {
        console.log(`      - Conversions: Profile(${profileConversions}) vs Actual(${actualConversions})`);
        issueDetails.push(`Conversions: ${profileConversions} vs ${actualConversions}`);
      }
      if (!clicksMatch) {
        console.log(`      - Clicks: Profile(${profileClicks}) vs Actual(${actualClicks})`);
        issueDetails.push(`Clicks: ${profileClicks} vs ${actualClicks}`);
      }
      
      issues.push({
        email: affiliate.email,
        issue: issueDetails.join(', '),
      });
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  SUMMARY - ${issues.length} affiliates with issues:\n`);
    issues.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.email}`);
      console.log(`   ${item.issue}\n`);
    });
  } else {
    console.log(`\n✅ ALL AFFILIATES DATA CONSISTENT!`);
  }
  
  await prisma.$disconnect();
}

checkAffiliateData().catch(console.error);
