const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all transactions and sum affiliateShare
  const result = await prisma.transaction.aggregate({
    _sum: {
      affiliateShare: true
    },
    _count: true
  });
  
  console.log('=== Total dari field affiliateShare ===');
  console.log('Total Transaksi:', result._count);
  console.log('Total affiliateShare:', Number(result._sum.affiliateShare || 0).toLocaleString('id-ID'));
  
  // Also check transactions with non-zero affiliateShare
  const withAffShare = await prisma.transaction.count({
    where: {
      affiliateShare: {
        gt: 0
      }
    }
  });
  console.log('Transaksi dengan affiliateShare > 0:', withAffShare);
  
  // Check metadata commissionAmount total
  const allTx = await prisma.transaction.findMany({
    select: {
      affiliateShare: true,
      metadata: true
    }
  });
  
  let metaCommissionTotal = 0;
  let affShareTotal = 0;
  allTx.forEach(tx => {
    const meta = tx.metadata || {};
    metaCommissionTotal += Number(meta.commissionAmount || 0);
    affShareTotal += Number(tx.affiliateShare || 0);
  });
  
  console.log('\n=== Comparison ===');
  console.log('Total dari affiliateShare field:', affShareTotal.toLocaleString('id-ID'));
  console.log('Total dari metadata.commissionAmount:', metaCommissionTotal.toLocaleString('id-ID'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
