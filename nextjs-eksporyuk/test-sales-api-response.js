/**
 * Test Sales API Response
 * Cek data yang dikembalikan oleh API /api/admin/sales
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSalesApiResponse() {
  console.log('\n=== Testing Sales API Response ===\n');

  try {
    // Query yang sama dengan API endpoint
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
        membership: {
          select: {
            membership: {
              select: {
                id: true,
                name: true,
                price: true,
                reminders: true,
              }
            }
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
      take: 10, // Ambil 10 transaksi teratas
    });

    console.log(`Total transactions fetched: ${transactions.length}\n`);

    // Analisis data yang dikembalikan
    console.log('=== Transaction Data Analysis ===\n');
    
    let withAffiliateConversion = 0;
    let withoutAffiliateConversion = 0;
    let withInvoiceNumber = 0;
    let withoutInvoiceNumber = 0;

    transactions.forEach((tx, index) => {
      if (tx.affiliateConversion) {
        withAffiliateConversion++;
      } else {
        withoutAffiliateConversion++;
      }

      if (tx.invoiceNumber && tx.invoiceNumber.startsWith('INV')) {
        withInvoiceNumber++;
      } else {
        withoutInvoiceNumber++;
      }

      // Display first 3 in detail
      if (index < 3) {
        console.log(`\n--- Transaction ${index + 1} ---`);
        console.log(`Invoice: ${tx.invoiceNumber || 'MISSING'}`);
        console.log(`User: ${tx.user.name}`);
        console.log(`Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`);
        console.log(`Status: ${tx.status}`);
        console.log(`Type: ${tx.type}`);
        
        if (tx.affiliateConversion) {
          console.log(`✅ Has AffiliateConversion:`);
          console.log(`   - Affiliate: ${tx.affiliateConversion.affiliate?.user?.name || 'N/A'}`);
          console.log(`   - Commission: Rp ${Number(tx.affiliateConversion.commissionAmount).toLocaleString('id-ID')}`);
        } else {
          console.log(`❌ No AffiliateConversion`);
          if (tx.affiliateId) {
            console.log(`   - But has affiliateId: ${tx.affiliateId}`);
          }
          if (tx.affiliateShare) {
            console.log(`   - But has affiliateShare: Rp ${Number(tx.affiliateShare).toLocaleString('id-ID')}`);
          }
        }
      }
    });

    console.log('\n\n=== Summary ===');
    console.log(`With AffiliateConversion: ${withAffiliateConversion} (${(withAffiliateConversion/transactions.length*100).toFixed(1)}%)`);
    console.log(`Without AffiliateConversion: ${withoutAffiliateConversion} (${(withoutAffiliateConversion/transactions.length*100).toFixed(1)}%)`);
    console.log(`With Invoice Number: ${withInvoiceNumber} (${(withInvoiceNumber/transactions.length*100).toFixed(1)}%)`);
    console.log(`Without Invoice Number: ${withoutInvoiceNumber} (${(withoutInvoiceNumber/transactions.length*100).toFixed(1)}%)`);

    // Check if data structure matches frontend expectations
    console.log('\n=== Data Structure Validation ===');
    const firstTx = transactions[0];
    if (firstTx) {
      console.log('\nFirst Transaction Structure:');
      console.log(`- Has user object: ${!!firstTx.user}`);
      console.log(`- Has user.name: ${!!firstTx.user?.name}`);
      console.log(`- Has invoiceNumber: ${!!firstTx.invoiceNumber}`);
      console.log(`- Has affiliateConversion: ${!!firstTx.affiliateConversion}`);
      
      if (firstTx.affiliateConversion) {
        console.log(`- Has affiliateConversion.affiliate: ${!!firstTx.affiliateConversion.affiliate}`);
        console.log(`- Has affiliateConversion.affiliate.user: ${!!firstTx.affiliateConversion.affiliate?.user}`);
        console.log(`- Has affiliateConversion.affiliate.user.name: ${!!firstTx.affiliateConversion.affiliate?.user?.name}`);
        console.log(`- Has affiliateConversion.commissionAmount: ${!!firstTx.affiliateConversion.commissionAmount}`);
      }
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Error testing sales API response:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testSalesApiResponse()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
