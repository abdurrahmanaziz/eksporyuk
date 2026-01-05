const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCommissionCheck() {
  console.log('💰 QUICK COMMISSION CHECK\n');
  
  try {
    // Cek transaksi terbaru dengan affiliate
    const recentTx = await prisma.transaction.findMany({
      where: { 
        status: 'SUCCESS',
        affiliateId: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    console.log('3 TRANSAKSI TERBARU:');
    for (const tx of recentTx) {
      const affiliate = await prisma.user.findUnique({
        where: { id: tx.affiliateId },
        select: { name: true }
      });
      
      // Cek wallet transaction
      const walletTx = await prisma.walletTransaction.findFirst({
        where: { reference: tx.id, type: 'COMMISSION' }
      });
      
      console.log(`\n${tx.id}:`);
      console.log(`  Affiliate: ${affiliate?.name}`);
      console.log(`  Amount: Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`);
      console.log(`  Affiliate Share: Rp ${tx.affiliateShare ? parseFloat(tx.affiliateShare).toLocaleString('id-ID') : '0'}`);
      
      if (walletTx) {
        console.log(`  ✅ Commission in Wallet: Rp ${parseFloat(walletTx.amount).toLocaleString('id-ID')}`);
      } else {
        console.log(`  ❌ NO COMMISSION IN WALLET!`);
      }
    }
    
    // Cek saldo Abdurrahman
    const abdurrahman = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' }
    });
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: abdurrahman.id }
    });
    
    console.log(`\nABDURRAHMAN AZIZ WALLET:`);
    console.log(`Balance: Rp ${parseFloat(wallet.balance).toLocaleString('id-ID')}`);
    
    const commissionCount = await prisma.walletTransaction.count({
      where: { 
        walletId: wallet.id,
        type: 'COMMISSION'
      }
    });
    
    console.log(`Commission Transactions: ${commissionCount}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

quickCommissionCheck();