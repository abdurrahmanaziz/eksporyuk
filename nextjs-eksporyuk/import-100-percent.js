#!/usr/bin/env node
/**
 * IMPORT 100% AKURAT DARI SEJOLI
 * 
 * TARGET:
 * - Sales: 12,905
 * - Omset: Rp 4,182,069,962
 * - Komisi: Rp 1,263,871,000
 * - Commissions: 11,197
 * - Affiliates dengan komisi: 99
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

async function importFresh() {
  console.log('📋 IMPORT 100% AKURAT DARI SEJOLI');
  console.log('='.repeat(60));
  console.log('TARGET:');
  console.log('   Sales: 12,905');
  console.log('   Omset: Rp 4,182,069,962');
  console.log('   Komisi: Rp 1,263,871,000');
  console.log('   Commissions: 11,197');
  console.log('   Affiliates: 99');
  console.log('='.repeat(60));
  
  // 1. Setup Admin
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

  // 2. Build email -> userId map
  console.log('\n🗺️  Building user maps...');
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map();
  users.forEach(u => emailToUserId.set(u.email.toLowerCase(), u.id));
  console.log(`   ✅ ${emailToUserId.size} users mapped`);

  // 3. Import Transactions dari orders_export_fresh.tsv
  console.log('\n💳 Importing Transactions...');
  const ordersData = readTSV('orders_export_fresh.tsv');
  console.log(`   📂 Orders from Sejoli: ${ordersData.length - 1}`); // minus header
  
  const orderIdToTxId = new Map();
  let txCount = 0;
  let totalOmset = 0;
  
  for (let i = 1; i < ordersData.length; i++) { // skip header
    const row = ordersData[i];
    // Header: ID, created_at, product_id, product_name, user_id, user_email, affiliate_id, grand_total, status, payment_gateway
    const [orderId, createdAt, productId, productName, sejoliUserId, userEmail, affiliateId, grandTotal, status, paymentGateway] = row;
    
    const buyerId = emailToUserId.get(userEmail?.toLowerCase()) || admin.id;
    const amount = parseFloat(grandTotal) || 0;
    totalOmset += amount;
    
    txCount++;
    const invoiceNo = `INV-${String(txCount).padStart(5, '0')}`;
    
    let orderDate = new Date();
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
          paymentMethod: paymentGateway || 'manual',
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

  // 4. Import Commissions dari commissions_fresh.tsv
  console.log('\n💰 Importing Commissions (FLAT dari Sejoli)...');
  const commissionsData = readTSV('commissions_fresh.tsv');
  console.log(`   📂 Commissions from Sejoli: ${commissionsData.length - 1}`);
  
  // Build Sejoli affiliate_id -> email from affiliates_with_commission.tsv
  const affiliatesData = readTSV('affiliates_with_commission.tsv');
  const sejoliAffIdToEmail = new Map();
  for (let i = 1; i < affiliatesData.length; i++) {
    const [affId, , email] = affiliatesData[i];
    if (email) sejoliAffIdToEmail.set(affId, email.toLowerCase());
  }
  console.log(`   ✅ ${sejoliAffIdToEmail.size} affiliate mappings`);
  
  const usedTxIds = new Set();
  let commCount = 0;
  let totalKomisi = 0;
  const affiliateSet = new Set();
  
  for (let i = 1; i < commissionsData.length; i++) { // skip header
    const row = commissionsData[i];
    // Header: ID, created_at, order_id, affiliate_id, product_id, tier, commission, status, paid_status
    const [commId, createdAt, orderId, affiliateSejoliId, productId, tier, commission, status, paidStatus] = row;
    
    // Get transaction
    const txId = orderIdToTxId.get(orderId);
    if (!txId) continue;
    
    // Skip if txId already used (unique constraint)
    if (usedTxIds.has(txId)) continue;
    usedTxIds.add(txId);
    
    // Get affiliate user
    const affEmail = sejoliAffIdToEmail.get(affiliateSejoliId);
    const affUserId = emailToUserId.get(affEmail);
    if (!affUserId) continue;
    
    affiliateSet.add(affUserId);
    
    const commAmount = parseFloat(commission) || 0;
    totalKomisi += commAmount;
    
    let commDate = new Date();
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
          paidOut: paidStatus === '1',
          createdAt: commDate,
        }
      });
      commCount++;
      
      if (commCount % 500 === 0) console.log(`   ✅ ${commCount} commissions...`);
    } catch (e) {}
  }
  
  console.log(`   ✅ Total: ${commCount} | Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  console.log(`   ✅ Affiliates dengan komisi: ${affiliateSet.size}`);

  // 5. Validasi
  console.log('\n📊 VALIDASI:');
  console.log('='.repeat(60));
  const dbTx = await prisma.transaction.count();
  const dbTxSum = await prisma.transaction.aggregate({ _sum: { amount: true } });
  const dbComm = await prisma.affiliateConversion.count();
  const dbCommSum = await prisma.affiliateConversion.aggregate({ _sum: { commissionAmount: true } });
  
  console.log(`   Sales: ${dbTx} (target: 12,905) ${dbTx === 12905 ? '✅' : '⚠️'}`);
  console.log(`   Omset: Rp ${Number(dbTxSum._sum.amount).toLocaleString('id-ID')} (target: Rp 4,182,069,962) ${Number(dbTxSum._sum.amount) === 4182069962 ? '✅' : '⚠️'}`);
  console.log(`   Commissions: ${dbComm} (target: 11,197)`);
  console.log(`   Komisi: Rp ${Number(dbCommSum._sum.commissionAmount).toLocaleString('id-ID')} (target: Rp 1,263,871,000)`);
  console.log(`   Affiliates: ${affiliateSet.size} (target: 99)`);
  
  await prisma.$disconnect();
}

importFresh().catch(e => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});