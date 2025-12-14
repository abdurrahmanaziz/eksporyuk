const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importFinal() {
  console.log('🚀 IMPORT FINAL FIXED - 14 Desember 2025');
  console.log('═'.repeat(60));
  
  // Parse files
  const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').trim().split('\n').slice(1);
  const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8').trim().split('\n').slice(1);
  const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8').trim().split('\n').slice(1);
  
  // Create user lookup
  const sejoliUserById = {};
  usersRaw.forEach(line => {
    const p = line.split('\t');
    sejoliUserById[p[0]] = { id: p[0], email: p[2]?.toLowerCase().trim(), name: p[3] };
  });
  
  // Create commission lookup - FIXED: column 4 is status (0-indexed: 0=order_id, 1=affiliate_id, 2=product_id, 3=commission, 4=status)
  const commissionByOrder = {};
  let addedComms = 0;
  commissionsRaw.forEach(line => {
    const p = line.split('\t');
    // order_id, affiliate_id, product_id, commission, status
    if (p[4] === 'added') {
      addedComms++;
      commissionByOrder[p[0]] = { 
        affId: p[1], 
        commission: parseFloat(p[3]) || 0 
      };
    }
  });
  console.log(`Commission records (added): ${addedComms}`);
  console.log(`Unique orders with commission: ${Object.keys(commissionByOrder).length}`);
  
  // Get local users
  const localUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const localUserByEmail = {};
  localUsers.forEach(u => {
    if (u.email) localUserByEmail[u.email.toLowerCase().trim()] = u.id;
  });
  
  console.log(`\nOrders: ${ordersRaw.length}`);
  console.log(`Local Users: ${localUsers.length}`);
  
  // Delete old
  await prisma.transaction.deleteMany({});
  console.log('\nOld transactions deleted');
  
  const statusMap = {
    'completed': 'SUCCESS', 'cancelled': 'FAILED', 'on-hold': 'PENDING',
    'pending': 'PENDING', 'payment-confirm': 'PENDING', 'refunded': 'FAILED'
  };
  
  // Prepare batch
  const transactions = [];
  let skipped = 0;
  let withAffCount = 0;
  let totalCommission = 0;
  
  ordersRaw.forEach((line, i) => {
    const p = line.split('\t');
    if (p.length < 10) { skipped++; return; }
    
    const orderId = p[0];
    const userId = p[2];
    const grandTotal = p[6];
    const status = p[7];
    const createdAt = p[8];
    const paymentGw = p[9];
    
    const sejoliUser = sejoliUserById[userId];
    if (!sejoliUser?.email) { skipped++; return; }
    
    const localUserId = localUserByEmail[sejoliUser.email];
    if (!localUserId) { skipped++; return; }
    
    const commInfo = commissionByOrder[orderId];
    let affiliateLocalId = null;
    let commission = 0;
    
    if (commInfo?.affId && commInfo.affId !== '0') {
      const affUser = sejoliUserById[commInfo.affId];
      if (affUser?.email) {
        const affLocalId = localUserByEmail[affUser.email];
        if (affLocalId) {
          affiliateLocalId = affLocalId;
          commission = commInfo.commission;
          withAffCount++;
          
          // Only count commission for completed orders
          if (status === 'completed') {
            totalCommission += commission;
          }
        }
      }
    }
    
    transactions.push({
      userId: localUserId,
      type: 'MEMBERSHIP',
      amount: parseFloat(grandTotal) || 0,
      status: statusMap[status] || 'PENDING',
      paymentMethod: paymentGw || 'manual',
      affiliateId: affiliateLocalId,
      affiliateShare: commission,
      metadata: { sejoliOrderId: parseInt(orderId), importSource: 'final-fixed' },
      createdAt: new Date(createdAt),
      updatedAt: new Date()
    });
  });
  
  console.log(`\nPrepared: ${transactions.length}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`With Affiliate: ${withAffCount}`);
  console.log(`Expected Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
  
  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    await prisma.transaction.createMany({ data: batch });
    if ((i + batchSize) % 5000 < batchSize) {
      console.log(`Inserted: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
  }
  console.log(`Inserted: ${transactions.length}/${transactions.length}`);
  
  // Verify
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI FINAL:');
  
  const dbTotal = await prisma.transaction.count();
  const dbCompleted = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
  const dbOmset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const dbKomisi = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { affiliateShare: true }
  });
  const dbWithAff = await prisma.transaction.count({
    where: { affiliateId: { not: null } }
  });
  
  console.log(`                | Screenshot      | Database`);
  console.log(`   Total Lead   | 19,246          | ${dbTotal.toLocaleString('id-ID')}`);
  console.log(`   Total Sales  | 12,839          | ${dbCompleted.toLocaleString('id-ID')}`);
  console.log(`   Total Omset  | 4,122,334,962   | ${Number(dbOmset._sum.amount).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi | 1,245,421,000   | ${Number(dbKomisi._sum.affiliateShare).toLocaleString('id-ID')}`);
  console.log(`   With Affiliate: ${dbWithAff}`);
  
  const omsetMatch = ((Number(dbOmset._sum.amount) / 4122334962) * 100).toFixed(2);
  const komisiMatch = ((Number(dbKomisi._sum.affiliateShare) / 1245421000) * 100).toFixed(2);
  
  console.log(`\n🎯 AKURASI: Omset ${omsetMatch}% | Komisi ${komisiMatch}%`);
  
  await prisma.$disconnect();
}

importFinal().catch(console.error);
