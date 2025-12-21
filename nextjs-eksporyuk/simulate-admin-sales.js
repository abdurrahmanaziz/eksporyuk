const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This script simulates what the admin/sales API returns
 * to verify affiliate data is correctly linked
 */
async function simulateAdminSalesAPI() {
  console.log('=== Simulating Admin/Sales API Response ===\n');
  
  // Get latest 15 transactions with all relations (same as API)
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          price: true,
        }
      },
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        }
      },
      membership: {
        select: {
          membership: {
            select: {
              id: true,
              name: true,
              price: true,
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
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });
  
  console.log('Latest 15 SUCCESS transactions:');
  console.log('─'.repeat(120));
  console.log(
    'Invoice'.padEnd(12) + ' | ' +
    'Pembeli'.padEnd(25) + ' | ' +
    'Produk/Membership'.padEnd(30) + ' | ' +
    'Amount'.padEnd(12) + ' | ' +
    'Affiliate'.padEnd(20) + ' | ' +
    'Komisi'
  );
  console.log('─'.repeat(120));
  
  transactions.forEach(tx => {
    const buyer = tx.user?.name || 'N/A';
    let productName = 'N/A';
    if (tx.type === 'MEMBERSHIP' && tx.membership?.membership) {
      productName = tx.membership.membership.name;
    } else if (tx.type === 'PRODUCT' && tx.product) {
      productName = tx.product.name;
    } else if (tx.type === 'COURSE' && tx.course) {
      productName = tx.course.title;
    }
    
    const affiliate = tx.affiliateConversion?.affiliate?.user?.name || '—';
    const commission = tx.affiliateConversion?.commissionAmount 
      ? `Rp ${tx.affiliateConversion.commissionAmount.toLocaleString()}`
      : '—';
    
    console.log(
      tx.invoiceNumber.padEnd(12) + ' | ' +
      buyer.substring(0, 24).padEnd(25) + ' | ' +
      productName.substring(0, 29).padEnd(30) + ' | ' +
      `Rp ${tx.amount.toLocaleString()}`.padEnd(12) + ' | ' +
      affiliate.substring(0, 19).padEnd(20) + ' | ' +
      commission
    );
  });
  
  // Summary stats
  console.log('\n=== Statistics ===');
  const withAffiliate = transactions.filter(tx => tx.affiliateConversion).length;
  console.log(`Transactions with affiliate: ${withAffiliate}/${transactions.length}`);
  
  // Show some with affiliates specifically
  console.log('\n=== Sample Transactions WITH Affiliates ===');
  const withAffTx = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      affiliateConversion: { isNot: null }
    },
    include: {
      user: { select: { name: true } },
      affiliateConversion: {
        include: {
          affiliate: {
            include: { user: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  withAffTx.forEach(tx => {
    console.log(`${tx.invoiceNumber} | ${tx.user?.name?.substring(0, 20)} | Affiliate: ${tx.affiliateConversion?.affiliate?.user?.name} | Commission: Rp ${tx.affiliateConversion?.commissionAmount?.toLocaleString()}`);
  });
  
  await prisma.$disconnect();
}

simulateAdminSalesAPI().catch(console.error);
