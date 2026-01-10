const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLiveData() {
  console.log('🔍 MEMERIKSA DATA LIVE DI DATABASE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Check all products
  console.log('\n📦 PRODUK DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Total products: ${products.length}\n`);
  
  if (products.length > 0) {
    products.forEach(product => {
      console.log(`📦 ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Sejoli Product ID: ${product.sejoliProductId || 'N/A'}`);
      console.log(`   Price: Rp ${product.price.toLocaleString('id-ID')}`);
      console.log(`   Commission Type: ${product.affiliateCommissionType || 'N/A'}`);
      console.log(`   Commission Rate: ${product.affiliateCommissionRate || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('❌ No products in database');
  }
  
  // Check all memberships with sejoli product IDs
  console.log('\n💳 MEMBERSHIP DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const memberships = await prisma.membership.findMany({
    orderBy: { price: 'desc' }
  });
  
  console.log(`Total memberships: ${memberships.length}\n`);
  
  memberships.forEach(membership => {
    console.log(`💳 ${membership.name}`);
    console.log(`   ID: ${membership.id}`);
    console.log(`   Sejoli Product ID: ${membership.sejoliProductId || 'N/A'}`);
    console.log(`   Price: Rp ${membership.price.toLocaleString('id-ID')}`);
    console.log(`   Commission Type: ${membership.affiliateCommissionType || 'N/A'}`);
    console.log(`   Commission Rate: ${membership.affiliateCommissionRate || 'N/A'}`);
    console.log('');
  });
  
  // Check transactions summary
  console.log('\n💰 TRANSAKSI DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
  
  console.log(`Total transactions: ${transactions.length}\n`);
  
  // Group by status
  const byStatus = {};
  transactions.forEach(tx => {
    if (!byStatus[tx.status]) byStatus[tx.status] = { count: 0, amount: 0 };
    byStatus[tx.status].count++;
    byStatus[tx.status].amount += Number(tx.amount);
  });
  
  console.log('📊 By Status:');
  Object.entries(byStatus).forEach(([status, data]) => {
    console.log(`   ${status}: ${data.count} transactions, Rp ${data.amount.toLocaleString('id-ID')}`);
  });
  
  // Check transactions with affiliate
  const withAffiliate = transactions.filter(tx => tx.affiliateId);
  console.log(`\n👥 Transactions with Affiliate: ${withAffiliate.length}`);
  
  const affiliateRevenue = withAffiliate.reduce((sum, tx) => sum + Number(tx.amount), 0);
  console.log(`   Total Revenue: Rp ${affiliateRevenue.toLocaleString('id-ID')}`);
  
  // Check wallets
  console.log('\n\n💼 WALLET DATA:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const wallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { balance: { gt: 0 } },
        { balancePending: { gt: 0 } }
      ]
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      balance: 'desc'
    }
  });
  
  console.log(`Wallets with balance: ${wallets.length}\n`);
  
  wallets.forEach(wallet => {
    console.log(`👤 ${wallet.user.email} (${wallet.user.role})`);
    console.log(`   Balance: Rp ${wallet.balance.toLocaleString('id-ID')}`);
    console.log(`   Pending: Rp ${wallet.balancePending.toLocaleString('id-ID')}`);
    console.log('');
  });
  
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const totalPending = wallets.reduce((sum, w) => sum + Number(w.balancePending), 0);
  
  console.log(`💵 Total Balance: Rp ${totalBalance.toLocaleString('id-ID')}`);
  console.log(`💵 Total Pending: Rp ${totalPending.toLocaleString('id-ID')}`);
  
  // Check affiliate commissions
  console.log('\n\n🎯 AFFILIATE COMMISSIONS:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const affiliateUsers = await prisma.user.findMany({
    where: {
      role: 'AFFILIATE'
    },
    include: {
      wallet: true,
      _count: {
        select: {
          referredTransactions: true
        }
      }
    },
    orderBy: {
      wallet: {
        balance: 'desc'
      }
    }
  });
  
  console.log(`Total affiliates: ${affiliateUsers.length}\n`);
  
  affiliateUsers.slice(0, 20).forEach(aff => {
    console.log(`👤 ${aff.email}`);
    console.log(`   Name: ${aff.name || 'N/A'}`);
    console.log(`   Referred Transactions: ${aff._count.referredTransactions}`);
    if (aff.wallet) {
      console.log(`   Balance: Rp ${aff.wallet.balance.toLocaleString('id-ID')}`);
      console.log(`   Pending: Rp ${aff.wallet.balancePending.toLocaleString('id-ID')}`);
    } else {
      console.log(`   Wallet: Not created`);
    }
    console.log('');
  });
  
  // Check sejoli import status
  console.log('\n\n📊 SEJOLI IMPORT STATUS:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const sejoliTransactions = transactions.filter(tx => tx.sejoliOrderId);
  console.log(`Transactions with sejoliOrderId: ${sejoliTransactions.length}`);
  
  const sejoliUsers = await prisma.user.count({
    where: {
      sejoliUserId: { not: null }
    }
  });
  console.log(`Users with sejoliUserId: ${sejoliUsers}`);
  
  await prisma.$disconnect();
}

checkLiveData().catch(console.error);
