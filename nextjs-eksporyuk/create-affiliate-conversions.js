const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function createAffiliateConversions() {
  console.log('🚀 CREATING AFFILIATE CONVERSIONS\n');
  console.log('═══════════════════════════════════════\n');

  // Load Sejoli data
  const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Load commission rates
  const commissionData = JSON.parse(fs.readFileSync('scripts/migration/flat-commission-final.json', 'utf8'));
  const commissionRates = commissionData.commissionRates;
  
  console.log('📂 LOADED DATA:');
  console.log('  Sejoli Orders:', sejoli.orders.length);
  console.log('  Commission Rates:', Object.keys(commissionRates).length);
  
  // Filter completed orders with affiliate
  const completedAffiliateOrders = sejoli.orders.filter(o => 
    o.status === 'completed' && o.affiliate_id
  );
  
  console.log('  Completed Orders with Affiliate:', completedAffiliateOrders.length);
  console.log('\n📊 PROCESSING...\n');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of completedAffiliateOrders) {
    try {
      // Get user from email
      const sejUser = sejoli.users.find(u => u.id === order.user_id);
      if (!sejUser) {
        skipped++;
        continue;
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { email: sejUser.user_email }
      });
      
      if (!dbUser) {
        skipped++;
        continue;
      }
      
      // Find transaction by externalId
      const transaction = await prisma.transaction.findFirst({
        where: { 
          externalId: order.id.toString(),
          userId: dbUser.id,
          status: 'SUCCESS'
        }
      });
      
      if (!transaction) {
        skipped++;
        continue;
      }
      
      // Check if conversion already exists
      const existing = await prisma.affiliateConversion.findFirst({
        where: { transactionId: transaction.id }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Get affiliate (match by user_id, not by id!)
      const sejAffiliate = sejoli.affiliates.find(a => a.user_id === order.affiliate_id);
      if (!sejAffiliate) {
        skipped++;
        continue;
      }
      
      const affiliateUser = await prisma.user.findUnique({
        where: { email: sejAffiliate.user_email }
      });
      
      if (!affiliateUser) {
        skipped++;
        continue;
      }
      
      // Get affiliate profile
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: affiliateUser.id }
      });
      
      if (!affiliateProfile) {
        skipped++;
        continue;
      }
      
      // Calculate commission based on amount
      const amount = order.grand_total || 0;
      let commissionAmount = 0;
      
      if (amount < 50000) {
        commissionAmount = commissionRates.under50k;
      } else if (amount < 200000) {
        commissionAmount = commissionRates.under200k;
      } else if (amount < 450000) {
        commissionAmount = commissionRates.under450k;
      } else if (amount < 750000) {
        commissionAmount = commissionRates.under750k;
      } else if (amount < 900000) {
        commissionAmount = commissionRates.under900k;
      } else if (amount < 1100000) {
        commissionAmount = commissionRates.under1100k;
      } else {
        commissionAmount = commissionRates.over1100k;
      }
      
      // Create AffiliateConversion
      await prisma.affiliateConversion.create({
        data: {
          transactionId: transaction.id,
          affiliateId: affiliateProfile.id,
          commissionAmount: commissionAmount,
          commissionRate: 0, // Flat commission, not percentage
          paidOut: true, // Already in wallet balance
          paidOutAt: transaction.paidAt || transaction.createdAt,
          createdAt: transaction.createdAt
        }
      });
      
      created++;
      
      if (created % 100 === 0) {
        console.log(`  ✅ Created ${created} conversions...`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing order ${order.id}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SUMMARY:');
  console.log('  Created:', created);
  console.log('  Skipped:', skipped);
  console.log('  Errors:', errors);
  console.log('═══════════════════════════════════════');
  
  // Verify
  console.log('\n🔍 VERIFICATION:\n');
  
  const totalConversions = await prisma.affiliateConversion.count();
  const totalCommission = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  console.log('Total AffiliateConversions:', totalConversions);
  console.log('Total Commission Amount:', totalCommission._sum.commissionAmount?.toLocaleString('id-ID') || 0);
  
  // Sample
  const samples = await prisma.affiliateConversion.findMany({
    take: 5,
    include: {
      transaction: {
        select: {
          id: true,
          amount: true,
          createdAt: true
        }
      },
      affiliate: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    },
    orderBy: { commissionAmount: 'desc' }
  });
  
  console.log('\n🏆 TOP 5 CONVERSIONS:\n');
  samples.forEach((conv, i) => {
    console.log(`${i+1}. ${conv.affiliate.user.name}`);
    console.log(`   Transaction: Rp ${conv.transaction.amount.toLocaleString('id-ID')}`);
    console.log(`   Commission: Rp ${conv.commissionAmount.toLocaleString('id-ID')}`);
    console.log(`   Paid Out: ${conv.paidOut ? '✅' : '❌'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

createAffiliateConversions().catch(console.error);
