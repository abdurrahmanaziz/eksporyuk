/**
 * CREATE AFFILIATE CONVERSIONS FROM EXISTING SEJOLI TRANSACTIONS
 * 
 * Script ini membuat AffiliateConversion records untuk transactions
 * yang sudah di-import tapi belum punya conversion records.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sejoliData = require('./wp-data/sejolisa-full-18000users-1765279985617.json');
const productMapping = require('./product-membership-mapping.js');

// Helper: Get commission by product ID
function getCommissionByProductId(productId) {
  const product = productMapping.PRODUCT_MEMBERSHIP_MAPPING[productId];
  if (!product) {
    return 0;
  }
  return product.commissionFlat || 0;
}

async function createConversions() {
  console.log('🚀 MEMBUAT AFFILIATE CONVERSIONS DARI TRANSAKSI SEJOLI');
  console.log('='.repeat(80));
  
  const stats = {
    conversionsCreated: 0,
    conversionsSkipped: 0,
    totalCommission: 0,
    errors: []
  };

  try {
    // Get all Sejoli transactions
    const sejoliTransactions = await prisma.transaction.findMany({
      where: {
        reference: { startsWith: 'SEJOLI-' },
        affiliateId: { not: null }
      },
      select: {
        id: true,
        reference: true,
        affiliateId: true,
        metadata: true,
        createdAt: true
      }
    });

    console.log(`\n📊 Found ${sejoliTransactions.length} Sejoli transactions with affiliate`);

    // Check which already have conversions
    const existingConversions = await prisma.affiliateConversion.findMany({
      where: {
        transactionId: { in: sejoliTransactions.map(t => t.id) }
      },
      select: { transactionId: true }
    });

    const existingTxIds = new Set(existingConversions.map(c => c.transactionId));
    console.log(`📊 Found ${existingConversions.length} existing conversions`);

    // Create conversions for transactions that don't have them
    const needConversions = sejoliTransactions.filter(t => !existingTxIds.has(t.id));
    console.log(`📊 Need to create ${needConversions.length} new conversions\n`);

    for (const tx of needConversions) {
      try {
        const productId = tx.metadata?.sejoliProductId;
        if (!productId) {
          stats.conversionsSkipped++;
          continue;
        }

        const commissionAmount = getCommissionByProductId(productId);
        
        if (commissionAmount <= 0) {
          stats.conversionsSkipped++;
          continue;
        }

        await prisma.affiliateConversion.create({
          data: {
            affiliateId: tx.affiliateId,
            transactionId: tx.id,
            commissionAmount: commissionAmount,
            commissionRate: 0,
            paidOut: false,
            createdAt: tx.createdAt
          }
        });

        stats.conversionsCreated++;
        stats.totalCommission += Number(commissionAmount);

        if (stats.conversionsCreated % 500 === 0) {
          console.log(`   ✓ ${stats.conversionsCreated} conversions created...`);
        }
      } catch (error) {
        stats.conversionsSkipped++;
        stats.errors.push(`TX ${tx.reference}: ${error.message}`);
      }
    }

    console.log(`\n✅ Conversions created: ${stats.conversionsCreated}`);
    console.log(`⏭️  Conversions skipped: ${stats.conversionsSkipped}`);
    console.log(`💵 Total Commission: Rp ${stats.totalCommission.toLocaleString('id-ID')}`);

    // Verify
    console.log('\n🔍 VERIFICATION:');
    
    const totalConversions = await prisma.affiliateConversion.count();
    const totalCommissionInDB = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });

    console.log(`   Total Affiliate Conversions: ${totalConversions}`);
    console.log(`   Total Commission in DB: Rp ${(Number(totalCommissionInDB._sum.commissionAmount) || 0).toLocaleString('id-ID')}`);

    // Sample check
    console.log('\n📍 SAMPLE COMMISSIONS:');
    const samples = await prisma.affiliateConversion.findMany({
      where: {
        transaction: { reference: { startsWith: 'SEJOLI-' } }
      },
      include: {
        transaction: { select: { reference: true, metadata: true } }
      },
      take: 10
    });

    samples.forEach((conv, i) => {
      const productId = conv.transaction.metadata?.sejoliProductId;
      console.log(`   ${i + 1}. Product ${productId} → Komisi: Rp ${Number(conv.commissionAmount).toLocaleString('id-ID')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ SELESAI!');

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length} total, showing first 10):`);
      stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
if (require.main === module) {
  createConversions()
    .then(() => {
      console.log('\n🎉 Conversions berhasil dibuat!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Conversions gagal:', error);
      process.exit(1);
    });
}

module.exports = { createConversions };
