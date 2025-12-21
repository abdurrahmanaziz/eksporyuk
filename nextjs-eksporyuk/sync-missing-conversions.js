/**
 * SYNC MISSING CONVERSIONS
 * Script untuk mengisi konversi affiliate yang belum ada di database
 * SAFE: Tidak hapus data, hanya menambah yang missing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const PRODUCT_COMMISSION = {
  // LIFETIME MEMBERSHIP
  28: 100000, 93: 150000, 179: 250000, 1529: 200000, 3840: 300000,
  4684: 250000, 6068: 280000, 6810: 250000, 11207: 280000, 13401: 325000,
  15234: 300000, 16956: 280000, 17920: 250000, 19296: 280000, 20852: 280000,
  // 12 BULAN
  8683: 300000, 13399: 250000,
  // 6 BULAN  
  8684: 250000, 13400: 200000,
  // RENEWAL (no commission)
  8910: 0, 8914: 0, 8915: 0,
  // EVENT/WEBINAR
  397: 0, 488: 0, 12994: 50000, 13039: 50000, 13045: 50000,
  16130: 50000, 16860: 50000, 16963: 50000, 17227: 50000, 17322: 50000,
  17767: 50000, 18358: 50000, 18528: 20000, 18705: 50000, 18893: 50000,
  19042: 50000, 20130: 50000, 20336: 50000, 21476: 50000,
  // TOOL/APLIKASI
  2910: 0, 3764: 85000, 4220: 50000, 8686: 0,
  // JASA
  5928: 150000, 5932: 100000, 5935: 100000, 16581: 0, 16587: 0, 16592: 0,
  // GRATIS & LAINNYA
  300: 0, 16826: 0
};

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       SYNC MISSING AFFILIATE CONVERSIONS                      ║');
  console.log('║       Safe mode: hanya menambah, tidak hapus                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Load Sejoli data
  console.log('📂 Loading Sejoli export data...');
  const data = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  const completedWithAffiliate = data.orders.filter(o => o.status === 'completed' && o.affiliate_id > 0);
  
  // Build order map
  const orderMap = new Map();
  completedWithAffiliate.forEach(o => {
    if (o.ID) orderMap.set(o.ID.toString(), o);
  });
  
  console.log(`   ✓ ${completedWithAffiliate.length} completed orders with affiliate\n`);
  
  // Get existing conversions
  console.log('📊 Checking existing data...');
  const existingConversions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  });
  const existingTxIds = new Set(existingConversions.map(c => c.transactionId));
  console.log(`   ✓ ${existingConversions.length} existing conversions\n`);
  
  // Find transactions without conversion
  const txWithoutConv = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      NOT: { id: { in: Array.from(existingTxIds) } }
    },
    select: { id: true, externalId: true, amount: true, userId: true }
  });
  console.log(`   ✓ ${txWithoutConv.length} SUCCESS transactions without conversion\n`);
  
  // Get affiliate profiles
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    include: { user: true }
  });
  const affiliateByUserId = new Map();
  affiliateProfiles.forEach(ap => affiliateByUserId.set(ap.userId, ap));
  
  // Build affiliate lookup by Sejoli name
  const affiliateNameMap = new Map();
  const affiliateData = data.affiliates || [];
  
  for (const sejAff of affiliateData) {
    if (sejAff.display_name) {
      affiliateNameMap.set(sejAff.ID, {
        name: sejAff.display_name,
        email: sejAff.user_email || '',
        id: sejAff.ID
      });
    }
  }
  
  // Analyze missing conversions
  console.log('🔍 Analyzing missing conversions...\n');
  
  const toCreate = [];
  let skippedNoAffiliate = 0;
  let skippedZeroComm = 0;
  let skippedNoMatch = 0;
  
  for (const tx of txWithoutConv) {
    if (!tx.externalId) {
      skippedNoMatch++;
      continue;
    }
    
    const orderId = tx.externalId.replace('sejoli-', '');
    const sejoliOrder = orderMap.get(orderId);
    
    if (!sejoliOrder) {
      skippedNoMatch++;
      continue;
    }
    
    const commission = PRODUCT_COMMISSION[sejoliOrder.product_id] || 0;
    if (commission === 0) {
      skippedZeroComm++;
      continue;
    }
    
    // Find affiliate by Sejoli data lookup
    const sejoliAffData = affiliateNameMap.get(sejoliOrder.affiliate_id);
    if (!sejoliAffData) {
      skippedNoAffiliate++;
      continue;
    }
    
    // Find affiliate profile by matching user name
    let affProfile = null;
    for (const ap of affiliateProfiles) {
      if (ap.user.name === sejoliAffData.name || 
          ap.user.email === sejoliAffData.email) {
        affProfile = ap;
        break;
      }
    }
    
    if (!affProfile) {
      skippedNoAffiliate++;
      continue;
    }
    
    toCreate.push({
      affiliateId: affProfile.id,
      transactionId: tx.id,
      commissionAmount: commission,
      commissionRate: 0,
      paidOut: false
    });
  }
  
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│ ANALYSIS RESULT                                    │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ To create        : ${toCreate.length.toLocaleString().padStart(10)} conversions`);
  console.log(`│ Skipped (no match): ${skippedNoMatch.toLocaleString().padStart(9)}`);
  console.log(`│ Skipped (0 comm)  : ${skippedZeroComm.toLocaleString().padStart(9)}`);
  console.log(`│ Skipped (no aff)  : ${skippedNoAffiliate.toLocaleString().padStart(9)}`);
  console.log('└────────────────────────────────────────────────────┘');
  
  if (toCreate.length === 0) {
    console.log('\n✅ Tidak ada konversi baru yang perlu ditambahkan.');
    await prisma.$disconnect();
    return;
  }
  
  // Calculate totals
  const totalNewComm = toCreate.reduce((sum, c) => sum + c.commissionAmount, 0);
  const currentComm = await prisma.affiliateConversion.aggregate({ _sum: { commissionAmount: true }});
  const currentTotal = Number(currentComm._sum.commissionAmount) || 0;
  
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│ COMMISSION PROJECTION                              │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Current total    : Rp ${currentTotal.toLocaleString().padStart(15)}`);
  console.log(`│ + New conversions: Rp ${totalNewComm.toLocaleString().padStart(15)}`);
  console.log(`│ = New total      : Rp ${(currentTotal + totalNewComm).toLocaleString().padStart(15)}`);
  console.log(`│ Target (Sejoli)  : Rp   1,249,646,000`);
  console.log('└────────────────────────────────────────────────────┘');
  
  // Create conversions in batches
  console.log('\n📥 Creating missing conversions...');
  
  const batchSize = 500;
  let created = 0;
  let errors = 0;
  
  for (let i = 0; i < toCreate.length; i += batchSize) {
    const batch = toCreate.slice(i, i + batchSize);
    
    try {
      await prisma.affiliateConversion.createMany({
        data: batch,
        skipDuplicates: true
      });
      created += batch.length;
      process.stdout.write(`\r   Progress: ${created}/${toCreate.length} (${Math.round(created/toCreate.length*100)}%)`);
    } catch (err) {
      errors += batch.length;
      console.error(`\n   ❌ Batch error: ${err.message}`);
    }
  }
  
  console.log(`\n\n✅ Created ${created} conversions (${errors} errors)`);
  
  // Final verification
  const finalComm = await prisma.affiliateConversion.aggregate({ 
    _sum: { commissionAmount: true },
    _count: true
  });
  
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│ FINAL RESULT                                       │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Total conversions: ${finalComm._count.toLocaleString().padStart(10)}`);
  console.log(`│ Total commission : Rp ${Number(finalComm._sum.commissionAmount).toLocaleString().padStart(15)}`);
  console.log('└────────────────────────────────────────────────────┘');
  
  await prisma.$disconnect();
}

main().catch(console.error);
