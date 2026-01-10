/**
 * FIX AFFILIATE PROFILES - Add sejoliAffiliateId
 * Then create missing conversions
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Product commission mapping
const productCommissions = {
  28: 0, 93: 0, 179: 250000, 1529: 0, 3840: 300000, 
  4684: 175000, 6068: 175000, 6810: 250000, 11207: 275000, 
  13401: 325000, 15234: 280000, 16956: 280000, 17920: 250000, 
  19296: 280000, 20852: 280000,
  8683: 300000, 13399: 250000,
  8684: 250000, 13400: 200000,
  8910: 0, 8914: 0, 8915: 0,
  397: 100000, 488: 100000, 12994: 50000, 13039: 50000, 13045: 50000,
  16130: 50000, 16860: 50000, 16963: 50000, 17227: 50000, 17322: 50000,
  17767: 50000, 18358: 50000, 18528: 20000, 18705: 50000, 18893: 50000,
  19042: 50000, 20130: 50000, 20336: 50000, 21476: 50000,
  2910: 85000, 3764: 0, 4220: 0, 8686: 50000,
  5928: 0, 5932: 150000, 5935: 0, 16581: 0, 16587: 150000, 16592: 150000,
  300: 0, 16826: 0
};

function getCommission(productId, amount) {
  const pid = parseInt(productId);
  if (productCommissions[pid] !== undefined) {
    return productCommissions[pid];
  }
  return Math.round(Number(amount) * 0.3);
}

async function fixAffiliatesAndConversions() {
  console.log('\n=== FIX AFFILIATES AND CONVERSIONS ===\n');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Load Sejoli data
    const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const raw = fs.readFileSync(sejoliPath, 'utf-8');
    const sejoliData = JSON.parse(raw);
    
    console.log(`Loaded Sejoli data: ${sejoliData.affiliates?.length || 0} affiliates`);
    
    // Get users from database
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    const userByEmail = new Map();
    users.forEach(u => {
      if (u.email) userByEmail.set(u.email.toLowerCase(), u);
    });
    
    console.log(`Database users: ${users.length}`);
    
    // Find affiliates that have transactions
    const txWithAffiliate = await prisma.transaction.findMany({
      where: { 
        status: 'SUCCESS',
        affiliateConversion: null
      },
      select: { metadata: true }
    });
    
    // Get unique affiliate IDs from transactions
    const affiliateIdsInTx = new Set();
    txWithAffiliate.forEach(tx => {
      const meta = tx.metadata || {};
      const affId = meta.affiliateId || meta.affiliate_id || meta.sejoliAffiliateId;
      if (affId && affId !== '0' && affId !== 0) {
        affiliateIdsInTx.add(String(affId));
      }
    });
    
    console.log(`Unique affiliate IDs in transactions: ${affiliateIdsInTx.size}`);
    
    // Create Sejoli affiliate map
    const sejoliAffiliateMap = new Map();
    sejoliData.affiliates.forEach(aff => {
      sejoliAffiliateMap.set(String(aff.ID), aff);
    });
    
    // STEP 1: Create or update affiliate profiles
    console.log('\n📝 STEP 1: Creating/updating affiliate profiles...');
    
    let profilesCreated = 0;
    let profilesUpdated = 0;
    let profilesSkipped = 0;
    
    // Map to store affiliateProfile by sejoliAffiliateId
    const affiliateProfileBySejoliId = new Map();
    
    // First, get existing profiles
    const existingProfiles = await prisma.affiliateProfile.findMany({
      include: { user: { select: { email: true } } }
    });
    
    // Map existing by user email
    existingProfiles.forEach(p => {
      if (p.user?.email) {
        affiliateProfileBySejoliId.set(p.user.email.toLowerCase(), p);
      }
    });
    
    // Create profiles for affiliates that have transactions
    for (const sejoliAffId of affiliateIdsInTx) {
      const sejoliAff = sejoliAffiliateMap.get(sejoliAffId);
      if (!sejoliAff) {
        profilesSkipped++;
        continue;
      }
      
      // Find user by email
      const userEmail = sejoliAff.user_email?.toLowerCase();
      if (!userEmail) {
        profilesSkipped++;
        continue;
      }
      
      const user = userByEmail.get(userEmail);
      if (!user) {
        profilesSkipped++;
        continue;
      }
      
      // Check if profile exists
      let profile = await prisma.affiliateProfile.findUnique({
        where: { userId: user.id }
      });
      
      if (profile) {
        // Update with sejoliAffiliateId if not set
        if (!profile.sejoliAffiliateId) {
          await prisma.affiliateProfile.update({
            where: { id: profile.id },
            data: { sejoliAffiliateId: sejoliAffId }
          });
          profilesUpdated++;
        }
        affiliateProfileBySejoliId.set(sejoliAffId, profile);
      } else {
        // Create new profile
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        profile = await prisma.affiliateProfile.create({
          data: {
            userId: user.id,
            affiliateCode: code,
            sejoliAffiliateId: sejoliAffId,
            status: 'ACTIVE',
            commissionRate: 30
          }
        });
        profilesCreated++;
        affiliateProfileBySejoliId.set(sejoliAffId, profile);
      }
    }
    
    console.log(`- Created: ${profilesCreated}`);
    console.log(`- Updated with Sejoli ID: ${profilesUpdated}`);
    console.log(`- Skipped (no user found): ${profilesSkipped}`);
    
    // Reload affiliate profiles
    const allProfiles = await prisma.affiliateProfile.findMany();
    allProfiles.forEach(p => {
      if (p.sejoliAffiliateId) {
        affiliateProfileBySejoliId.set(p.sejoliAffiliateId, p);
      }
    });
    
    console.log(`\nTotal profiles with Sejoli ID: ${[...affiliateProfileBySejoliId.entries()].filter(([k]) => k.match(/^\d+$/)).length}`);
    
    // STEP 2: Create affiliate conversions
    console.log('\n💰 STEP 2: Creating affiliate conversions...');
    
    const allSuccessTx = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      include: { affiliateConversion: true }
    });
    
    let conversionsCreated = 0;
    let conversionsSkipped = 0;
    let noAffiliateProfile = 0;
    let noAffiliateInMeta = 0;
    
    for (const tx of allSuccessTx) {
      // Skip if already has conversion
      if (tx.affiliateConversion) {
        conversionsSkipped++;
        continue;
      }
      
      const meta = tx.metadata || {};
      const sejoliAffId = String(meta.affiliateId || meta.affiliate_id || meta.sejoliAffiliateId || '');
      
      if (!sejoliAffId || sejoliAffId === '0' || sejoliAffId === 'undefined' || sejoliAffId === 'null') {
        noAffiliateInMeta++;
        continue;
      }
      
      // Find affiliate profile
      const profile = affiliateProfileBySejoliId.get(sejoliAffId);
      if (!profile) {
        noAffiliateProfile++;
        continue;
      }
      
      // Calculate commission
      const productId = meta.product_id || meta.productId || meta.sejoliProductId;
      const commission = getCommission(productId, tx.amount);
      
      // Create conversion
      try {
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: profile.id,
            transactionId: tx.id,
            amount: tx.amount,
            commissionAmount: commission,
            status: 'PAID',
            convertedAt: tx.createdAt
          }
        });
        conversionsCreated++;
        
        if (conversionsCreated % 500 === 0) {
          console.log(`  Created ${conversionsCreated} conversions...`);
        }
      } catch (err) {
        if (err.code !== 'P2002') throw err;
      }
    }
    
    console.log(`\n✅ CONVERSIONS RESULT:`);
    console.log(`- Created: ${conversionsCreated}`);
    console.log(`- Already exists: ${conversionsSkipped}`);
    console.log(`- No affiliate in metadata: ${noAffiliateInMeta}`);
    console.log(`- Affiliate profile not found: ${noAffiliateProfile}`);
    
    // Final verification
    const finalConversions = await prisma.affiliateConversion.count();
    const finalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    const finalProfiles = await prisma.affiliateProfile.count();
    
    console.log(`\n📊 FINAL STATE:`);
    console.log(`- Affiliate profiles: ${finalProfiles}`);
    console.log(`- Total conversions: ${finalConversions}`);
    console.log(`- Total commission: Rp ${Number(finalCommission._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
    
    // Compare with expected
    console.log(`\n📸 EXPECTED (Sejoli):`);
    console.log(`- Total commission: ~Rp 1,250,621,000`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAffiliatesAndConversions()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
