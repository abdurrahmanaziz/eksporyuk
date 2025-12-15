import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

console.log('\n🔥 DELETING FAKE CONVERSIONS WITH 30% RATE...\n');

// Delete all existing conversions (wrong data)
await prisma.affiliateConversion.deleteMany({});
console.log('✅ Deleted all fake conversions\n');

// Load TSV files
console.log('📂 Loading Sejoli data files...\n');

const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8');
const commissionLines = commissionsRaw.split('\n').slice(1).filter(l => l.trim());

const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8');
const userLines = usersRaw.split('\n').slice(1).filter(l => l.trim());

// Build mappings
const sejoliOrderToTxId = new Map(); // sejoli_order_id → transaction_id
const sejoliUserToEmail = new Map(); // sejoli_user_id → email
const emailToUserId = new Map(); // email → User.id
const userIdToProfileId = new Map(); // User.id → AffiliateProfile.id

// Get transaction mappings from DB (metadata.sejoliOrderId)
const allTransactions = await prisma.transaction.findMany({
  select: { id: true, metadata: true }
});

for (const tx of allTransactions) {
  const sejoliOrderId = tx.metadata?.sejoliOrderId;
  if (sejoliOrderId) {
    sejoliOrderToTxId.set(String(sejoliOrderId), tx.id);
  }
}

// Parse Sejoli users
for (const line of userLines) {
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const sejoliUserId = parts[0];
  const email = parts[2]?.trim().toLowerCase();
  if (email) sejoliUserToEmail.set(sejoliUserId, email);
}

// Get all users from DB
const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
for (const user of dbUsers) {
  if (user.email) {
    emailToUserId.set(user.email.toLowerCase(), user.id);
  }
}

// Get all affiliate profiles
const profiles = await prisma.affiliateProfile.findMany({
  select: { id: true, userId: true }
});
for (const profile of profiles) {
  userIdToProfileId.set(profile.userId, profile.id);
}

console.log(`📊 Loaded:`);
console.log(`  - ${sejoliOrderToTxId.size} Sejoli order → transaction mappings`);
console.log(`  - ${sejoliUserToEmail.size} Sejoli users`);
console.log(`  - ${emailToUserId.size} DB users`);
console.log(`  - ${userIdToProfileId.size} affiliate profiles\n`);

// Parse commissions with REAL amounts
const conversionsToCreate = [];
let skippedNoTx = 0;
let skippedNoProfile = 0;

// Load all transactions once for amount lookup AND createdAt
const txData = new Map(); // transactionId → { amount, createdAt }
const allTx = await prisma.transaction.findMany({
  select: { id: true, amount: true, createdAt: true }
});
for (const tx of allTx) {
  txData.set(tx.id, { amount: tx.amount, createdAt: tx.createdAt });
}

for (const line of commissionLines) {
  const parts = line.split('\t');
  if (parts.length < 5) continue;
  
  const sejoliOrderId = parts[0]; // Column 0 = order_id
  const sejoliAffiliateId = parts[1]; // Column 1 = affiliate_id
  const commissionAmount = parseFloat(parts[3]) || 0; // Column 3 = commission (REAL!)
  const status = parts[4]?.trim(); // Column 4 = status
  
  // Only SUCCESS commissions (status = "added")
  if (status !== 'added') continue;
  
  // Get transaction ID
  const transactionId = sejoliOrderToTxId.get(sejoliOrderId);
  if (!transactionId) {
    skippedNoTx++;
    continue;
  }
  
  // Get affiliate User ID
  const affiliateEmail = sejoliUserToEmail.get(sejoliAffiliateId);
  if (!affiliateEmail) continue;
  
  const affiliateUserId = emailToUserId.get(affiliateEmail);
  if (!affiliateUserId) continue;
  
  // Get AffiliateProfile ID
  const affiliateProfileId = userIdToProfileId.get(affiliateUserId);
  if (!affiliateProfileId) {
    skippedNoProfile++;
    continue;
  }
  
  // Calculate commission rate (for record keeping)
  const txInfo = txData.get(transactionId);
  if (!txInfo) continue;
  
  const txAmount = txInfo.amount;
  const rate = txAmount && txAmount > 0 ? commissionAmount / Number(txAmount) : 0;
  
  conversionsToCreate.push({
    transactionId,
    affiliateId: affiliateProfileId,
    commissionAmount, // REAL AMOUNT FROM SEJOLI!
    commissionRate: rate,
    paidOut: false,
    createdAt: txInfo.createdAt // USE TRANSACTION DATE!
  });
}

console.log(`\n✅ Prepared ${conversionsToCreate.length} conversions with REAL commission amounts`);
console.log(`⏭  Skipped: ${skippedNoTx} (no transaction), ${skippedNoProfile} (no profile)\n`);

// Create in batches
const batchSize = 500;
let created = 0;

for (let i = 0; i < conversionsToCreate.length; i += batchSize) {
  const batch = conversionsToCreate.slice(i, i + batchSize);
  
  await prisma.affiliateConversion.createMany({
    data: batch,
    skipDuplicates: true
  });
  
  created += batch.length;
  console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Created ${batch.length} (total: ${created})`);
}

console.log(`\n✅ Created ${created} AffiliateConversion records with REAL commission amounts\n`);

// Verify totals
const totalFromConversions = await prisma.affiliateConversion.aggregate({
  _sum: { commissionAmount: true }
});

const totalFromWallets = await prisma.wallet.aggregate({
  _sum: { balance: true },
  where: { balance: { gt: 0 } }
});

console.log(`📊 VERIFICATION:`);
console.log(`  AffiliateConversion total: Rp ${Number(totalFromConversions._sum.commissionAmount).toLocaleString('id-ID')}`);
console.log(`  Wallet.balance total: Rp ${Number(totalFromWallets._sum.balance).toLocaleString('id-ID')}`);

const diff = Math.abs(Number(totalFromConversions._sum.commissionAmount) - Number(totalFromWallets._sum.balance));
console.log(`  Difference: Rp ${diff.toLocaleString('id-ID')}`);
console.log(`  ${diff < 1000 ? '✅ MATCH!' : '⚠️  Slight difference (OK - rounding)'}\n`);

await prisma.$disconnect();
