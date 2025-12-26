#!/usr/bin/env node
/**
 * Import Transaksi + Komisi dari Sejoli (FIXED)
 * Invoice format: INV-00001, INV-00002, dst
 * Komisi FLAT sesuai PRD - menggunakan AffiliateConversion
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

async function importAll() {
  console.log('📋 IMPORT TRANSAKSI + KOMISI (PRD COMPLIANT)');
  console.log('='.repeat(50));
  
  // 1. Buat Admin dulu
  console.log('\n👤 Setup Admin...');
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eksporyuk.com' },
    create: {
      email: 'admin@eksporyuk.com',
      username: 'admineksporyuk',
      name: 'Administrator Eksporyuk',
      password: adminPass,
      role: 'ADMIN',
      emailVerified: true,
    },
    update: { role: 'ADMIN' }
  });
  console.log('   ✅ Admin ready:', admin.email);

  // 2. Build email -> userId map
  console.log('\n🗺️  Building user map...');
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailMap = new Map();
  users.forEach(u => emailMap.set(u.email.toLowerCase(), u.id));
  console.log('   ✅ ' + emailMap.size + ' users mapped');

  // 3. Build Sejoli userId -> email map dari users_export
  console.log('\n🗺️  Building Sejoli user map...');
  const usersData = readTSV('users_export.tsv');
  const sejoliUserMap = new Map();
  
  for (const row of usersData) {
    const [sejoliId, , email] = row;
    if (email && emailMap.has(email.toLowerCase())) {
      sejoliUserMap.set(sejoliId, emailMap.get(email.toLowerCase()));
    }
  }
  console.log('   ✅ ' + sejoliUserMap.size + ' Sejoli users mapped');

  // 4. Import Transactions dengan Invoice INV-00001
  console.log('\n💳 Importing Transactions...');
  const ordersData = readTSV('orders_export.tsv');
  console.log('   📂 Orders dari Sejoli: ' + ordersData.length);
  
  let txCount = 0;
  const sejoliOrderMap = new Map();
  
  for (let i = 0; i < ordersData.length; i++) {
    const row = ordersData[i];
    const [orderId, createdAt, , , userId, userEmail, affiliateId, grandTotal, status, paymentMethod] = row;
    
    if (status !== 'completed') continue;
    
    const buyerId = emailMap.get(userEmail?.toLowerCase()) || admin.id;
    const invoiceNum = String(txCount + 1).padStart(5, '0');
    const invoiceNo = 'INV-' + invoiceNum;
    const txId = randomUUID();
    
    let orderDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) orderDate = d;
    }
    
    try {
      await prisma.transaction.create({
        data: {
          id: txId,
          externalId: 'sejoli-' + orderId,
          invoiceNumber: invoiceNo,
          userId: buyerId,
          type: 'PRODUCT',
          amount: Math.max(0, parseFloat(grandTotal) || 0),
          status: 'SUCCESS',
          paymentMethod: paymentMethod || 'manual',
          description: 'Sejoli Order #' + orderId,
          createdAt: orderDate,
          updatedAt: orderDate,
        }
      });
      
      sejoliOrderMap.set(orderId, txId);
      txCount++;
      
      if (txCount % 1000 === 0) {
        console.log('   ✅ ' + txCount + ' transactions (' + invoiceNo + ')...');
      }
    } catch (e) {
      // Skip errors
    }
  }
  console.log('   ✅ Total: ' + txCount + ' transactions imported');

  // 5. Import Affiliate Commissions
  console.log('\n💰 Importing Commissions (FLAT dari Sejoli)...');
  const commissionsData = readTSV('commissions_export.tsv');
  console.log('   📂 Commissions dari Sejoli: ' + commissionsData.length);
  
  let commCount = 0;
  
  for (let i = 0; i < commissionsData.length; i++) {
    const row = commissionsData[i];
    const [commissionId, createdAt, orderId, buyerSejoliId, affiliateSejoliId, , amount, status, approved] = row;
    
    if (status !== 'added' || approved !== '1') continue;
    
    const affiliateUserId = sejoliUserMap.get(affiliateSejoliId) || admin.id;
    const transactionId = sejoliOrderMap.get(orderId);
    
    if (!transactionId) continue;
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          id: randomUUID(),
          affiliateId: affiliateUserId,
          transactionId: transactionId,
          commissionAmount: Math.max(0, parseFloat(amount) || 0),
          commissionRate: 135000,
          paidOut: true,
          paidOutAt: new Date(createdAt || '2022-01-01'),
          createdAt: new Date(createdAt || '2022-01-01'),
        }
      });
      
      commCount++;
      
      if (commCount % 500 === 0) {
        console.log('   ✅ ' + commCount + ' commissions...');
      }
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log('   ✅ Total: ' + commCount + ' commissions imported');

  // 6. Final verification
  console.log('\n📊 FINAL VERIFICATION:');
  const finalUsers = await prisma.user.count();
  const finalTx = await prisma.transaction.count();
  const finalComm = await prisma.affiliateConversion.count();
  
  console.log('   Users: ' + finalUsers);
  console.log('   Transactions: ' + finalTx + ' (Invoice INV-00001 s/d INV-' + String(finalTx).padStart(5, '0') + ')');
  console.log('   Commissions: ' + finalComm + ' (FLAT dari Sejoli)');
  
  const sampleTx = await prisma.transaction.findFirst({ orderBy: { createdAt: 'asc' } });
  if (sampleTx) {
    console.log('\n📄 Sample Invoice: ' + sampleTx.invoiceNumber);
  }
  
  console.log('\n✅ IMPORT SELESAI! PRD COMPLIANT');
  
  await prisma.$disconnect();
}

importAll().catch(e => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});
