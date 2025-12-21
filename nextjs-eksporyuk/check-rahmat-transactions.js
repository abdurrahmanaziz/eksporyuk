const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRahmatTransactions() {
  // Get Rahmat's affiliate profile
  const rahmat = await prisma.affiliateProfile.findFirst({
    where: { affiliateCode: '2LTPLYNV' },
    include: { user: { select: { name: true } } }
  });
  
  console.log('Rahmat Affiliate Profile:', {
    id: rahmat.id,
    name: rahmat.user.name,
    code: rahmat.affiliateCode
  });
  
  // Get latest 10 conversions for Rahmat
  console.log('\n=== Latest 10 Conversions for Rahmat ===');
  const conversions = await prisma.affiliateConversion.findMany({
    where: { affiliateId: rahmat.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      transaction: {
        select: {
          invoiceNumber: true,
          amount: true,
          status: true,
          createdAt: true
        }
      }
    }
  });
  
  conversions.forEach((c, i) => {
    console.log(`${i+1}. ${c.transaction?.invoiceNumber || 'NO TX'} | Commission: Rp ${c.commissionAmount?.toLocaleString()} | ${c.transaction?.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
  });
  
  // Check a specific recent transaction from Sejoli screenshot
  console.log('\n=== Checking INV19334 (Sejoli screenshot) ===');
  const tx19334 = await prisma.transaction.findFirst({
    where: { invoiceNumber: 'INV19334' },
    include: {
      affiliateConversion: {
        include: {
          affiliate: {
            include: { user: { select: { name: true } } }
          }
        }
      }
    }
  });
  
  if (tx19334) {
    console.log('Transaction found:', {
      invoice: tx19334.invoiceNumber,
      amount: tx19334.amount,
      status: tx19334.status,
      affiliate: tx19334.affiliateConversion?.affiliate?.user?.name || 'N/A',
      commission: tx19334.affiliateConversion?.commissionAmount || 'N/A'
    });
  } else {
    console.log('INV19334 NOT FOUND in database');
  }
  
  // Check latest transactions and their affiliate status
  console.log('\n=== Latest 15 Transactions with Affiliate Status ===');
  const latestTx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      affiliateConversion: {
        include: {
          affiliate: {
            include: { user: { select: { name: true } } }
          }
        }
      }
    }
  });
  
  console.log('Invoice        | Amount      | Affiliate          | Commission');
  console.log('-'.repeat(70));
  latestTx.forEach(tx => {
    const affiliate = tx.affiliateConversion?.affiliate?.user?.name || 'N/A';
    const commission = tx.affiliateConversion?.commissionAmount 
      ? `Rp ${tx.affiliateConversion.commissionAmount.toLocaleString()}` 
      : 'N/A';
    console.log(`${tx.invoiceNumber.padEnd(14)} | ${('Rp ' + tx.amount.toLocaleString()).padEnd(11)} | ${affiliate.padEnd(18)} | ${commission}`);
  });
  
  await prisma.$disconnect();
}

checkRahmatTransactions().catch(console.error);
