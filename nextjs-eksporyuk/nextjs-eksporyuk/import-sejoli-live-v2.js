const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importSejoliLiveV2() {
  console.log('🚀 IMPORT DATA SEJOLI LIVE V2 (14 Desember 2025)');
  console.log('═'.repeat(60));
  
  // Read exported files
  const ordersFile = fs.readFileSync(path.join(__dirname, 'sejoli_orders_raw.tsv'), 'utf-8');
  const commissionsFile = fs.readFileSync(path.join(__dirname, 'sejoli_affiliate_commissions.tsv'), 'utf-8');
  const usersFile = fs.readFileSync(path.join(__dirname, 'sejoli_users.tsv'), 'utf-8');
  
  // Parse TSV files
  const parseRows = (content) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i]);
      return obj;
    });
  };
  
  const orders = parseRows(ordersFile);
  const commissions = parseRows(commissionsFile);
  const sejoliUsers = parseRows(usersFile);
  
  console.log(`\n📊 DATA DARI DATABASE SEJOLI LIVE:`);
  console.log(`   Total Orders: ${orders.length}`);
  console.log(`   Total Commission Records: ${commissions.length}`);
  console.log(`   Total Sejoli Users: ${sejoliUsers.length}`);
  
  // Create Sejoli user lookup by ID
  const sejoliUserById = {};
  sejoliUsers.forEach(u => {
    sejoliUserById[u.ID] = {
      id: parseInt(u.ID),
      email: u.user_email?.toLowerCase().trim(),
      name: u.display_name
    };
  });
  
  // Create commission lookup by order_id (only completed)
  const commissionByOrder = {};
  commissions.forEach(c => {
    if (c.status === 'added') {
      commissionByOrder[c.order_id] = {
        affiliateId: parseInt(c.affiliate_id),
        commission: parseFloat(c.commission) || 0
      };
    }
  });
  
  console.log(`\n📈 Commission records (status=added): ${Object.keys(commissionByOrder).length}`);
  
  // Get all users from local database and create email lookup
  const localUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const localUserByEmail = {};
  localUsers.forEach(u => {
    if (u.email) {
      localUserByEmail[u.email.toLowerCase().trim()] = u.id;
    }
  });
  
  console.log(`\n📋 Local Users: ${localUsers.length}`);
  
  // Get membership for transactions
  const memberships = await prisma.membership.findMany();
  const defaultMembership = memberships[0];
  console.log(`   Default Membership: ${defaultMembership?.name || 'None'}`);
  
  // Separate orders by status
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  
  console.log(`\n📋 Orders by Status:`);
  console.log(`   Completed: ${completedOrders.length}`);
  console.log(`   Cancelled: ${cancelledOrders.length}`);
  
  // Clear existing transactions
  console.log('\n═'.repeat(60));
  console.log('🔄 MULAI IMPORT...');
  console.log('═'.repeat(60));
  
  console.log('\n1️⃣ Menghapus transaksi lama...');
  await prisma.transaction.deleteMany({});
  console.log('   ✅ Transaksi lama dihapus');
  
  // Import orders
  console.log('\n2️⃣ Import transaksi...');
  
  let imported = 0;
  let skippedNoUser = 0;
  let affiliateMatched = 0;
  let totalOmset = 0;
  let totalKomisi = 0;
  
  const statusMap = {
    'completed': 'SUCCESS',
    'cancelled': 'FAILED',
    'on-hold': 'PENDING',
    'pending': 'PENDING',
    'payment-confirm': 'PENDING',
    'refunded': 'FAILED'
  };
  
  // Process in batches
  const BATCH_SIZE = 500;
  const batches = [];
  
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    batches.push(orders.slice(i, i + BATCH_SIZE));
  }
  
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const transactionsToCreate = [];
    
    for (const order of batch) {
      // Get Sejoli user
      const sejoliUser = sejoliUserById[order.user_id];
      if (!sejoliUser || !sejoliUser.email) {
        skippedNoUser++;
        continue;
      }
      
      // Find local user by email
      const localUserId = localUserByEmail[sejoliUser.email];
      if (!localUserId) {
        skippedNoUser++;
        continue;
      }
      
      // Get affiliate info
      const commInfo = commissionByOrder[order.ID];
      let affiliateLocalId = null;
      let commissionAmount = 0;
      
      if (commInfo?.affiliateId > 0) {
        const affSejoliUser = sejoliUserById[commInfo.affiliateId];
        if (affSejoliUser?.email) {
          affiliateLocalId = localUserByEmail[affSejoliUser.email];
          if (affiliateLocalId) {
            affiliateMatched++;
            commissionAmount = commInfo.commission;
          }
        }
      }
      
      const amount = parseFloat(order.grand_total) || 0;
      const status = statusMap[order.status] || 'PENDING';
      
      if (status === 'SUCCESS') {
        totalOmset += amount;
        if (commissionAmount > 0) {
          totalKomisi += commissionAmount;
        }
      }
      
      transactionsToCreate.push({
        userId: localUserId,
        membershipId: defaultMembership?.id || null,
        amount: amount,
        status: status,
        paymentMethod: order.payment_gateway || 'manual',
        affiliateId: affiliateLocalId,
        affiliateShare: commissionAmount, // Using affiliateShare field
        metadata: JSON.stringify({
          sejoliOrderId: parseInt(order.ID),
          sejoliProductId: parseInt(order.product_id),
          sejoliAffiliateId: commInfo?.affiliateId || null,
          sejoliCommission: commissionAmount,
          importedAt: new Date().toISOString(),
          source: 'sejoli-live-import-20251214'
        }),
        createdAt: new Date(order.created_at),
        updatedAt: new Date()
      });
      
      imported++;
    }
    
    // Bulk create
    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToCreate
      });
    }
    
    console.log(`   Batch ${batchIdx + 1}/${batches.length}: ${transactionsToCreate.length} imported`);
  }
  
  console.log(`\n   ✅ Import selesai!`);
  console.log(`   Total Imported: ${imported.toLocaleString('id-ID')}`);
  console.log(`   Skipped (no matching user): ${skippedNoUser.toLocaleString('id-ID')}`);
  console.log(`   Affiliate Matched: ${affiliateMatched.toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`   Total Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  
  // Verify final data
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI FINAL:');
  console.log('═'.repeat(60));
  
  const finalStats = await prisma.$queryRaw`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as omset,
      SUM(CASE WHEN status = 'SUCCESS' AND "affiliateId" IS NOT NULL THEN 1 ELSE 0 END) as with_affiliate,
      SUM(CASE WHEN status = 'SUCCESS' THEN "affiliateShare" ELSE 0 END) as total_komisi
    FROM "Transaction"
  `;
  
  const stats = finalStats[0];
  console.log(`   Total Transaksi: ${Number(stats.total).toLocaleString('id-ID')}`);
  console.log(`   Completed (SUCCESS): ${Number(stats.completed).toLocaleString('id-ID')}`);
  console.log(`   With Affiliate: ${Number(stats.with_affiliate).toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${Number(stats.omset).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi: Rp ${Number(stats.total_komisi).toLocaleString('id-ID')}`);
  
  console.log('\n═'.repeat(60));
  console.log('📊 PERBANDINGAN DENGAN SCREENSHOT:');
  console.log('═'.repeat(60));
  console.log(`                | Screenshot      | Database`);
  console.log(`   Total Lead   | 19,246          | ${Number(stats.total).toLocaleString('id-ID')}`);
  console.log(`   Total Sales  | 12,839          | ${Number(stats.completed).toLocaleString('id-ID')}`);
  console.log(`   Total Omset  | Rp 4,122,334,962| Rp ${Number(stats.omset).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi | Rp 1,245,421,000| Rp ${Number(stats.total_komisi).toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
  console.log('\n✅ IMPORT SELESAI!');
}

importSejoliLiveV2().catch(console.error);
