/**
 * IMPORT SEJOLI COMMISSIONS TO NEON - FINAL VERSION
 * 
 * Hanya import affiliate yang BENAR-BENAR dapat komisi (ada di flat-commission-final.json)
 * Dan create conversions hanya untuk mereka
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sejoliData = require('./wp-data/sejolisa-full-18000users-1765279985617.json');
const commissionData = require('./flat-commission-final.json');
const productMapping = require('./product-membership-mapping.js');

// Helper: Get commission by product ID
function getCommissionByProductId(productId) {
  const product = productMapping.PRODUCT_MEMBERSHIP_MAPPING[productId];
  if (!product) return 0;
  return product.commissionFlat || 0;
}

async function importCommissions() {
  console.log('🚀 IMPORT AFFILIATE & COMMISSIONS (HANYA YANG DAPAT KOMISI)');
  console.log('='.repeat(80));
  
  const stats = {
    affiliatesCreated: 0,
    conversionsCreated: 0,
    totalCommission: 0,
    errors: []
  };

  try {
    // Step 1: Build map of users by email
    console.log('\n📊 Loading users from database...');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    console.log(`   Found ${allUsers.length} users`);

    // Step 2: Get list of affiliate emails yang dapat komisi from flat-commission-final.json
    const affiliateEmails = commissionData.affiliates.map(a => a.email);
    console.log(`\n📊 Found ${affiliateEmails.length} affiliates dengan komisi di flat-commission-final.json`);

    // Step 3: Create affiliate profiles (hanya untuk yang dapat komisi)
    console.log('\n📥 STEP 1: Creating Affiliate Profiles (hanya yang dapat komisi)...');
    
    for (const commAff of commissionData.affiliates) {
      try {
        const userId = userEmailMap.get(commAff.email);
        if (!userId) {
          stats.errors.push(`User tidak ditemukan: ${commAff.email}`);
          continue;
        }

        // Check if already exists
        const existing = await prisma.affiliateProfile.findUnique({
          where: { userId }
        });

        if (existing) {
          continue; // Skip if already exists
        }

        // Get affiliate code from sejoli data
        const sejoliAffiliate = sejoliData.affiliates.find(a => a.user_email === commAff.email);
        const affiliateCode = sejoliAffiliate?.affiliate_code || `AFF-${userId.slice(0, 8)}`;

        // Create affiliate profile
        await prisma.affiliateProfile.create({
          data: {
            userId: userId,
            affiliateCode: affiliateCode,
            commissionRate: 30, // Default
            isActive: true,
            createdAt: new Date()
          }
        });

        stats.affiliatesCreated++;

        if (stats.affiliatesCreated % 10 === 0) {
          console.log(`   ✓ ${stats.affiliatesCreated} affiliate profiles created...`);
        }
      } catch (error) {
        stats.errors.push(`Affiliate ${commAff.email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Affiliate profiles created: ${stats.affiliatesCreated}`);

    // Step 4: Reload affiliate map
    console.log('\n📊 Reloading affiliate map...');
    const allAffiliates = await prisma.affiliateProfile.findMany({
      select: { id: true, userId: true, user: { select: { email: true } } }
    });
    const emailAffiliateMap = new Map(allAffiliates.map(a => [a.user.email, a.id]));
    console.log(`   Found ${allAffiliates.length} affiliate profiles`);

    // Step 5: Create conversions for existing transactions
    console.log('\n📥 STEP 2: Creating Affiliate Conversions...');

    // Get all Sejoli transactions yang punya affiliate
    const sejoliTransactions = await prisma.transaction.findMany({
      where: {
        reference: { startsWith: 'SEJOLI-' },
        metadata: { path: ['sejoliAffiliateId'], not: 0 }
      },
      select: {
        id: true,
        reference: true,
        metadata: true,
        createdAt: true
      }
    });

    console.log(`   Found ${sejoliTransactions.length} Sejoli transactions dengan affiliate`);

    // Check existing conversions
    const existingConversions = await prisma.affiliateConversion.findMany({
      where: {
        transactionId: { in: sejoliTransactions.map(t => t.id) }
      },
      select: { transactionId: true }
    });
    const existingTxIds = new Set(existingConversions.map(c => c.transactionId));
    console.log(`   Found ${existingConversions.length} existing conversions`);

    // Create conversions for transactions yang belum punya
    const needConversions = sejoliTransactions.filter(t => !existingTxIds.has(t.id));
    console.log(`   Need to create ${needConversions.length} new conversions\n`);

    for (const tx of needConversions) {
      try {
        const sejoliAffiliateId = tx.metadata?.sejoliAffiliateId;
        const productId = tx.metadata?.sejoliProductId;

        if (!sejoliAffiliateId || !productId) continue;

        // Get affiliate email from sejoli data
        const sejoliAffiliate = sejoliData.affiliates.find(a => a.user_id === sejoliAffiliateId);
        if (!sejoliAffiliate) continue;

        // Get affiliate ID dari database
        const affiliateId = emailAffiliateMap.get(sejoliAffiliate.user_email);
        if (!affiliateId) {
          // Affiliate tidak punya komisi, skip
          continue;
        }

        // Get commission amount
        const commissionAmount = getCommissionByProductId(productId);
        if (commissionAmount <= 0) continue;

        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateId,
            transactionId: tx.id,
            commissionAmount: commissionAmount,
            commissionRate: 0,
            paidOut: false,
            createdAt: tx.createdAt
          }
        });

        stats.conversionsCreated++;
        stats.totalCommission += Number(commissionAmount);

        if (stats.conversionsCreated % 100 === 0) {
          console.log(`   ✓ ${stats.conversionsCreated} conversions created...`);
        }
      } catch (error) {
        stats.errors.push(`TX ${tx.reference}: ${error.message}`);
      }
    }

    console.log(`\n✅ Conversions created: ${stats.conversionsCreated}`);
    console.log(`💵 Total Commission: Rp ${stats.totalCommission.toLocaleString('id-ID')}`);

    // Step 6: Verify
    console.log('\n🔍 VERIFICATION:');
    const totalAffiliates = await prisma.affiliateProfile.count();
    const totalConversions = await prisma.affiliateConversion.count();
    const totalCommissionInDB = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });

    console.log(`   Total Affiliate Profiles: ${totalAffiliates}`);
    console.log(`   Total Affiliate Conversions: ${totalConversions}`);
    console.log(`   Total Commission in DB: Rp ${(Number(totalCommissionInDB._sum.commissionAmount) || 0).toLocaleString('id-ID')}`);

    // Sample check
    console.log('\n📍 SAMPLE COMMISSIONS:');
    const samples = await prisma.affiliateConversion.findMany({
      where: {
        transaction: { reference: { startsWith: 'SEJOLI-' } }
      },
      include: {
        transaction: { select: { reference: true, metadata: true } },
        affiliate: { select: { user: { select: { email: true } } } }
      },
      take: 10
    });

    samples.forEach((conv, i) => {
      const productId = conv.transaction.metadata?.sejoliProductId;
      const email = conv.affiliate.user.email;
      console.log(`   ${i + 1}. ${email} - Product ${productId} → Komisi: Rp ${Number(conv.commissionAmount).toLocaleString('id-ID')}`);
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
  importCommissions()
    .then(() => {
      console.log('\n🎉 Import commissions berhasil!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import commissions gagal:', error);
      process.exit(1);
    });
}

module.exports = { importCommissions };
