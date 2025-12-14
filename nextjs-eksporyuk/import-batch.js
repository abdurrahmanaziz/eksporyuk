const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importBatch() {
  console.log('🚀 IMPORT BATCH - 14 Desember 2025');
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
  
  // Create commission lookup
  const commissionByOrder = {};
  commissionsRaw.forEach(line => {
    const p = line.split('\t');
    if (p[3] === 'added') {
      commissionByOrder[p[0]] = { affId: p[1], commission: parseFloat(p[2]) || 0 };
    }
  });
  
  // Get local users
  const localUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const localUserByEmail = {};
  localUsers.forEach(u => {
    if (u.email) localUserByEmail[u.email.toLowerCase().trim()] = u.id;
  });
  
  console.log(`Orders: ${ordersRaw.length}`);
  console.log(`Local Users: ${localUsers.length}`);
  
  // Delete old
  await prisma.transaction.deleteMany({});
  console.log('Old transactions deleted\n');
  
  const statusMap = {
    'completed': 'SUCCESS', 'cancelled': 'FAILED', 'on-hold': 'PENDING',
    'pending': 'PENDING', 'payment-confirm': 'PENDING', 'refunded': 'FAILED'
  };
  
  // Prepare batch
  const transactions = [];
  let skipped = 0;
  const missingEmails = new Set();
  
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
    if (!localUserId) {
      missingEmails.add(sejoliUser.email);
      skipped++;
      return;
    }
    
    const commInfo = commissionByOrder[orderId];
    let affiliateLocalId = null;
    let commission = 0;
    
    if (commInfo?.affId && commInfo.affId !== '0') {
      const affUser = sejoliUserById[commInfo.affId];
      if (affUser?.email) {
        affiliateLocalId = localUserByEmail[affUser.email] || null;
        if (affiliateLocalId) commission = commInfo.commission;
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
      metadata: { sejoliOrderId: parseInt(orderId), importSource: 'batch' },
      createdAt: new Date(createdAt),
      updatedAt: new Date()
    });
  });
  
  console.log(`Prepared: ${transactions.length}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Missing Emails: ${missingEmails.size}`);
  
  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    await prisma.transaction.createMany({ data: batch });
    console.log(`Inserted: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
  }
  
  // Verify
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI FINAL:');
  
  const dbCompleted = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
  const dbOmset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const dbKomisi = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { affiliateShare: true }
  });
  
  console.log(`                | Screenshot      | Database`);
  console.log(`   Total Sales  | 12,839          | ${dbCompleted.toLocaleString('id-ID')}`);
  console.log(`   Total Omset  | 4,122,334,962   | ${Number(dbOmset._sum.amount).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi | 1,245,421,000   | ${Number(dbKomisi._sum.affiliateShare).toLocaleString('id-ID')}`);
  
  const omsetMatch = ((Number(dbOmset._sum.amount) / 4122334962) * 100).toFixed(2);
  console.log(`\n🎯 AKURASI: ${omsetMatch}%`);
  
  // Save missing emails
  fs.writeFileSync('missing-emails.txt', [...missingEmails].join('\n'));
  console.log(`\nMissing emails saved to missing-emails.txt`);
  
  await prisma.$disconnect();
}

importBatch().catch(console.error);
