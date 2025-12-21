const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function debug() {
  // Load Sejoli data
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const data = JSON.parse(fs.readFileSync(sejoliPath, 'utf-8'));
  
  // Build affiliate map
  const affiliateByCode = new Map();
  data.affiliates.forEach(a => {
    affiliateByCode.set(String(a.affiliate_code), {
      userId: a.user_id,
      email: a.user_email,
      name: a.display_name,
      code: a.affiliate_code
    });
  });
  
  console.log('Total affiliates in Sejoli:', affiliateByCode.size);
  
  // Get existing conversions
  const existingConversions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  });
  const hasConversion = new Set(existingConversions.map(c => c.transactionId));
  
  // Get SUCCESS transactions
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' }
  });
  
  // Find transactions needing conversion
  const txNeedingConversion = transactions.filter(tx => {
    if (hasConversion.has(tx.id)) return false;
    const meta = tx.metadata;
    const affId = meta?.affiliate_id || meta?.original?.affiliate_id;
    return affId && affId !== '0' && affId !== 0;
  });
  
  console.log('Transactions needing conversion:', txNeedingConversion.length);
  
  // Debug first 5
  for (const tx of txNeedingConversion.slice(0, 5)) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const affiliateInfo = affiliateByCode.get(affiliateCode);
    
    console.log('\nTx:', tx.id);
    console.log('  affiliate_id (=affiliate_code):', affiliateCode);
    console.log('  affiliate found:', affiliateInfo ? affiliateInfo.email : 'NOT FOUND');
    
    // Check if this is actually in the conversion table already
    const conv = await prisma.affiliateConversion.findUnique({
      where: { transactionId: tx.id }
    });
    console.log('  Has conversion:', !!conv);
  }
  
  // Check unique affiliate codes in needing conversion
  const uniqueCodes = new Set(txNeedingConversion.map(tx => {
    const meta = tx.metadata;
    return String(meta?.affiliate_id || meta?.original?.affiliate_id);
  }));
  console.log('\nUnique affiliate codes needed:', uniqueCodes.size);
  
  // Check how many codes exist in affiliateByCode
  let found = 0;
  let notFound = 0;
  const notFoundSamples = [];
  
  for (const code of uniqueCodes) {
    if (affiliateByCode.has(code)) {
      found++;
    } else {
      notFound++;
      if (notFoundSamples.length < 10) {
        notFoundSamples.push(code);
      }
    }
  }
  
  console.log('Found in Sejoli:', found);
  console.log('Not found in Sejoli:', notFound);
  console.log('Not found samples:', notFoundSamples);
  
  await prisma.$disconnect();
}

debug();
