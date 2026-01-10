const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix transactions that have affiliate data in metadata
 * but are missing AffiliateConversion records
 * 
 * UPDATED: Uses correct schema with connect syntax
 */
async function fixMissingAffiliateConversions() {
  console.log('=== Fixing Missing Affiliate Conversions (v2) ===\n');
  
  // Get transactions with affiliate info in metadata but no AffiliateConversion
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      affiliateConversion: null,
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      metadata: true,
      userId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Total transactions without AffiliateConversion: ${transactions.length}`);
  
  // Filter to those with affiliate_id in metadata
  const withAffiliateData = transactions.filter(tx => {
    const meta = tx.metadata || {};
    return meta.affiliate_id || meta.affiliateId;
  });
  
  console.log(`Transactions with affiliate data in metadata: ${withAffiliateData.length}`);
  
  // Build mapping from sejoli affiliate_id to our profile
  console.log('\n=== Building Affiliate Mapping from Existing Conversions ===');
  const existingConversions = await prisma.affiliateConversion.findMany({
    include: {
      transaction: { select: { metadata: true } },
      affiliate: { include: { user: { select: { name: true } } } }
    }
  });
  
  const sejoliToProfile = new Map();
  
  existingConversions.forEach(conv => {
    const meta = conv.transaction?.metadata || {};
    const sejoliId = meta.affiliate_id || meta.affiliateId;
    if (sejoliId && conv.affiliateId) {
      if (!sejoliToProfile.has(String(sejoliId))) {
        sejoliToProfile.set(String(sejoliId), {
          profileId: conv.affiliateId,
          name: conv.affiliate?.user?.name
        });
      }
    }
  });
  
  console.log(`Found ${sejoliToProfile.size} unique Sejoli->Profile mappings`);
  
  // Commission calculation
  const getCommission = (amount) => {
    const amt = Number(amount);
    if (amt === 999000) return 325000;  // Lifetime with coupon
    if (amt === 699000) return 200000;  // 6 Bulan with coupon
    if (amt === 899000) return 250000;  // 12 Bulan with coupon
    if (amt === 997000) return 325000;  // Lifetime
    if (amt === 1497000) return 200000; // 6 Bulan
    if (amt === 2497000) return 250000; // 12 Bulan
    // Default: 30% for other amounts
    return Math.round(amt * 0.3);
  };
  
  let created = 0;
  let skipped = 0;
  let noMapping = 0;
  
  console.log('\n=== Creating Missing AffiliateConversions ===');
  
  for (const tx of withAffiliateData) {
    const meta = tx.metadata || {};
    const sejoliAffiliateId = String(meta.affiliate_id || meta.affiliateId);
    
    const mapping = sejoliToProfile.get(sejoliAffiliateId);
    
    if (!mapping) {
      noMapping++;
      continue;
    }
    
    const commission = getCommission(tx.amount);
    const amount = Number(tx.amount);
    const commissionRate = amount > 0 ? (commission / amount) : 0;
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          affiliate: { connect: { id: mapping.profileId } },
          transaction: { connect: { id: tx.id } },
          commissionAmount: commission,
          commissionRate: commissionRate,
          paidOut: false,
          createdAt: tx.createdAt,
        }
      });
      created++;
      
      if (created % 100 === 0) {
        console.log(`Created ${created} conversions...`);
      }
    } catch (err) {
      if (err.code === 'P2002') {
        skipped++;
      } else {
        console.error(`Error for ${tx.invoiceNumber}:`, err.message);
      }
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`No mapping found: ${noMapping}`);
  
  // Verify
  const newTotal = await prisma.affiliateConversion.count();
  const totalSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  console.log(`\nTotal AffiliateConversions: ${newTotal}`);
  console.log(`Total SUCCESS transactions: ${totalSuccess}`);
  console.log(`Coverage: ${((newTotal / totalSuccess) * 100).toFixed(1)}%`);
  
  await prisma.$disconnect();
}

fixMissingAffiliateConversions().catch(console.error);
