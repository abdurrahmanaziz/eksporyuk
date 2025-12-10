/**
 * UPDATE TRANSACTION AFFILIATES
 * ===============================
 * Update existing transactions to link with affiliate profiles
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🔗 LINKING TRANSACTIONS TO AFFILIATES');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Load data
  console.log('📂 Loading data...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`   Orders: ${data.orders.length}`);
  console.log(`   Affiliates: ${data.affiliates.length}\n`);

  // Build WP affiliate ID to Eksporyuk profile ID map
  console.log('🗺️  Building affiliate map...');
  const wpAffIdToProfileId = new Map();
  const wpUserIdToProfileId = new Map();
  
  // Get all affiliate profiles
  const profiles = await prisma.affiliateProfile.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: { email: true }
      }
    }
  });
  
  console.log(`   Found ${profiles.length} affiliate profiles`);
  
  // Build map: WP user_id -> profile_id (for self-referral)
  for (const wpUser of data.users) {
    const email = wpUser.user_email?.toLowerCase();
    if (!email) continue;
    
    const profile = profiles.find(p => p.user.email === email);
    if (profile) {
      wpUserIdToProfileId.set(wpUser.id, profile.id);
    }
  }
  
  console.log(`   Mapped ${wpUserIdToProfileId.size} WP users to profiles\n`);

  // Get transactions that need updating
  console.log('🔍 Finding transactions to update...');
  const transactions = await prisma.transaction.findMany({
    where: {
      reference: { startsWith: 'SEJOLI-' },
      affiliateId: null
    },
    select: {
      id: true,
      reference: true,
      metadata: true
    }
  });
  
  console.log(`   Found ${transactions.length} transactions without affiliates\n`);

  // Update transactions
  let updated = 0;
  let notFound = 0;
  let noAffiliateInOrder = 0;

  console.log('📝 Updating transactions...\n');

  for (const tx of transactions) {
    try {
      // Extract original order ID from reference
      const orderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = data.orders.find(o => o.id === orderId);
      
      if (!order) {
        notFound++;
        continue;
      }
      
      // Try to link to affiliate profile
      // Strategy: Use self-referral (user's own affiliate profile) since we don't have proper affiliate mapping
      const selfAffiliateId = wpUserIdToProfileId.get(order.user_id);
      
      if (selfAffiliateId) {
        // Update transaction
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            affiliateId: selfAffiliateId,
            metadata: {
              ...(tx.metadata || {}),
              originalAffiliateId: order.affiliate_id || null,
              affiliateLinked: new Date().toISOString(),
              linkType: order.affiliate_id > 0 ? 'self-referral-fallback' : 'self-referral'
            }
          }
        });
        
        updated++;
        
        if (updated % 500 === 0) {
          console.log(`   ✅ Updated ${updated} transactions...`);
        }
      } else {
        if (!order.affiliate_id || order.affiliate_id === 0) {
          noAffiliateInOrder++;
        } else {
          notFound++;
        }
      }
    } catch (e) {
      console.error(`   ⚠️  Error updating ${tx.reference}:`, e.message.substring(0, 100));
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('📊 UPDATE SUMMARY');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  No affiliate in order: ${noAffiliateInOrder}`);
  console.log(`   ❌ Affiliate not found: ${notFound}\n`);

  // Final check
  const txWithAff = await prisma.transaction.count({
    where: { 
      reference: { startsWith: 'SEJOLI-' },
      affiliateId: { not: null } 
    }
  });
  
  const txWithoutAff = await prisma.transaction.count({
    where: { 
      reference: { startsWith: 'SEJOLI-' },
      affiliateId: null 
    }
  });
  
  console.log('📈 Final Status:');
  console.log(`   With affiliate: ${txWithAff}`);
  console.log(`   Without affiliate: ${txWithoutAff}\n`);

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETED!');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
