const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCommissions() {
  console.log('🔍 ANALISIS KOMISI BERDASARKAN HARGA TRANSAKSI');
  console.log('================================================\n');
  
  // Get unique transaction amounts with their commission counts
  const conversions = await prisma.affiliateConversion.findMany({
    include: { transaction: true },
    where: { transaction: { status: 'SUCCESS' } }
  });
  
  // Group by transaction amount
  const byAmount = {};
  conversions.forEach(conv => {
    const amt = conv.transaction.amount;
    if (!byAmount[amt]) {
      byAmount[amt] = { count: 0, commissions: {} };
    }
    byAmount[amt].count++;
    if (!byAmount[amt].commissions[conv.commissionAmount]) {
      byAmount[amt].commissions[conv.commissionAmount] = 0;
    }
    byAmount[amt].commissions[conv.commissionAmount]++;
  });
  
  // Sort by amount
  const sorted = Object.entries(byAmount).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  
  // Show results grouped by price range
  console.log('HARGA TRANSAKSI → KOMISI YANG DIBERIKAN:\n');
  
  let total = 0;
  sorted.forEach(([amt, data]) => {
    const commList = Object.entries(data.commissions)
      .map(([comm, count]) => `Rp ${parseFloat(comm).toLocaleString('id-ID')} (${count}x)`)
      .join(', ');
    console.log(`Rp ${parseFloat(amt).toLocaleString('id-ID').padEnd(15)} (${data.count.toString().padStart(4)} tx) → ${commList}`);
    total += data.count;
  });
  
  console.log(`\n📊 Total: ${total} conversions`);
  
  // Total commission
  const totalComm = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  console.log(`💰 Total Commission: Rp ${totalComm._sum.commissionAmount?.toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
}

analyzeCommissions().catch(console.error);
