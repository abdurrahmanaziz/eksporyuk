const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function updateTransactionsWithAffiliateData() {
  console.log('🔄 UPDATING TRANSACTIONS WITH AFFILIATE DATA');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load Sejoli data
  const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Create Sejoli user email lookup map
  const sejoliUserMap = new Map();
  for (const user of sejoli.users) {
    sejoliUserMap.set(user.id, user.user_email);
  }
  
  // Create Sejoli affiliate lookup map  
  const sejoliAffiliateMap = new Map();
  for (const aff of sejoli.affiliates) {
    sejoliAffiliateMap.set(aff.user_id, aff.user_email);
  }
  
  console.log(`📧 Mapped ${sejoliUserMap.size} Sejoli users`);
  console.log(`👥 Mapped ${sejoliAffiliateMap.size} Sejoli affiliates`);
  
  // Get all users from database
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
  
  // Get all imported transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      externalId: { startsWith: 'sejoli-' }
    },
    select: {
      id: true,
      externalId: true,
      userId: true,
      affiliateId: true,
      metadata: true
    }
  });
  
  console.log(`\n📊 Found ${transactions.length} Sejoli transactions in database`);
  
  let updated = 0;
  let withAffiliate = 0;
  let noAffiliateInSejoli = 0;
  let affiliateNotFoundInDB = 0;
  
  console.log('\n🔄 Processing updates...');
  
  // Process in batches
  for (let i = 0; i < transactions.length; i += 100) {
    const batch = transactions.slice(i, i + 100);
    const updates = [];
    
    for (const tx of batch) {
      // Extract Sejoli order ID
      const sejoliOrderId = parseInt(tx.externalId.replace('sejoli-', ''));
      
      // Find order in Sejoli data
      const sejoliOrder = sejoli.orders.find(o => o.id === sejoliOrderId);
      if (!sejoliOrder) {
        continue;
      }
      
      // Prepare update data
      const updateData = {
        metadata: {
          ...(typeof tx.metadata === 'object' ? tx.metadata : {}),
          sejoliOrderId: sejoliOrder.id,
          sejoliProductId: sejoliOrder.product_id,
          sejoliAffiliateId: sejoliOrder.affiliate_id,
          sejoliType: sejoliOrder.type,
          sejoliQuantity: sejoliOrder.quantity
        }
      };
      
      // Add affiliateId if exists
      if (sejoliOrder.affiliate_id && sejoliOrder.affiliate_id > 0) {
        const affiliateEmail = sejoliAffiliateMap.get(sejoliOrder.affiliate_id);
        
        if (affiliateEmail) {
          const affiliateDbId = userEmailMap.get(affiliateEmail);
          
          if (affiliateDbId) {
            updateData.affiliateId = affiliateDbId;
            withAffiliate++;
          } else {
            affiliateNotFoundInDB++;
          }
        } else {
          // Affiliate ID exists but not in affiliates array - might be user_id
          const userEmail = sejoliUserMap.get(sejoliOrder.affiliate_id);
          if (userEmail) {
            const affiliateDbId = userEmailMap.get(userEmail);
            if (affiliateDbId) {
              updateData.affiliateId = affiliateDbId;
              withAffiliate++;
            } else {
              affiliateNotFoundInDB++;
            }
          } else {
            affiliateNotFoundInDB++;
          }
        }
      } else {
        noAffiliateInSejoli++;
      }
      
      updates.push(
        prisma.transaction.update({
          where: { id: tx.id },
          data: updateData
        })
      );
    }
    
    // Execute batch updates
    if (updates.length > 0) {
      await Promise.all(updates);
      updated += updates.length;
    }
    
    // Progress update
    if ((i + 100) % 1000 === 0) {
      console.log(`✅ Processed ${i + 100}/${transactions.length} transactions`);
    }
  }
  
  console.log('\n🎉 UPDATE COMPLETED!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Updated: ${updated} transactions`);
  console.log(`👥 With Affiliate: ${withAffiliate}`);
  console.log(`❌ No Affiliate in Sejoli: ${noAffiliateInSejoli}`);
  console.log(`⚠️  Affiliate not found in DB: ${affiliateNotFoundInDB}`);
  
  // Verify
  const verifyWithAffiliate = await prisma.transaction.count({
    where: {
      affiliateId: { not: null }
    }
  });
  
  console.log(`\n📊 VERIFICATION:`);
  console.log(`Transactions with affiliateId: ${verifyWithAffiliate}`);
  
  // Show sample
  const sampleWithAffiliate = await prisma.transaction.findMany({
    where: {
      affiliateId: { not: null }
    },
    include: {
      user: {
        select: { email: true }
      }
    },
    take: 5
  });
  
  console.log(`\n📋 SAMPLE TRANSACTIONS WITH AFFILIATE:`);
  sampleWithAffiliate.forEach(tx => {
    console.log(`  Transaction ${tx.id}:`);
    console.log(`    User: ${tx.user.email}`);
    console.log(`    Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
    console.log(`    Affiliate ID: ${tx.affiliateId}`);
    console.log(`    Metadata:`, tx.metadata);
    console.log('');
  });
  
  await prisma.$disconnect();
}

updateTransactionsWithAffiliateData().catch(console.error);
