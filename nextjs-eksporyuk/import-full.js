#!/usr/bin/env node
/**
 * IMPORT LENGKAP: TRANSAKSI + KOMISI SESUAI PRD
 * 
 * TARGET PRD:
 * - Sales: 12,894
 * - Omset: Rp 4.172.579.962
 * - Komisi: Rp 1.260.896.000
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

function genId() {
  return crypto.randomBytes(12).toString('hex');
}

async function importAll() {
  console.log('📋 IMPORT LENGKAP SESUAI PRD');
  console.log('='.repeat(60));
  
  // 1. Admin
  console.log('\n👤 Setup Admin...');
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eksporyuk.com' },
    create: {
      email: 'admin@eksporyuk.com',
      username: 'admineksporyuk',
      name: 'Administrator',
      password: adminPass,
      role: 'ADMIN',
      emailVerified: true,
    },
    update: {}
  });
  console.log('   ✅ Admin ready');

  // 2. Maps
  console.log('\n🗺️  Building maps...');
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map();
  users.forEach(u => emailToUserId.set(u.email.toLowerCase(), u.id));
  
  const usersData = readTSV('users_export.tsv');
  const sejoliIdToEmail = new Map();
  for (const [sejoliId, , email] of usersData) {
    if (email) sejoliIdToEmail.set(sejoliId, email.toLowerCase());
  }
  console.log(`   ✅ ${emailToUserId.size} users, ${sejoliIdToEmail.size} Sejoli IDs`);

  // 3. Import Transactions
  console.log('\n💳 Importing Transactions...');
  const ordersData = readTSV('orders_export.tsv');
  
  const processedOrders = new Set();
  const orderIdToTxId = new Map();
  let txCount = 0;
  let totalOmset = 0;
  
  for (const row of ordersData) {
    const [orderId, createdAt, , productName, sejoliUserId, userEmail, , grandTotal, status, paymentMethod] = row;
    
    if (status !== 'completed') continue;
    if (processedOrders.has(orderId)) continue;
    processedOrders.add(orderId);
    
    const buyerEmail = userEmail?.toLowerCase() || sejoliIdToEmail.get(sejoliUserId);
    const buyerId = emailToUserId.get(buyerEmail) || admin.id;
    
    txCount++;
    const invoiceNo = `INV-${String(txCount).padStart(5, '0')}`;
    const amount = Math.max(0, parseFloat(grandTotal) || 0);
    totalOmset += amount;
    
    let orderDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) orderDate = d;
    }
    
    try {
      const tx = await prisma.transaction.create({
        data: {
          id: genId(),
          externalId: `sejoli-${orderId}`,
          invoiceNumber: invoiceNo,
          userId: buyerId,
          type: 'PRODUCT',
          amount: amount,
          status: 'SUCCESS',
          paymentMethod: paymentMethod || 'manual',
          description: `${productName || 'Produk'} - Order #${orderId}`,
          createdAt: orderDate,
          updatedAt: orderDate,
        }
      });
      orderIdToTxId.set(orderId, tx.id);
      
      if (txCount % 1000 === 0) console.log(`   ✅ ${txCount} transactions...`);
    } catch (e) {
      if (e.code === 'P2002') txCount--;
    }
  }
  
  console.log(`   ✅ Total: ${txCount} | Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);

  // 4. Import Komisi (FLAT dari Sejoli)
  console.log('\n💰 Importing Komisi (FLAT)...');
  const commissionsData = readTSV('commissions_export.tsv');
  
  const processedComm = new Set();
  const usedTxIds = new Set();
  let commCount = 0;
  let totalKomisi = 0;
  
  for (const row of commissionsData) {
    const [commId, createdAt, orderId, , affiliateSejoliId, , amount, status, approved] = row;
    
    if (status !== 'added' || approved !== '1') continue;
    if (processedComm.has(commId)) continue;
    processedComm.add(commId);
    
    const txId = orderIdToTxId.get(orderId);
    if (!txId || usedTxIds.has(txId)) continue;
    usedTxIds.add(txId);
    
    const affEmail = sejoliIdToEmail.get(affiliateSejoliId);
    const affUserId = emailToUserId.get(affEmail);
    if (!affUserId) continue;
    
    const commAmount = Math.max(0, parseFloat(amount) || 0);
    totalKomisi += commAmount;
    
    let commDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) commDate = d;
    }
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          id: genId(),
          affiliateId: affUserId,
          transactionId: txId,
          commissionAmount: commAmount,
          commissionRate: 0,
          paidOut: false,
          createdAt: commDate,
        }
      });
      commCount++;
      
      if (commCount % 500 === 0) console.log(`   ✅ ${commCount} commissions...`);
    } catch (e) {}
  }
  
  console.log(`   ✅ Total: ${commCount} | Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);

  // 5. Validasi
  console.log('\n📊 HASIL AKHIR:');
  console.log('='.repeat(60));
  const dbTx = await prisma.transaction.count();
  const dbComm = await prisma.affiliateConversion.count();
  
  console.log(`   Transactions: ${dbTx} (target: 12,894)`);
  console.log(`   Omset: Rp ${totalOmset.toLocaleString('id-ID')} (target: Rp 4.172.579.962)`);
  console.log(`   Commissions: ${dbComm}`);
  console.log(`   Komisi: Rp ${totalKomisi.toLocaleString('id-ID')} (target: Rp 1.260.896.000)`);
  
  await prisma.$disconnect();
}

importAll().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});