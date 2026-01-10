#!/usr/bin/env node
/**
 * FIX MISSING COMMISSIONS
 * Import commissions yang tidak masuk karena affiliate mapping
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

async function fixMissingCommissions() {
  console.log('🔧 FIX MISSING COMMISSIONS');
  console.log('='.repeat(60));
  
  // 1. Build Sejoli user_id -> email map from users_export.tsv
  console.log('\n📋 Building Sejoli user ID -> email map...');
  const usersData = readTSV('users_export.tsv');
  const sejoliIdToEmail = new Map();
  for (let i = 1; i < usersData.length; i++) {
    const row = usersData[i];
    // Header: ID, display_name, user_nicename, user_url, user_email, user_registered
    const [sejoliId, , , , email] = row;
    if (sejoliId && email) {
      sejoliIdToEmail.set(sejoliId, email.toLowerCase());
    }
  }
  console.log(`   ✅ ${sejoliIdToEmail.size} Sejoli users mapped`);

  // 2. Get DB users email -> id
  console.log('\n📋 Getting DB users...');
  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true }});
  const emailToUserId = new Map();
  dbUsers.forEach(u => emailToUserId.set(u.email.toLowerCase(), u.id));
  console.log(`   ✅ ${emailToUserId.size} DB users mapped`);

  // 3. Get all transactions
  console.log('\n📋 Getting transactions...');
  const transactions = await prisma.transaction.findMany({ select: { id: true, invoiceNumber: true, externalId: true }});
  const txByOrderId = new Map();
  transactions.forEach(t => {
    // externalId format: sejoli-{orderId}
    const orderId = t.externalId?.replace('sejoli-', '');
    if (orderId) txByOrderId.set(orderId, t.id);
  });
  console.log(`   ✅ ${txByOrderId.size} transactions mapped`);

  // 4. Get existing conversions
  console.log('\n📋 Getting existing conversions...');
  const existingConversions = await prisma.affiliateConversion.findMany({ select: { transactionId: true }});
  const existingTxIds = new Set(existingConversions.map(c => c.transactionId));
  console.log(`   ✅ ${existingTxIds.size} existing conversions`);

  // 5. Read commissions file
  const commissionsData = readTSV('commissions_fresh.tsv');
  console.log(`\n📋 Processing ${commissionsData.length - 1} commissions from file...`);

  let imported = 0;
  let skipped = {
    noTransaction: 0,
    alreadyExists: 0,
    noAffiliateMapping: 0,
    noDbUser: 0,
  };
  let totalKomisi = 0;
  const affiliateSet = new Set();

  for (let i = 1; i < commissionsData.length; i++) {
    const row = commissionsData[i];
    // Header: ID, created_at, order_id, affiliate_id, product_id, tier, commission, status, paid_status
    const [commId, createdAt, orderId, affiliateSejoliId, productId, tier, commission, status, paidStatus] = row;
    
    // Get transaction
    const txId = txByOrderId.get(orderId);
    if (!txId) {
      skipped.noTransaction++;
      continue;
    }
    
    // Check if already exists
    if (existingTxIds.has(txId)) {
      skipped.alreadyExists++;
      continue;
    }
    
    // Get affiliate email from Sejoli user mapping
    const affEmail = sejoliIdToEmail.get(affiliateSejoliId);
    if (!affEmail) {
      skipped.noAffiliateMapping++;
      continue;
    }
    
    // Get DB user id
    const affUserId = emailToUserId.get(affEmail);
    if (!affUserId) {
      skipped.noDbUser++;
      continue;
    }
    
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
      imported++;
      existingTxIds.add(txId); // Mark as imported
      
      if (imported % 100 === 0) console.log(`   ✅ Imported ${imported}...`);
    } catch (e) {
      console.log(`   ⚠️ Error: ${e.message}`);
    }
  }
  
  console.log('\n📊 HASIL FIX:');
  console.log('='.repeat(60));
  console.log(`   Imported: ${imported}`);
  console.log(`   Total komisi imported: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  console.log(`   Affiliates: ${affiliateSet.size}`);
  console.log('\nSkipped reasons:');
  console.log(`   - No transaction: ${skipped.noTransaction}`);
  console.log(`   - Already exists: ${skipped.alreadyExists}`);
  console.log(`   - No affiliate mapping: ${skipped.noAffiliateMapping}`);
  console.log(`   - No DB user: ${skipped.noDbUser}`);

  // 6. Final validation
  console.log('\n📊 FINAL DATABASE STATE:');
  console.log('='.repeat(60));
  const dbComm = await prisma.affiliateConversion.count();
  const dbCommSum = await prisma.affiliateConversion.aggregate({ _sum: { commissionAmount: true }});
  const uniqueAffs = await prisma.$queryRaw`SELECT COUNT(DISTINCT "affiliateId") as count FROM "AffiliateConversion"`;
  
  console.log(`   Commissions: ${dbComm} (target: 11,197)`);
  console.log(`   Komisi: Rp ${Number(dbCommSum._sum.commissionAmount).toLocaleString('id-ID')} (target: Rp 1,263,871,000)`);
  console.log(`   Affiliates: ${Number(uniqueAffs[0].count)} (target: 99)`);
  
  await prisma.$disconnect();
}

fixMissingCommissions().catch(e => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});
