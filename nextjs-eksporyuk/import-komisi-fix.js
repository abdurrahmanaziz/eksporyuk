#!/usr/bin/env node
/**
 * IMPORT KOMISI SESUAI PRD - FIX SCHEMA
 * Komisi FLAT dari Sejoli (TIDAK DIHITUNG ULANG)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

function generateId() {
  return uuidv4().replace(/-/g, '').substring(0, 25);
}

async function importKomisi() {
  console.log('💰 IMPORT KOMISI SESUAI PRD');
  console.log('='.repeat(50));
  
  // 1. Build user maps
  console.log('\n🗺️  Building maps...');
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailMap = new Map();
  users.forEach(u => emailMap.set(u.email.toLowerCase(), u.id));
  
  const usersData = readTSV('users_export.tsv');
  const sejoliUserEmailMap = new Map();
  for (const row of usersData) {
    const [sejoliId, , email] = row;
    if (email) sejoliUserEmailMap.set(sejoliId, email.toLowerCase());
  }
  
  // 2. Get transaction map (orderId -> transactionId)
  const transactions = await prisma.transaction.findMany({ 
    select: { id: true, externalId: true } 
  });
  const orderIdToTxId = new Map();
  for (const tx of transactions) {
    // externalId format: sejoli-order-123
    const orderId = tx.externalId?.replace('sejoli-order-', '');
    if (orderId) orderIdToTxId.set(orderId, tx.id);
  }
  console.log(`   ✅ ${orderIdToTxId.size} transactions mapped`);
  
  // 3. Import komisi
  console.log('\n💰 Importing Komisi (FLAT dari Sejoli)...');
  const commissionsData = readTSV('commissions_export.tsv');
  console.log(`   📂 Commissions dari Sejoli: ${commissionsData.length}`);
  
  const processedCommIds = new Set();
  const processedTxIds = new Set(); // transactionId harus unique
  let commCount = 0;
  let totalKomisi = 0;
  let skipped = 0;
  
  for (const row of commissionsData) {
    const [commissionId, createdAt, orderId, buyerSejoliId, affiliateSejoliId, productId, amount, status, approved] = row;
    
    // HANYA yang approved
    if (status !== 'added' || approved !== '1') continue;
    
    // Skip duplikat commission
    if (processedCommIds.has(commissionId)) continue;
    processedCommIds.add(commissionId);
    
    // Get transaction ID (WAJIB ada dan unique)
    const transactionId = orderIdToTxId.get(orderId);
    if (!transactionId) {
      skipped++;
      continue;
    }
    
    // Skip jika transactionId sudah dipakai (unique constraint)
    if (processedTxIds.has(transactionId)) {
      skipped++;
      continue;
    }
    processedTxIds.add(transactionId);
    
    // Cari affiliate
    const affiliateEmail = sejoliUserEmailMap.get(affiliateSejoliId);
    const affiliateUserId = emailMap.get(affiliateEmail);
    if (!affiliateUserId) {
      skipped++;
      continue;
    }
    
    // KOMISI FLAT dari Sejoli
    const commissionAmount = Math.max(0, parseFloat(amount) || 0);
    totalKomisi += commissionAmount;
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          id: generateId(),
          affiliateId: affiliateUserId,
          transactionId: transactionId,
          commissionAmount: commissionAmount,
          commissionRate: 0, // FLAT, bukan persentase
          paidOut: false,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        }
      });
      
      commCount++;
      
      if (commCount % 500 === 0) {
        console.log(`   ✅ ${commCount} commissions...`);
      }
    } catch (e) {
      if (e.code !== 'P2002') {
        // console.log(`   ⚠️  ${commissionId}:`, e.message);
      }
      skipped++;
    }
  }
  
  console.log(`\n✅ SELESAI!`);
  console.log(`   Imported: ${commCount}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   💰 Total Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  
  // Verify
  const dbComm = await prisma.affiliateConversion.count();
  console.log(`   Di DB: ${dbComm}`);
  
  await prisma.$disconnect();
}

importKomisi().catch(e => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});