import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importCommissions() {
  console.log('🚀 Importing Affiliate Commissions from Sejoli\n');
  
  // Load sejoli users
  console.log('📂 Loading sejoli_users.tsv...');
  const usersTsv = fs.readFileSync('sejoli_users.tsv', 'utf-8');
  const userLines = usersTsv.split('\n');
  
  const sejoliUsers = new Map(); // sejoliId -> email
  for (let i = 1; i < userLines.length; i++) {
    const cols = userLines[i].split('\t');
    if (cols.length < 3) continue;
    const id = parseInt(cols[0]);
    const email = cols[2].trim();
    if (!isNaN(id) && email) {
      sejoliUsers.set(id, email);
    }
  }
  console.log(`✅ ${sejoliUsers.size} Sejoli users\n`);
  
  // Load commissions
  console.log('📂 Loading sejoli_affiliate_commissions.tsv...');
  const commTsv = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8');
  const commLines = commTsv.split('\n');
  
  const commissions = [];
  for (let i = 1; i < commLines.length; i++) {
    const cols = commLines[i].split('\t');
    if (cols.length < 5) continue;
    
    const orderId = parseInt(cols[0]);
    const affiliateId = parseInt(cols[1]);
    const productId = parseInt(cols[2]);
    const commission = parseFloat(cols[3]);
    const status = cols[4].trim();
    
    if (!isNaN(orderId) && !isNaN(affiliateId) && !isNaN(commission)) {
      commissions.push({ orderId, affiliateId, productId, commission, status });
    }
  }
  console.log(`✅ ${commissions.length} commission records\n`);
  
  // Load transactions
  console.log('📊 Loading transactions...');
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { id: true, userId: true, metadata: true, amount: true }
  });
  
  const txMap = new Map();
  for (const tx of transactions) {
    const sejoliOrderId = tx.metadata?.sejoliOrderId;
    if (sejoliOrderId) {
      txMap.set(sejoliOrderId, tx);
    }
  }
  console.log(`✅ ${transactions.length} transactions\n`);
  
  // Load all users
  console.log('👥 Loading users...');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  const emailToUser = new Map();
  for (const user of users) {
    if (user.email) {
      emailToUser.set(user.email.toLowerCase(), user);
    }
  }
  console.log(`✅ ${users.length} users\n`);
  
  // Process commissions
  console.log('⚙️  Processing...\n');
  
  let stats = {
    created: 0,
    skippedNoTx: 0,
    skippedNoAffiliate: 0,
    skippedCancelled: 0,
    totalAmount: 0
  };
  
  const toCreate = [];
  const walletUpdates = new Map();
  const affiliateProfiles = new Set();
  
  for (const comm of commissions) {
    // Skip cancelled
    if (comm.status === 'cancelled') {
      stats.skippedCancelled++;
      continue;
    }
    
    // Find transaction
    const tx = txMap.get(comm.orderId);
    if (!tx) {
      stats.skippedNoTx++;
      continue;
    }
    
    // Find affiliate email from Sejoli
    const affiliateEmail = sejoliUsers.get(comm.affiliateId);
    if (!affiliateEmail) {
      stats.skippedNoAffiliate++;
      continue;
    }
    
    // Find user in our database
    const affiliateUser = emailToUser.get(affiliateEmail.toLowerCase());
    if (!affiliateUser) {
      stats.skippedNoAffiliate++;
      continue;
    }
    
    // Calculate commission rate
    const rate = (comm.commission / tx.amount) * 100;
    
    // Prepare AffiliateConversion
    toCreate.push({
      affiliateId: affiliateUser.id,
      transactionId: tx.id,
      commissionAmount: comm.commission,
      commissionRate: rate,
      paidOut: false
    });
    
    // Track affiliates for profile creation
    affiliateProfiles.add(affiliateUser.id);
    
    // Prepare wallet update
    if (!walletUpdates.has(affiliateUser.id)) {
      walletUpdates.set(affiliateUser.id, 0);
    }
    walletUpdates.set(affiliateUser.id, walletUpdates.get(affiliateUser.id) + comm.commission);
    
    stats.totalAmount += comm.commission;
    stats.created++;
    
    if (stats.created % 1000 === 0) {
      console.log(`  Processed: ${stats.created}...`);
    }
  }
  
  console.log(`\n�� Summary:`);
  console.log(`├─ To create: ${toCreate.length}`);
  console.log(`├─ Total: Rp ${stats.totalAmount.toLocaleString('id-ID')}`);
  console.log(`├─ Affiliates: ${walletUpdates.size}`);
  console.log(`├─ Skipped (no tx): ${stats.skippedNoTx}`);
  console.log(`├─ Skipped (no affiliate): ${stats.skippedNoAffiliate}`);
  console.log(`└─ Skipped (cancelled): ${stats.skippedCancelled}\n`);
  
  // Create AffiliateProfile for users who don't have one
  console.log('👤 Creating AffiliateProfiles...');
  for (const userId of affiliateProfiles) {
    try {
      await prisma.affiliateProfile.upsert({
        where: { userId },
        create: { userId },
        update: {}
      });
    } catch (e) {
      // Already exists
    }
  }
  console.log(`✅ ${affiliateProfiles.size} profiles\n`);
  
  // Create AffiliateConversion
  if (toCreate.length > 0) {
    console.log('➕ Creating conversions...');
    const batchSize = 1000;
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          await prisma.affiliateConversion.create({ data: item });
        } catch (e) {
          // Skip duplicates
        }
      }
      
      console.log(`  Created: ${Math.min(i + batchSize, toCreate.length)}/${toCreate.length}`);
    }
  }
  
  // Update wallets
  if (walletUpdates.size > 0) {
    console.log('\n💰 Updating wallets...');
    let updated = 0;
    for (const [userId, amount] of walletUpdates.entries()) {
      await prisma.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balance: amount,
          balancePending: 0
        },
        update: {
          balance: { increment: amount }
        }
      });
      updated++;
      if (updated % 100 === 0) {
        console.log(`  Updated: ${updated}/${walletUpdates.size}`);
      }
    }
  }
  
  console.log('\n✅ DONE!');
  console.log(`├─ AffiliateConversion: ${toCreate.length}`);
  console.log(`├─ Wallets: ${walletUpdates.size}`);
  console.log(`└─ Total: Rp ${stats.totalAmount.toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
}

importCommissions().catch(console.error);
