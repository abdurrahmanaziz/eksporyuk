const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCommissions() {
  try {
    console.log('📊 Checking commission and wallet data...');
    
    // Check affiliate conversions
    const affiliateConversions = await prisma.affiliateConversion.count();
    console.log(`Total affiliate conversions: ${affiliateConversions}`);
    
    // Check wallets with balances
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
            username: true,
            role: true
          }
        }
      }
    });
    
    console.log(`Wallets with balances: ${wallets.length}`);
    wallets.forEach(wallet => {
      console.log(`- ${wallet.user.username} (${wallet.user.role}): Balance=${wallet.balance}, Pending=${wallet.balancePending}`);
    });

    // Check transaction distribution by type
    const typeDistribution = await prisma.transaction.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('\n📈 Transaction distribution by type:');
    typeDistribution.forEach(group => {
      const totalAmount = parseInt(group._sum.amount || 0);
      console.log(`- ${group.type}: ${group._count.id} transactions, Rp ${totalAmount.toLocaleString()}`);
    });

    // Check a few recent transactions for commission data
    const sampleTransactions = await prisma.transaction.findMany({
      take: 5,
      select: {
        invoiceNumber: true,
        type: true,
        amount: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📋 Sample transaction types:');
    sampleTransactions.forEach(t => {
      console.log(`- ${t.invoiceNumber}: ${t.type} (Rp ${parseInt(t.amount).toLocaleString()})`);
      if (t.metadata?.membershipTier) {
        console.log(`  └─ Membership Tier: ${t.metadata.membershipTier}`);
      }
      if (t.metadata?.eventCategory) {
        console.log(`  └─ Event Category: ${t.metadata.eventCategory}`);
      }
    });

    // Calculate total omset
    const totalOmset = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });
    
    console.log(`\n💰 Total Omset: Rp ${parseInt(totalOmset._sum.amount || 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommissions();