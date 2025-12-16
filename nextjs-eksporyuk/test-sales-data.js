const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking transaction data structure...\n');
    
    // Get a sample transaction with all relations
    const tx = await prisma.transaction.findFirst({
      where: { type: 'MEMBERSHIP' },
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
          }
        },
        membership: {
          select: {
            membership: {
              select: {
                id: true,
                name: true,
                duration: true,
              }
            }
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
      }
    });
    
    if (!tx) {
      console.log('❌ No MEMBERSHIP transaction found');
      process.exit(1);
    }
    
    console.log('📊 Sample Transaction Structure:');
    console.log('=====================================');
    console.log('Invoice:', tx.invoiceNumber);
    console.log('Type:', tx.type);
    console.log('Status:', tx.status);
    console.log('Amount:', tx.amount);
    console.log('\n📦 Product/Membership:');
    console.log('- Product:', tx.product?.name || 'null');
    console.log('- Membership:', tx.membership?.membership?.name || 'null');
    console.log('- Duration:', tx.membership?.membership?.duration || 'null');
    
    console.log('\n👤 Customer:');
    console.log('- Name:', tx.customerName || tx.user.name);
    console.log('- Email:', tx.customerEmail || tx.user.email);
    console.log('- Phone:', tx.customerPhone || tx.user.phone);
    console.log('- WhatsApp:', tx.user.whatsapp);
    
    console.log('\n💰 Affiliate Info:');
    console.log('- affiliateId:', tx.affiliateId);
    console.log('- affiliateShare:', tx.affiliateShare);
    console.log('- affiliateConversion:', tx.affiliateConversion ? 'EXISTS' : 'null');
    if (tx.affiliateConversion) {
      console.log('  - Affiliate Name:', tx.affiliateConversion.affiliate.user.name);
      console.log('  - Commission:', tx.affiliateConversion.commissionAmount);
      console.log('  - Paid Out:', tx.affiliateConversion.paidOut);
    }
    
    console.log('\n📋 Metadata:');
    console.log(JSON.stringify(tx.metadata, null, 2));
    
    console.log('\n\n🔍 Checking 3 latest transactions...\n');
    
    const latestTxs = await prisma.transaction.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        membership: {
          select: {
            membership: {
              select: {
                name: true,
                duration: true,
              }
            }
          }
        },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    latestTxs.forEach((t, i) => {
      console.log(`\n${i + 1}. ${t.invoiceNumber || 'NO-INV'}`);
      console.log(`   Type: ${t.type}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Amount: Rp ${t.amount.toLocaleString()}`);
      console.log(`   Customer: ${t.customerName || t.user.name}`);
      console.log(`   Membership: ${t.membership?.membership?.name || '-'}`);
      console.log(`   Duration: ${t.membership?.membership?.duration || '-'}`);
      console.log(`   Affiliate: ${t.affiliateConversion?.affiliate?.user?.name || '-'}`);
      console.log(`   Commission: ${t.affiliateConversion?.commissionAmount || '-'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
