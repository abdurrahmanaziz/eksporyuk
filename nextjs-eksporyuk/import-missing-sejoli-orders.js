import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

console.log('\n🔄 INCREMENTAL IMPORT - Missing Sejoli Orders\n');

// Load TSV files
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
const orderLines = ordersRaw.split('\n').slice(1).filter(l => l.trim());

const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8');
const userLines = usersRaw.split('\n').slice(1).filter(l => l.trim());

const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8');
const commissionLines = commissionsRaw.split('\n').slice(1).filter(l => l.trim());

console.log(`📂 Loaded:`);
console.log(`  - ${orderLines.length} orders from TSV`);
console.log(`  - ${userLines.length} users from TSV`);
console.log(`  - ${commissionLines.length} commissions from TSV\n`);

// Get existing transactions
console.log('🔍 Checking existing transactions...');
const existingTx = await prisma.transaction.findMany({
  select: { metadata: true }
});

const existingSejoliIds = new Set(
  existingTx
    .map(tx => tx.metadata?.sejoliOrderId)
    .filter(id => id !== null && id !== undefined)
    .map(id => String(id))
);

console.log(`  Found ${existingSejoliIds.size} existing sejoliOrderIds\n`);

// Build user mappings
console.log('👥 Building user mappings...');
const sejoliUserToEmail = new Map();
for (const line of userLines) {
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const sejoliUserId = parts[0];
  const email = parts[2]?.trim().toLowerCase();
  if (email) sejoliUserToEmail.set(sejoliUserId, email);
}

const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
const emailToUserId = new Map();
for (const user of dbUsers) {
  if (user.email) emailToUserId.set(user.email.toLowerCase(), user.id);
}

console.log(`  Mapped ${emailToUserId.size} emails to user IDs\n`);

// Build commission mapping (sejoliOrderId -> commission data)
console.log('💰 Building commission mappings...');
const commissionMap = new Map(); // sejoliOrderId -> { affiliateId, commission, status }

for (const line of commissionLines) {
  const parts = line.split('\t');
  if (parts.length < 5) continue;
  
  const sejoliOrderId = parts[0];
  const sejoliAffiliateId = parts[1];
  const commission = parseFloat(parts[3]) || 0;
  const status = parts[4]?.trim();
  
  if (status === 'added') {
    commissionMap.set(sejoliOrderId, {
      sejoliAffiliateId,
      commission,
      status
    });
  }
}

console.log(`  Mapped ${commissionMap.size} orders with affiliate commission\n`);

// Get affiliate profiles
const affiliateProfiles = await prisma.affiliateProfile.findMany({
  select: { id: true, userId: true }
});
const userIdToProfileId = new Map();
for (const profile of affiliateProfiles) {
  userIdToProfileId.set(profile.userId, profile.id);
}

// Parse orders and filter only missing ones
const ordersToImport = [];
const conversionsToCreate = [];
let skippedExists = 0;
let skippedNoUser = 0;

console.log('🔍 Filtering missing orders...');

for (const line of orderLines) {
  const parts = line.split('\t');
  if (parts.length < 10) continue;
  
  const sejoliOrderId = parts[0];
  const sejoliProductId = parts[1];
  const sejoliUserId = parts[2];
  const sejoliAffiliateId = parts[3];
  const sejolyCouponId = parts[4];
  const quantity = parseInt(parts[5]) || 1;
  const amount = parseFloat(parts[6]) || 0;
  const status = parts[7]?.trim();
  const createdAt = parts[8]?.trim();
  const paymentGateway = parts[9]?.trim();
  
  // Skip if already exists
  if (existingSejoliIds.has(sejoliOrderId)) {
    skippedExists++;
    continue;
  }
  
  // Get user
  const userEmail = sejoliUserToEmail.get(sejoliUserId);
  let userId = userEmail ? emailToUserId.get(userEmail) : null;
  
  // If no user found, create placeholder user
  if (!userId) {
    const placeholderEmail = `sejoli_user_${sejoliUserId}@placeholder.com`;
    
    // Check if placeholder already exists
    let placeholderUser = await prisma.user.findUnique({
      where: { email: placeholderEmail }
    });
    
    if (!placeholderUser) {
      placeholderUser = await prisma.user.create({
        data: {
          name: `Sejoli User ${sejoliUserId}`,
          email: placeholderEmail,
          password: await bcrypt.hash('password123', 10),
          role: 'MEMBER_FREE',
          status: 'ACTIVE',
          metadata: {
            sejoliUserId: parseInt(sejoliUserId),
            placeholder: true,
            importedAt: new Date().toISOString()
          }
        }
      });
    }
    
    userId = placeholderUser.id;
    emailToUserId.set(placeholderEmail, userId);
  }
  
  // Map status
  let txStatus = 'PENDING';
  if (status === 'completed') txStatus = 'SUCCESS';
  else if (status === 'cancelled') txStatus = 'FAILED';
  
  // Create transaction object
  const transaction = {
    userId,
    amount,
    status: txStatus,
    paymentMethod: paymentGateway || 'manual',
    metadata: {
      sejoliOrderId: parseInt(sejoliOrderId),
      sejoliProductId: parseInt(sejoliProductId),
      sejoliUserId: parseInt(sejoliUserId),
      sejoliAffiliateId: sejoliAffiliateId !== '0' ? parseInt(sejoliAffiliateId) : null,
      sejolyCouponId: sejolyCouponId !== '0' ? parseInt(sejolyCouponId) : null,
      quantity,
      originalStatus: status
    },
    createdAt: new Date(createdAt)
  };
  
  ordersToImport.push(transaction);
  
  // If has affiliate commission, prepare conversion
  const commissionData = commissionMap.get(sejoliOrderId);
  if (commissionData && txStatus === 'SUCCESS') {
    const affiliateEmail = sejoliUserToEmail.get(commissionData.sejoliAffiliateId);
    if (affiliateEmail) {
      const affiliateUserId = emailToUserId.get(affiliateEmail);
      if (affiliateUserId) {
        const affiliateProfileId = userIdToProfileId.get(affiliateUserId);
        if (affiliateProfileId) {
          // Will be created after transaction insert
          conversionsToCreate.push({
            sejoliOrderId,
            affiliateProfileId,
            commission: commissionData.commission,
            commissionRate: amount > 0 ? commissionData.commission / amount : 0,
            createdAt: new Date(createdAt)
          });
        }
      }
    }
  }
}

