const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminSalesData() {
  console.log('🔍 VERIFIKASI FINAL ADMIN/SALES DASHBOARD');
  console.log('==========================================\n');

  try {
    // Query yang sama dengan API admin/sales
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            reminders: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            reminders: true,
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          }
        },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    whatsapp: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('📊 SAMPLE DATA ADMIN/SALES (10 terbaru):');
    console.log('='.repeat(120));
    console.log(`${'Invoice'.padEnd(12)} | ${'Customer'.padEnd(20)} | ${'Amount'.padEnd(12)} | ${'Affiliate'.padEnd(20)} | ${'Komisi'.padEnd(12)}`);
    console.log('='.repeat(120));

    let withAffiliate = 0;
    let withoutAffiliate = 0;

    transactions.forEach((tx, index) => {
      const invoice = tx.invoiceNumber || 'N/A';
      const customer = tx.customerName || tx.user.name || 'N/A';
      const amount = `Rp ${Number(tx.amount).toLocaleString('id-ID')}`;
      
      let affiliate = '-';
      let commission = '-';
      
      if (tx.affiliateConversion) {
        affiliate = tx.affiliateConversion.affiliate.user.name;
        commission = `Rp ${Number(tx.affiliateConversion.commissionAmount).toLocaleString('id-ID')}`;
        withAffiliate++;
      } else {
        withoutAffiliate++;
      }

      console.log(`${invoice.padEnd(12)} | ${customer.substring(0, 20).padEnd(20)} | ${amount.padEnd(12)} | ${affiliate.substring(0, 20).padEnd(20)} | ${commission.padEnd(12)}`);
    });

    console.log('='.repeat(120));
    console.log(`\n📈 RINGKASAN SAMPLE (10 transaksi terbaru):`);
    console.log(`✅ Dengan affiliate: ${withAffiliate}`);
    console.log(`❌ Tanpa affiliate: ${withoutAffiliate}`);

    // Total stats
    const totalTransactions = await prisma.transaction.count({
      where: { status: 'SUCCESS' }
    });
    
    const transactionsWithConversion = await prisma.transaction.count({
      where: {
        status: 'SUCCESS',
        affiliateConversion: {
          isNot: null
        }
      }
    });

    console.log(`\n📊 STATISTIK KESELURUHAN:`);
    console.log(`Total transaksi SUCCESS: ${totalTransactions}`);
    console.log(`Dengan data affiliate: ${transactionsWithConversion}`);
    console.log(`Coverage: ${((transactionsWithConversion / totalTransactions) * 100).toFixed(1)}%`);

    console.log(`\n✅ ADMIN/SALES DASHBOARD STATUS:`);
    if (transactionsWithConversion > 0) {
      console.log(`✅ Kolom Affiliate dan Komisi sudah berhasil ditampilkan!`);
      console.log(`✅ ${transactionsWithConversion} transaksi menampilkan data affiliate`);
      console.log(`✅ ${totalTransactions - transactionsWithConversion} transaksi tanpa affiliate (normal)`);
    } else {
      console.log(`❌ Masih ada masalah dengan tampilan data affiliate`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminSalesData();