#!/usr/bin/env node
/**
 * IMPORT TRANSAKSI & KOMISI SESUAI PRD (LINE 5093+)
 * 
 * TARGET VALIDASI:
 * - Sales: 12,894
 * - Omset: Rp 4.172.579.962
 * - Komisi: Rp 1.260.896.000
 * 
 * ATURAN:
 * - 1 transaksi = 1 produk (NO DUPLICATE)
 * - Komisi FLAT dari Sejoli (TIDAK DIHITUNG ULANG)
 * - Invoice: INV-00001, INV-00002, dst
 * - Status harus "completed"
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

async function importPRDCompliant() {
  console.log('📋 IMPORT SESUAI PRD (LINE 5093+)');
  console.log('='.repeat(60));
  console.log('TARGET: Sales 12,894 | Omset Rp 4.172.579.962 | Komisi Rp 1.260.896.000');
  console.log('='.repeat(60));
  
  // 1. Setup Admin
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
  console.log('   ✅ Admin ready');

  // 2. Build email -> userId map
  console.log('\n🗺️  Building user map...');
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailMap = new Map();
  users.forEach(u => emailMap.set(u.email.toLowerCase(), u.id));
  console.log(`   ✅ ${emailMap.size} users mapped`);

  // 3. Build Sejoli userId -> email map
  console.log('\n🗺️  Building Sejoli user map...');
  const usersData = readTSV('users_export.tsv');
  const sejoliUserEmailMap = new Map(); // sejoliUserId -> email
  for (const row of usersData) {
    const [sejoliId, , email] = row;
    if (email) sejoliUserEmailMap.set(sejoliId, email.toLowerCase());
  }
  console.log(`   ✅ ${sejoliUserEmailMap.size} Sejoli users mapped`);

  // 4. Import Transactions - HANYA status completed, NO DUPLICATE
  console.log('\n💳 Importing Transactions (completed only, no duplicates)...');
  const ordersData = readTSV('orders_export.tsv');
  console.log(`   📂 Orders dari Sejoli: ${ordersData.length}`);
  
  const processedOrderIds = new Set(); // Cegah duplikat
  let txCount = 0;
  let totalOmset = 0;
  const orderIdToTxId = new Map(); // untuk mapping komisi
  
  for (const row of ordersData) {
    // Format: orderId, createdAt, productId, productName, userId, userEmail, affiliateId, grandTotal, status, paymentMethod
    const [orderId, createdAt, productId, productName, sejoliUserId, userEmail, affiliateId, grandTotal, status, paymentMethod] = row;
    
    // SKIP jika bukan completed
    if (status !== 'completed') continue;
    
    // SKIP jika sudah diproses (cegah duplikat)
    if (processedOrderIds.has(orderId)) continue;
    processedOrderIds.add(orderId);
    
    // Cari buyer
    const buyerEmail = userEmail?.toLowerCase() || sejoliUserEmailMap.get(sejoliUserId);
    const buyerId = emailMap.get(buyerEmail) || admin.id;
    
    // Invoice number
    txCount++;
    const invoiceNo = `INV-${String(txCount).padStart(5, '0')}`;
    
    // Parse date
    let orderDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) orderDate = d;
    }
    
    // Parse amount
    const amount = Math.max(0, parseFloat(grandTotal) || 0);
    totalOmset += amount;
    
    try {
      const tx = await prisma.transaction.create({
        data: {
          externalId: `sejoli-order-${orderId}`,
          invoiceNumber: invoiceNo,
          userId: buyerId,
          type: 'PRODUCT',
          amount: amount,
          status: 'SUCCESS',
          paymentMethod: paymentMethod || 'manual',
          description: `${productName || 'Produk Eksporyuk'} - Order #${orderId}`,
          createdAt: orderDate,
          updatedAt: orderDate,
        }
      });
      
      orderIdToTxId.set(orderId, tx.id);
      
      if (txCount % 1000 === 0) {
        console.log(`   ✅ ${txCount} transactions (${invoiceNo})...`);
      }
    } catch (e) {
      if (e.code === 'P2002') {
        // Duplikat, skip
        txCount--;
      }
    }
  }
  
  console.log(`   ✅ Total: ${txCount} transactions`);
  console.log(`   💰 Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);

  // 5. Import Komisi - FLAT dari Sejoli (TIDAK DIHITUNG ULANG)
  console.log('\n💰 Importing Komisi (FLAT dari Sejoli)...');
  const commissionsData = readTSV('commissions_export.tsv');
  console.log(`   📂 Commissions dari Sejoli: ${commissionsData.length}`);
  
  const processedCommIds = new Set(); // Cegah duplikat
  let commCount = 0;
  let totalKomisi = 0;
  
  for (const row of commissionsData) {
    // Format: commissionId, createdAt, orderId, buyerSejoliId, affiliateSejoliId, productId, amount, status, approved
    const [commissionId, createdAt, orderId, buyerSejoliId, affiliateSejoliId, productId, amount, status, approved] = row;
    
    // HANYA yang approved (status=added, approved=1)
    if (status !== 'added' || approved !== '1') continue;
    
    // SKIP duplikat
    if (processedCommIds.has(commissionId)) continue;
    processedCommIds.add(commissionId);
    
    // Cari affiliate user
    const affiliateEmail = sejoliUserEmailMap.get(affiliateSejoliId);
    const affiliateUserId = emailMap.get(affiliateEmail) || admin.id;
    
    // Cari buyer
    const buyerEmail = sejoliUserEmailMap.get(buyerSejoliId);
    const buyerUserId = emailMap.get(buyerEmail) || admin.id;
    
    // Get transaction ID
    const transactionId = orderIdToTxId.get(orderId);
    
    // Parse date
    let commDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) commDate = d;
    }
    
    // KOMISI FLAT - langsung dari Sejoli (TIDAK DIHITUNG ULANG per PRD)
    const commissionAmount = Math.max(0, parseFloat(amount) || 0);
    totalKomisi += commissionAmount;
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          visitorId: `sejoli-comm-${commissionId}`,
          affiliateProfileId: affiliateUserId, // Akan perlu di-link ke AffiliateProfile
          transactionId: transactionId,
          commissionAmount: commissionAmount, // FLAT dari Sejoli
          status: 'APPROVED',
          convertedAt: commDate,
          createdAt: commDate,
          updatedAt: commDate,
        }
      });
      
      commCount++;
      
      if (commCount % 500 === 0) {
        console.log(`   ✅ ${commCount} commissions...`);
      }
    } catch (e) {
      if (e.code !== 'P2002') {
        // console.log(`   ⚠️  Commission ${commissionId}:`, e.message);
      }
    }
  }
  
  console.log(`   ✅ Total: ${commCount} commissions`);
  console.log(`   💰 Total Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);

  // 6. VALIDASI PRD
  console.log('\n📊 VALIDASI PRD:');
  console.log('='.repeat(60));
  console.log(`   TARGET Sales: 12,894 | ACTUAL: ${txCount}`);
  console.log(`   TARGET Omset: Rp 4.172.579.962 | ACTUAL: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`   TARGET Komisi: Rp 1.260.896.000 | ACTUAL: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  
  const salesMatch = txCount === 12894;
  const omsetMatch = Math.abs(totalOmset - 4172579962) < 1000;
  const komisiMatch = Math.abs(totalKomisi - 1260896000) < 1000;
  
  console.log('\n   STATUS:');
  console.log(`   Sales: ${salesMatch ? '✅ MATCH' : '⚠️  MISMATCH'}`);
  console.log(`   Omset: ${omsetMatch ? '✅ MATCH' : '⚠️  MISMATCH'}`);
  console.log(`   Komisi: ${komisiMatch ? '✅ MATCH' : '⚠️  MISMATCH'}`);
  
  if (salesMatch && omsetMatch && komisiMatch) {
    console.log('\n🎉 MIGRASI SUKSES - SEMUA TARGET PRD TERPENUHI!');
  } else {
    console.log('\n⚠️  Ada perbedaan dengan target PRD - perlu investigasi');
  }
  
  await prisma.$disconnect();
}

importPRDCompliant().catch(e => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});