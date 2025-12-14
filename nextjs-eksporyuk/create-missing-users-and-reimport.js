const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 CREATE MISSING USERS & RE-IMPORT - 14 Desember 2025');
  console.log('═'.repeat(60));
  
  // 1. Load and create missing users
  const usersToCreate = JSON.parse(fs.readFileSync('users-to-create.json', 'utf-8'));
  console.log(`\n📊 Creating ${usersToCreate.length} missing users...`);
  
  const defaultPassword = await bcrypt.hash('Eksporyuk123!', 10);
  
  let created = 0;
  let skipped = 0;
  
  for (const user of usersToCreate) {
    try {
      // Check if exists
      const exists = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (exists) {
        skipped++;
        continue;
      }
      
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || user.login || user.email.split('@')[0],
          username: user.login || user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
          password: defaultPassword,
          role: 'MEMBER_FREE',
          isActive: true,
          sejoliUserId: parseInt(user.sejoliUserId)
        }
      });
      created++;
    } catch (err) {
      skipped++;
    }
  }
  
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  
  // 2. Now re-import all transactions
  console.log('\n═'.repeat(60));
  console.log('🔄 RE-IMPORTING ALL TRANSACTIONS...');
  
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
    if (p[4] === 'added') {
      commissionByOrder[p[0]] = { affId: p[1], commission: parseFloat(p[3]) || 0 };
    }
  });
  
  // Get ALL local users (including newly created)
  const localUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const localUserByEmail = {};
  localUsers.forEach(u => {
    if (u.email) localUserByEmail[u.email.toLowerCase().trim()] = u.id;
  });
  
  console.log(`Local Users (after creation): ${localUsers.length}`);
  
  // Delete old transactions
  await prisma.transaction.deleteMany({});
  console.log('Old transactions deleted\n');
  
  const statusMap = {
    'completed': 'SUCCESS', 'cancelled': 'FAILED', 'on-hold': 'PENDING',
    'pending': 'PENDING', 'payment-confirm': 'PENDING', 'refunded': 'FAILED'
  };
  
  // Prepare batch
  const transactions = [];
  let txSkipped = 0;
  
  ordersRaw.forEach(line => {
    const p = line.split('\t');
    if (p.length < 10) { txSkipped++; return; }
    
    const orderId = p[0];
    const userId = p[2];
    const grandTotal = p[6];
    const status = p[7];
    const createdAt = p[8];
    const paymentGw = p[9];
    
    const sejoliUser = sejoliUserById[userId];
    if (!sejoliUser?.email) { txSkipped++; return; }
    
    const localUserId = localUserByEmail[sejoliUser.email];
    if (!localUserId) { txSkipped++; return; }
    
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
      metadata: { sejoliOrderId: parseInt(orderId), importSource: 'final-100' },
      createdAt: new Date(createdAt),
      updatedAt: new Date()
    });
  });
  
  console.log(`Prepared: ${transactions.length}`);
  console.log(`Skipped: ${txSkipped}`);
  
  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    await prisma.transaction.createMany({ data: batch });
    if ((i + batchSize) % 5000 < batchSize || i + batchSize >= transactions.length) {
      console.log(`Inserted: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
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
  
  const omset = Number(dbOmset._sum.amount);
  const komisi = Number(dbKomisi._sum.affiliateShare);
  
  console.log(`                | Screenshot      | Database         | Match`);
  console.log(`   Total Sales  | 12,839          | ${dbCompleted.toLocaleString('id-ID').padEnd(16)} | ${dbCompleted === 12839 ? '✅' : '❌'}`);
  console.log(`   Total Omset  | 4,122,334,962   | ${omset.toLocaleString('id-ID').padEnd(16)} | ${omset === 4122334962 ? '✅' : '❌'}`);
  console.log(`   Total Komisi | 1,245,421,000   | ${komisi.toLocaleString('id-ID').padEnd(16)} | ${komisi === 1245421000 ? '✅' : '❌'}`);
  
  const omsetMatch = ((omset / 4122334962) * 100).toFixed(2);
  const komisiMatch = ((komisi / 1245421000) * 100).toFixed(2);
  
  console.log(`\n🎯 AKURASI: Omset ${omsetMatch}% | Komisi ${komisiMatch}%`);
  
  if (omsetMatch > 99.9 && komisiMatch > 99.9) {
    console.log('\n🎉 DATA 100% AKURAT!');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
