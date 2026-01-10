import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importCommissions() {
  console.log('🚀 Importing Affiliate Commissions from Sejoli\n');
  
  // Load TSV file
  console.log('📂 Loading sejoli_affiliate_commissions.tsv...');
  const tsvData = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8');
  const lines = tsvData.split('\n');
  
  const commissions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
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
  
  console.log(`✅ Loaded ${commissions.length} commission records\n`);
  
  // Get all transactions with sejoliOrderId
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
  
  console.log(`✅ ${transactions.length} SUCCESS transactions, ${txMap.size} with sejoliOrderId\n`);
  
  // Get all users with sejoliId
  console.log('👥 Loading users...');
  const users = await prisma.user.findMany({
    select: { id: true, sejoliId: true, email: true, name: true }
  });
  
  const userMap = new Map();
  for (const user of users) {
    if (user.sejoliId) {
      userMap.set(user.sejoliId, user);
    }
  }
  
  console.log(`✅ ${users.length} users, ${userMap.size} with sejoliId\n`);
  
  // Process commissions
  console.log('⚙️  Processing commissions...\n');
  
  let stats = {
    created: 0,
    skippedNoTx: 0,
    skippedNoAffiliate: 0,
    skippedCancelled: 0,
    totalAmount: 0
  };
  
  const toCreate = [];
  const walletUpdates = new Map();
  
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
    
    // Find affiliate user
    const affiliate = userMap.get(comm.affiliateId);
    if (!affiliate) {
      stats.skippedNoAffiliate++;
      continue;
    }
    
    // Calculate commission rate
    const rate = (comm.commission / tx.amount) * 100;
    
    // Prepare AffiliateConversion
    toCreate.push({
      affiliateId: affiliate.id,
      transactionId: tx.id,
      commissionAmount: comm.commission,
      commissionRate: rate,
      paidOut: false
    });
    
    // Prepare wallet update (commission goes to balance, not balancePending)
    if (!walletUpdates.has(affiliate.id)) {
      walletUpdates.set(affiliate.id, 0);
    }
    walletUpdates.set(affiliate.id, walletUpdates.get(affiliate.id) + comm.commission);
    
    stats.totalAmount += comm.commission;
    stats.created++;
    
    if (stats.created % 1000 === 0) {
      console.log(`  Processed: ${stats.created}...`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`├─ To create: ${toCreate.length}`);
  console.log(`├─ Total amount: Rp ${stats.totalAmount.toLocaleString('id-ID')}`);
  console.log(`├─ Affiliates: ${walletUpdates.size}`);
  console.log(`├─ Skipped (no transaction): ${stats.skippedNoTx}`);
  console.log(`├─ Skipped (no affiliate): ${stats.skippedNoAffiliate}`);
  console.log(`└─ Skipped (cancelled): ${stats.skippedCancelled}\n`);
  
  // Create AffiliateConversion records in batches
  if (toCreate.length > 0) {
    console.log('➕ Creating AffiliateConversion records...');
    const batchSize = 1000;
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      
      // Use transaction to handle duplicates
      for (const item of batch) {
        try {
          await prisma.affiliateConversion.create({ data: item });
        } catch (e) {
          // Skip if already exists
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
  console.log(`├─ AffiliateConversion: ${toCreate.length} records`);
  console.log(`├─ Wallets updated: ${walletUpdates.size}`);
  console.log(`└─ Total commission: Rp ${stats.totalAmount.toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
}

importCommissions().catch(console.error);
