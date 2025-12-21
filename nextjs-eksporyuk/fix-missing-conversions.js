const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * FIX SPECIFIC: INV9999 and INV10001
 */
async function fixMissingAffiliateConversions() {
  console.log('=== FIX INV9999 DAN INV10001 ===\n');
  
  // 1. Get Rahmat's affiliate profile
  const rahmat = await prisma.affiliateProfile.findFirst({
    where: {
      user: {
        name: { contains: 'Rahmat Al Fianto', mode: 'insensitive' }
      }
    }
  });
  
  if (!rahmat) {
    console.log('ERROR: Rahmat tidak ditemukan!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Rahmat Affiliate ID:', rahmat.id);
  console.log('Rahmat User ID:', rahmat.userId);
  
  // 2. Get transactions
  const txs = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { in: ['INV9999', 'INV10001'] }
    }
  });
  
  console.log('\nTransaksi ditemukan:', txs.length);
  
  for (const tx of txs) {
    console.log('\n' + tx.invoiceNumber + ':');
    
    // Check if conversion already exists
    const existing = await prisma.affiliateConversion.findFirst({
      where: { transactionId: tx.id }
    });
    
    if (existing) {
      console.log('  Conversion sudah ada, skip');
      continue;
    }
    
    // Determine commission
    let commission = 0;
    if (tx.type === 'MEMBERSHIP' && Number(tx.amount) === 999000) {
      commission = 325000;
    } else if (tx.type === 'PRODUCT' && Number(tx.amount) === 899000) {
      commission = 250000;
    }
    
    if (commission === 0) {
      console.log('  Tidak bisa tentukan komisi, skip');
      continue;
    }
    
    console.log('  Creating conversion...');
    console.log('  Amount: Rp', Number(tx.amount).toLocaleString());
    console.log('  Commission: Rp', commission.toLocaleString());
    
    // Create affiliate conversion
    const conversion = await prisma.affiliateConversion.create({
      data: {
        affiliateId: rahmat.id,
        transactionId: tx.id,
        commissionAmount: commission,
        commissionRate: 0, // Rate 0 karena flat amount
        paidOut: false
      }
    });
    
    console.log('  ✅ Conversion created:', conversion.id);
    
    // Update wallet (tambahkan ke balance yang bisa diwithdraw)
    const wallet = await prisma.wallet.upsert({
      where: { userId: rahmat.userId },
      create: {
        userId: rahmat.userId,
        balance: commission,
        balancePending: 0
      },
      update: {
        balance: {
          increment: commission
        }
      }
    });
    
    console.log('  ✅ Wallet updated: Rp', Number(wallet.balance).toLocaleString());
  }
  
  console.log('\n=== VERIFICATION ===\n');
  for (const tx of txs) {
    const conv = await prisma.affiliateConversion.findFirst({
      where: { transactionId: tx.id },
      include: {
        affiliate: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });
    
    console.log(tx.invoiceNumber + ':');
    if (conv) {
      console.log('  ✅ Affiliate:', conv.affiliate.user.name);
      console.log('  ✅ Commission: Rp', Number(conv.commissionAmount).toLocaleString());
    } else {
      console.log('  ❌ Still missing!');
    }
  }
  
  await prisma.$disconnect();
}

fixMissingAffiliateConversions();

