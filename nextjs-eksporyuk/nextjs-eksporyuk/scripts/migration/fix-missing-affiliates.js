const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to create missing affiliate profiles for top WordPress affiliates
 * that were not exported in Sejoli data
 */

// Top 10 affiliates from WordPress Sejoli that are missing affiliate profiles
const missingAffiliates = [
  { email: 'asep.abdurrahman.w@gmail.com', name: 'Asep Abdurrahman Wahid', wpEarnings: 165150000 },
  { email: 'hamidbaidowi03@gmail.com', name: 'Hamid Baidowi', wpEarnings: 131110000 },
  { email: 'azzka42@gmail.com', name: 'Sutisna', wpEarnings: 127750000 },
  { email: 'irmaprime01@gmail.com', name: 'NgobrolinEkspor', wpEarnings: 80582000 },
  { email: 'ekowibowo831@gmail.com', name: 'eko wibowo', wpEarnings: 65777000 },
  { email: 'pintarekspor146@gmail.com', name: 'PintarEkspor', wpEarnings: 53909000 },
  { email: 'rsaf924@gmail.com', name: 'Muhamad safrizal', wpEarnings: 43800000 },
  { email: 'mentorpasukan@gmail.com', name: 'Brian', wpEarnings: 36500000 },
];

function generateAffiliateCode() {
  return 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  console.log('=== CREATING MISSING AFFILIATE PROFILES ===\n');
  
  let created = 0;
  let failed = 0;
  
  for (const aff of missingAffiliates) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: aff.email },
        include: { affiliateProfile: true }
      });
      
      if (!user) {
        console.log(`❌ ${aff.name}: User not found with email ${aff.email}`);
        failed++;
        continue;
      }
      
      if (user.affiliateProfile) {
        console.log(`⏭️  ${aff.name}: Already has affiliate profile`);
        continue;
      }
      
      // Generate unique affiliate code
      let affiliateCode = generateAffiliateCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.affiliateProfile.findFirst({
          where: { affiliateCode }
        });
        if (!existing) break;
        affiliateCode = generateAffiliateCode();
        attempts++;
      }
      
      // Create affiliate profile with proper Prisma relations
      const shortLinkUsername = user.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
      const shortLink = `https://eksy.id/${shortLinkUsername}`;
      
      const profile = await prisma.affiliateProfile.create({
        data: {
          user: { connect: { id: user.id } },
          affiliateCode,
          shortLink,
          shortLinkUsername,
          tier: 1,
          commissionRate: 30,
          totalEarnings: aff.wpEarnings,
          totalConversions: 0,
          totalClicks: 0,
          isActive: true,
          approvedAt: new Date(),
        }
      });
      
      console.log(`✅ ${aff.name}:`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Affiliate ID: ${profile.id}`);
      console.log(`   Code: ${affiliateCode}`);
      console.log(`   WP Earnings: Rp ${aff.wpEarnings.toLocaleString('id-ID')}`);
      created++;
      
    } catch (error) {
      console.log(`❌ ${aff.name}: Error - ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  
  // Now let's link their transactions and create conversions
  console.log('\n\n=== LINKING TRANSACTIONS TO NEW AFFILIATES ===\n');
  
  for (const aff of missingAffiliates) {
    const user = await prisma.user.findUnique({
      where: { email: aff.email },
      include: { affiliateProfile: true }
    });
    
    if (!user?.affiliateProfile) continue;
    
    // Find transactions by this user
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        affiliateId: null,
        status: 'COMPLETED'
      }
    });
    
    console.log(`${aff.name}: Found ${transactions.length} unlinked transactions`);
    
    // Link transactions to their own affiliate profile (self-referral for now)
    for (const tx of transactions) {
      try {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { affiliateId: user.affiliateProfile.id }
        });
        
        // Create affiliate conversion
        const commissionAmount = Math.round(Number(tx.amount) * 0.30); // 30% commission
        
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: user.affiliateProfile.id,
            transactionId: tx.id,
            commissionAmount,
            commissionRate: 30,
            paidOut: false
          }
        });
      } catch (err) {
        // Ignore duplicate errors
      }
    }
    
    // Update conversion count
    const conversionStats = await prisma.affiliateConversion.aggregate({
      where: { affiliateId: user.affiliateProfile.id },
      _count: true,
      _sum: { commissionAmount: true }
    });
    
    await prisma.affiliateProfile.update({
      where: { id: user.affiliateProfile.id },
      data: {
        totalConversions: conversionStats._count,
        totalEarnings: Math.max(aff.wpEarnings, Number(conversionStats._sum.commissionAmount || 0))
      }
    });
    
    console.log(`   Updated: ${conversionStats._count} conversions, Rp ${Number(conversionStats._sum.commissionAmount || 0).toLocaleString('id-ID')} actual earnings`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
