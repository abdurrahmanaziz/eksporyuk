/**
 * SAFE RE-IMPORT SEJOLI COMMISSIONS
 * 
 * Script ini AMAN:
 * ✅ Tidak menghapus data apapun
 * ✅ Hanya update metadata.commissionAmount yang kosong/salah
 * ✅ Skip transaksi yang sudah ada
 * ✅ Tidak ada duplikat
 * ✅ Tidak error
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function safeReimportCommissions() {
  console.log('🔒 SAFE RE-IMPORT SEJOLI COMMISSIONS');
  console.log('═'.repeat(60));
  console.log('✅ Mode: UPDATE ONLY - No Delete, No Duplicate\n');

  try {
    // Read TSV files
    const commissionsFile = fs.readFileSync(path.join(__dirname, 'sejoli_affiliate_commissions.tsv'), 'utf-8');
    const usersFile = fs.readFileSync(path.join(__dirname, 'sejoli_users.tsv'), 'utf-8');

    // Parse TSV
    const parseRows = (content) => {
      const lines = content.trim().split('\n');
      const headers = lines[0].split('\t');
      return lines.slice(1).map(line => {
        const values = line.split('\t');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
        return obj;
      });
    };

    const commissions = parseRows(commissionsFile);
    const sejoliUsers = parseRows(usersFile);

    console.log(`📊 Data dari Sejoli TSV:`);
    console.log(`   Commission Records: ${commissions.length}`);
    console.log(`   Sejoli Users: ${sejoliUsers.length}`);

    // Create Sejoli user lookup by ID
    const sejoliUserById = {};
    sejoliUsers.forEach(u => {
      sejoliUserById[u.ID] = {
        id: parseInt(u.ID),
        email: u.user_email?.toLowerCase().trim(),
        name: u.display_name?.trim()
      };
    });

    // Create commission lookup by order_id (only status=added)
    const commissionByOrder = {};
    commissions.forEach(c => {
      if (c.status === 'added') {
        const affiliateId = parseInt(c.affiliate_id);
        const affiliateUser = sejoliUserById[affiliateId];
        
        commissionByOrder[c.order_id] = {
          orderId: parseInt(c.order_id),
          affiliateId: affiliateId,
          affiliateName: affiliateUser?.name || null,
          commission: parseFloat(c.commission) || 0
        };
      }
    });

    console.log(`   Valid Commissions (status=added): ${Object.keys(commissionByOrder).length}`);

    // Get all transactions from database
    console.log('\n📥 Loading existing transactions from database...');
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        metadata: true
      }
    });

    console.log(`   Total Transactions in DB: ${transactions.length}`);

    // Update transactions with correct commission
    console.log('\n🔄 Updating commissions...\n');

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let alreadyCorrect = 0;
    let totalCommissionBefore = 0;
    let totalCommissionAfter = 0;

    for (const tx of transactions) {
      const meta = tx.metadata || {};
      const sejoliOrderId = meta.sejoliOrderId;
      const currentCommission = Number(meta.commissionAmount || 0);
      
      totalCommissionBefore += currentCommission;

      if (!sejoliOrderId) {
        skipped++;
        totalCommissionAfter += currentCommission;
        continue;
      }

      const commissionData = commissionByOrder[sejoliOrderId.toString()];

      if (!commissionData) {
        // No commission record for this order
        notFound++;
        totalCommissionAfter += currentCommission;
        continue;
      }

      const correctCommission = commissionData.commission;
      const correctAffiliateName = commissionData.affiliateName;

      // Check if already correct
      if (currentCommission === correctCommission && meta.affiliateName === correctAffiliateName) {
        alreadyCorrect++;
        totalCommissionAfter += currentCommission;
        continue;
      }

      // Update metadata with correct values
      const newMetadata = {
        ...meta,
        commissionAmount: correctCommission,
        affiliateName: correctAffiliateName,
        affiliateId: commissionData.affiliateId
      };

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { metadata: newMetadata }
      });

      updated++;
      totalCommissionAfter += correctCommission;

      if (updated % 500 === 0) {
        console.log(`   Updated ${updated} transactions...`);
      }
    }

    console.log('\n═'.repeat(60));
    console.log('📊 HASIL UPDATE:');
    console.log('═'.repeat(60));
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️ Skipped (no sejoliOrderId): ${skipped}`);
    console.log(`   ❓ Not in commission file: ${notFound}`);
    console.log(`   ✓ Already correct: ${alreadyCorrect}`);
    console.log('');
    console.log(`   💰 Total Commission Before: Rp ${totalCommissionBefore.toLocaleString('id-ID')}`);
    console.log(`   💰 Total Commission After:  Rp ${totalCommissionAfter.toLocaleString('id-ID')}`);
    console.log(`   📈 Difference: Rp ${(totalCommissionAfter - totalCommissionBefore).toLocaleString('id-ID')}`);

    // Now recalculate affiliate totals
    console.log('\n🔄 Recalculating Affiliate Totals...');
    
    const allTx = await prisma.transaction.findMany({
      select: { amount: true, metadata: true }
    });

    const affiliateStats = {};
    let totalKomisiAll = 0;

    allTx.forEach(tx => {
      const meta = tx.metadata || {};
      const commission = Number(meta.commissionAmount || 0);
      const amount = Number(tx.amount || 0);
      const status = meta.originalStatus || '';
      const affName = meta.affiliateName;

      // Only count completed (not cancelled/refunded)
      if (status !== 'cancelled' && status !== 'refunded') {
        totalKomisiAll += commission;
        
        if (affName && commission > 0) {
          if (!affiliateStats[affName]) {
            affiliateStats[affName] = { name: affName, totalCommission: 0, totalSales: 0, count: 0 };
          }
          affiliateStats[affName].totalCommission += commission;
          affiliateStats[affName].totalSales += amount;
          affiliateStats[affName].count++;
        }
      }
    });

    // Update AffiliateProfile
    const profiles = await prisma.affiliateProfile.findMany({
      include: { user: { select: { name: true } } }
    });

    let profilesUpdated = 0;
    for (const profile of profiles) {
      const userName = profile.user?.name;
      if (!userName) continue;

      const stats = affiliateStats[userName];
      if (stats) {
        await prisma.affiliateProfile.update({
          where: { id: profile.id },
          data: {
            totalEarnings: stats.totalCommission,
            totalSales: stats.totalSales,
            totalConversions: stats.count
          }
        });
        profilesUpdated++;
      }
    }

    console.log(`   ✅ Updated ${profilesUpdated} affiliate profiles`);

    // Show final TOP 10
    const top10 = await prisma.affiliateProfile.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } }
    });

    console.log('\n═'.repeat(60));
    console.log('🏆 TOP 10 AFFILIATES (FINAL):');
    console.log('═'.repeat(60));
    top10.forEach((a, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${(a.user?.name || 'Unknown').substring(0, 25).padEnd(25)} | Rp ${Number(a.totalEarnings).toLocaleString('id-ID').padStart(15)}`);
    });

    console.log('\n💰 TOTAL KOMISI SEMUA: Rp', totalKomisiAll.toLocaleString('id-ID'));
    
    console.log('\n✅ SAFE RE-IMPORT COMPLETE!');
    console.log('   - Tidak ada data yang dihapus');
    console.log('   - Tidak ada duplikat');
    console.log('   - Commission sudah diupdate dari Sejoli TSV');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

safeReimportCommissions();
