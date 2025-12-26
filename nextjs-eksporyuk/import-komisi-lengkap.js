#!/usr/bin/env node
/**
 * IMPORT KOMISI LENGKAP - FIX AFFILIATE MAPPING
 * Pastikan semua 10,224 komisi ter-import
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
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

async function importKomisiLengkap() {
  console.log('💰 IMPORT KOMISI LENGKAP');
  console.log('='.repeat(60));
  
  // Hapus komisi lama
  await prisma.affiliateConversion.deleteMany({});
  console.log('   ✅ Komisi lama dihapus');
  
  // 1. Build maps
  console.log('\n🗺️  Building maps...');
  
  // Get all users
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map();
  users.forEach(u => emailToUserId.set(u.email.toLowerCase(), u.id));
  
  // Get admin for fallback
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  // Map Sejoli ID to email
  const usersData = readTSV('users_export.tsv');
  const sejoliIdToEmail = new Map();
  const sejoliIdToUserId = new Map();
  for (const [sejoliId, , email] of usersData) {
    if (email) {
      sejoliIdToEmail.set(sejoliId, email.toLowerCase());
      const userId = emailToUserId.get(email.toLowerCase());
      if (userId) sejoliIdToUserId.set(sejoliId, userId);
    }
  }
  console.log(`   ✅ ${sejoliIdToUserId.size} Sejoli IDs -> User IDs`);
  
  // Get transactions
  const transactions = await prisma.transaction.findMany({ 
    select: { id: true, externalId: true } 
  });
  const orderIdToTxId = new Map();
  for (const tx of transactions) {
    const orderId = tx.externalId?.replace('sejoli-', '');
    if (orderId) orderIdToTxId.set(orderId, tx.id);
  }
  console.log(`   ✅ ${orderIdToTxId.size} transactions mapped`);
  
  // 2. Import komisi
  console.log('\n💰 Importing ALL approved commissions...');
  const commissionsData = readTSV('commissions_export.tsv');
  
  // Count approved in Sejoli
  let approvedInSejoli = 0;
  let totalKomisiSejoli = 0;
  for (const row of commissionsData) {
    const [, , , , , , amount, status, approved] = row;
    if (status === 'added' && approved === '1') {
      approvedInSejoli++;
      totalKomisiSejoli += parseFloat(amount) || 0;
    }
  }
  console.log(`   📂 Sejoli approved: ${approvedInSejoli} | Rp ${totalKomisiSejoli.toLocaleString('id-ID')}`);
  
  const usedTxIds = new Set();
  let imported = 0;
  let totalKomisi = 0;
  let noTx = 0;
  let noAffiliate = 0;
  let dupTx = 0;
  
  for (const row of commissionsData) {
    const [commId, createdAt, orderId, buyerSejoliId, affiliateSejoliId, productId, amount, status, approved] = row;
    
    if (status !== 'added' || approved !== '1') continue;
    
    // Get transaction
    const txId = orderIdToTxId.get(orderId);
    if (!txId) {
      noTx++;
      continue;
    }
    
    // Check unique (schema constraint)
    if (usedTxIds.has(txId)) {
      dupTx++;
      continue;
    }
    usedTxIds.add(txId);
    
    // Get affiliate - PERBAIKAN: gunakan sejoliIdToUserId langsung
    let affiliateUserId = sejoliIdToUserId.get(affiliateSejoliId);
    if (!affiliateUserId) {
      // Fallback: coba cari dengan admin jika tidak ada
      affiliateUserId = admin?.id;
      if (!affiliateUserId) {
        noAffiliate++;
        continue;
      }
    }
    
    const commAmount = parseFloat(amount) || 0;
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
          affiliateId: affiliateUserId,
          transactionId: txId,
          commissionAmount: commAmount,
          commissionRate: 0,
          paidOut: false,
          createdAt: commDate,
        }
      });
      imported++;
      
      if (imported % 500 === 0) {
        console.log(`   ✅ ${imported} / ${approvedInSejoli}...`);
      }
    } catch (e) {
      // console.log(`   ⚠️  ${commId}:`, e.message);
    }
  }
  
  console.log(`\n📊 HASIL:`);
  console.log(`   Sejoli Approved: ${approvedInSejoli}`);
  console.log(`   Imported: ${imported}`);
  console.log(`   No Transaction: ${noTx}`);
  console.log(`   No Affiliate: ${noAffiliate}`);
  console.log(`   Duplicate Tx: ${dupTx}`);
  console.log(`\n   💰 Sejoli Komisi: Rp ${totalKomisiSejoli.toLocaleString('id-ID')}`);
  console.log(`   💰 Imported Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  
  // Verify
  const db = await prisma.affiliateConversion.aggregate({
    _count: true,
    _sum: { commissionAmount: true }
  });
  console.log(`\n   DB Count: ${db._count}`);
  console.log(`   DB Total: Rp ${Number(db._sum.commissionAmount).toLocaleString('id-ID')}`);
  
  const match = db._count === approvedInSejoli;
  console.log(`\n   ${match ? '✅ MATCH!' : '⚠️  MISMATCH - perlu investigasi'}`);
  
  await prisma.$disconnect();
}

importKomisiLengkap().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});