console.log(`\n📊 Import Summary:`);
console.log(`  Total orders in TSV: ${orderLines.length}`);
console.log(`  Already exists: ${skippedExists}`);
console.log(`  No user match: ${skippedNoUser}`);
console.log(`  Ready to import: ${ordersToImport.length}`);
console.log(`  With affiliate commission: ${conversionsToCreate.length}\n`);

if (ordersToImport.length === 0) {
  console.log('✅ No new orders to import!');
  await prisma.$disconnect();
  process.exit(0);
}

// Import transactions in batches
console.log('💾 Importing transactions...');
const batchSize = 100;
let imported = 0;
const transactionIdMap = new Map(); // sejoliOrderId -> transaction.id

for (let i = 0; i < ordersToImport.length; i += batchSize) {
  const batch = ordersToImport.slice(i, i + batchSize);
  
  for (const tx of batch) {
    try {
      const created = await prisma.transaction.create({
        data: tx
      });
      
      const sejoliOrderId = tx.metadata.sejoliOrderId;
      transactionIdMap.set(String(sejoliOrderId), created.id);
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`  Progress: ${imported}/${ordersToImport.length} (${((imported/ordersToImport.length)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error(`  ❌ Error importing order ${tx.metadata.sejoliOrderId}:`, error.message);
    }
  }
}

console.log(`\n✅ Imported ${imported} transactions\n`);

// Create affiliate conversions
if (conversionsToCreate.length > 0) {
  console.log('💰 Creating affiliate conversions...');
  
  const conversionsWithTxId = conversionsToCreate
    .map(conv => {
      const transactionId = transactionIdMap.get(conv.sejoliOrderId);
      if (!transactionId) return null;
      
      return {
        transactionId,
        affiliateId: conv.affiliateProfileId,
        commissionAmount: conv.commission,
        commissionRate: conv.commissionRate,
        paidOut: false,
        createdAt: conv.createdAt
      };
    })
    .filter(c => c !== null);
  
  console.log(`  Prepared ${conversionsWithTxId.length} conversions\n`);
  
  let convCreated = 0;
  for (let i = 0; i < conversionsWithTxId.length; i += batchSize) {
    const batch = conversionsWithTxId.slice(i, i + batchSize);
    
    await prisma.affiliateConversion.createMany({
      data: batch,
      skipDuplicates: true
    });
    
    convCreated += batch.length;
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Created ${batch.length} conversions (total: ${convCreated})`);
  }
  
  console.log(`\n✅ Created ${convCreated} affiliate conversions\n`);
  
  // Update affiliate profile totals
  console.log('🔄 Updating affiliate profile totals...');
  
  const profileUpdates = new Map(); // profileId -> { totalEarnings, totalConversions }
  
  for (const conv of conversionsWithTxId) {
    const profileId = conv.affiliateId;
    if (!profileUpdates.has(profileId)) {
      profileUpdates.set(profileId, { totalEarnings: 0, totalConversions: 0 });
    }
    
    const profile = profileUpdates.get(profileId);
    profile.totalEarnings += conv.commissionAmount;
    profile.totalConversions += 1;
  }
  
  for (const [profileId, data] of profileUpdates) {
    // Get current totals
    const current = await prisma.affiliateProfile.findUnique({
      where: { id: profileId },
      select: { totalEarnings: true, totalConversions: true }
    });
    
    if (current) {
      await prisma.affiliateProfile.update({
        where: { id: profileId },
        data: {
          totalEarnings: Number(current.totalEarnings) + data.totalEarnings,
          totalConversions: current.totalConversions + data.totalConversions
        }
      });
    }
  }
  
  console.log(`  Updated ${profileUpdates.size} affiliate profiles\n`);
}

// Final verification
const finalCount = await prisma.transaction.count();
const finalDecember = await prisma.transaction.count({
  where: {
    createdAt: {
      gte: new Date('2025-12-01'),
      lt: new Date('2026-01-01')
    }
  }
});

const decemberSuccess = await prisma.transaction.count({
  where: {
    createdAt: {
      gte: new Date('2025-12-01'),
      lt: new Date('2026-01-01')
    },
    status: 'SUCCESS'
  }
});

console.log('📊 FINAL DATABASE STATE:');
console.log(`  Total transactions: ${finalCount.toLocaleString('id-ID')}`);
console.log(`  December 2025 total: ${finalDecember}`);
console.log(`  December SUCCESS: ${decemberSuccess}\n`);

console.log('✅ Incremental import complete!');

await prisma.$disconnect();
