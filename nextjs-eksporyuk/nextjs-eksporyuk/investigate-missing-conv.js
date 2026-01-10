const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  console.log('=== INVESTIGASI INV9999 DAN INV10001 ===\n');
  
  // 1. Get Rahmat's affiliate profile
  const rahmat = await prisma.affiliateProfile.findFirst({
    where: {
      user: {
        name: { contains: 'Rahmat Al Fianto', mode: 'insensitive' }
      }
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
  
  if (!rahmat) {
    console.log('ERROR: Rahmat Al Fianto tidak ditemukan!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Rahmat Al Fianto:');
  console.log('  User ID:', rahmat.user.id);
  console.log('  Affiliate ID:', rahmat.id);
  console.log('  Code:', rahmat.code);
  console.log('  Email:', rahmat.user.email);
  
  // 2. Check kedua transaksi
  const txs = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { in: ['INV9999', 'INV10001'] }
    },
    include: {
      user: { select: { id: true, name: true } }
    }
  });
  
  console.log('\n=== TRANSAKSI ===\n');
  
  for (const tx of txs) {
    console.log(tx.invoiceNumber + ':');
    console.log('  Transaction ID:', tx.id);
    console.log('  Buyer:', tx.user?.name);
    console.log('  Amount: Rp', Number(tx.amount).toLocaleString());
    console.log('  Type:', tx.type);
    console.log('  Status:', tx.status);
    
    const csvData = tx.metadata?.originalCsvData;
    if (csvData) {
      console.log('  CSV Affiliate:', csvData.affiliate);
      console.log('  CSV Affiliate Name:', csvData.affiliate_id);
      console.log('  CSV Product:', csvData.product);
    }
    
    // Check conversion
    const conv = await prisma.affiliateConversion.findFirst({
      where: { transactionId: tx.id }
    });
    
    if (conv) {
      console.log('  ✅ Has conversion: Rp', Number(conv.commissionAmount).toLocaleString());
    } else {
      console.log('  ❌ NO CONVERSION - HARUS DIBUAT!');
      
      // Hitung komisi yang seharusnya
      let expectedCommission = 0;
      if (tx.type === 'MEMBERSHIP') {
        // Membership biasanya 325,000 (dari data lain)
        expectedCommission = 325000;
      } else if (tx.type === 'PRODUCT') {
        // Product 899,000 biasanya sekitar 250,000
        expectedCommission = 250000;
      }
      
      console.log('  Expected commission: Rp', expectedCommission.toLocaleString());
    }
    console.log('');
  }
  
  // 3. Sample conversions dari Rahmat untuk reference
  console.log('\n=== SAMPLE CONVERSIONS RAHMAT (untuk reference) ===\n');
  const sampleConv = await prisma.affiliateConversion.findMany({
    where: { affiliateId: rahmat.id },
    include: {
      transaction: {
        select: {
          invoiceNumber: true,
          amount: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  sampleConv.forEach(c => {
    console.log(c.transaction.invoiceNumber + ':');
    console.log('  Amount: Rp', Number(c.transaction.amount).toLocaleString());
    console.log('  Commission: Rp', Number(c.commissionAmount).toLocaleString());
    console.log('  Rate:', Number(c.commissionRate));
    console.log('');
  });
  
  await prisma.$disconnect();
}

investigate();
