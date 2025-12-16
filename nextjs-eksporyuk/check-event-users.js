const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== USER EVENT/WEBINAR/ZOOMINAR ===\n');
  
  // Check products dengan tipe EVENT
  const eventProducts = await prisma.product.findMany({
    where: {
      OR: [
        { productType: 'EVENT' },
        { name: { contains: 'webinar', mode: 'insensitive' } },
        { name: { contains: 'zoominar', mode: 'insensitive' } },
        { name: { contains: 'workshop', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      productType: true,
      price: true
    }
  });
  
  console.log('📦 PRODUK EVENT/WEBINAR:');
  console.log('   Total produk: ' + eventProducts.length);
  eventProducts.forEach(p => {
    console.log('   - ' + p.name + ' (' + p.productType + ') - Rp ' + Number(p.price).toLocaleString('id-ID'));
  });
  
  // Check transactions untuk event products
  if (eventProducts.length > 0) {
    const eventTransactions = await prisma.transaction.count({
      where: {
        productId: { in: eventProducts.map(p => p.id) },
        status: 'SUCCESS'
      }
    });
    
    console.log('\n📊 TRANSAKSI EVENT:');
    console.log('   Total transaksi sukses: ' + eventTransactions);
  }
  
  // Check total users by role
  console.log('\n\n👥 TOTAL USER BY ROLE:');
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true }
  });
  
  roles.forEach(r => {
    console.log('   ' + r.role + ': ' + r._count.role);
  });
  
  // Check users yang punya transaksi tapi tidak punya membership (kemungkinan event only)
  const usersWithTransactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const usersWithMemberships = await prisma.userMembership.findMany({
    select: { userId: true },
    distinct: ['userId']
  });
  
  const membershipUserIds = new Set(usersWithMemberships.map(u => u.userId));
  const transactionUserIds = new Set(usersWithTransactions.map(u => u.userId));
  
  let usersWithoutMembership = 0;
  for (const id of transactionUserIds) {
    if (!membershipUserIds.has(id)) {
      usersWithoutMembership++;
    }
  }
  
  console.log('\n\n📊 ANALISIS USER:');
  console.log('   Users dengan transaksi sukses: ' + transactionUserIds.size);
  console.log('   Users dengan membership: ' + membershipUserIds.size);
  console.log('   Users TANPA membership (kemungkinan event only): ' + usersWithoutMembership);
  
  // Check dari legacy - apakah ada data webinar di tabel lain?
  // Cek description di transaksi
  const allTransactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: {
      description: true,
      amount: true,
      userId: true
    }
  });
  
  // Group by amount untuk melihat distribusi
  const amountGroups = {};
  allTransactions.forEach(t => {
    const amount = Number(t.amount);
    if (!amountGroups[amount]) {
      amountGroups[amount] = { count: 0, users: new Set() };
    }
    amountGroups[amount].count++;
    amountGroups[amount].users.add(t.userId);
  });
  
  console.log('\n\n💰 TRANSAKSI PER NOMINAL (top 10):');
  const sortedAmounts = Object.entries(amountGroups)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  sortedAmounts.forEach(([amount, data]) => {
    const amountNum = Number(amount);
    let label = '';
    if (amountNum === 35000) label = ' ← WEBINAR?';
    if (amountNum === 699000) label = ' ← 6 BULAN';
    if (amountNum === 899000) label = ' ← 12 BULAN';
    if (amountNum === 999000) label = ' ← LIFETIME';
    console.log('   Rp ' + amountNum.toLocaleString('id-ID') + ': ' + data.count + ' transaksi (' + data.users.size + ' users)' + label);
  });
  
  // Hitung total user webinar (35k)
  const webinarAmount = amountGroups[35000];
  if (webinarAmount) {
    console.log('\n\n🎯 KESIMPULAN USER EVENT/WEBINAR:');
    console.log('   User yang beli webinar (Rp 35.000): ' + webinarAmount.users.size + ' users');
    console.log('   Total pembelian webinar: ' + webinarAmount.count + ' transaksi');
  }
  
  // Cek nominal lain yang mungkin event
  const possibleEventAmounts = [35000, 49000, 50000, 75000, 99000, 100000, 150000];
  let totalEventUsers = new Set();
  let totalEventTransactions = 0;
  
  console.log('\n\n🎪 POSSIBLE EVENT TRANSACTIONS:');
  possibleEventAmounts.forEach(amount => {
    if (amountGroups[amount]) {
      console.log('   Rp ' + amount.toLocaleString('id-ID') + ': ' + amountGroups[amount].count + ' transaksi (' + amountGroups[amount].users.size + ' users)');
      totalEventTransactions += amountGroups[amount].count;
      amountGroups[amount].users.forEach(u => totalEventUsers.add(u));
    }
  });
  
  console.log('\n   Total possible event users: ' + totalEventUsers.size);
  console.log('   Total possible event transactions: ' + totalEventTransactions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
