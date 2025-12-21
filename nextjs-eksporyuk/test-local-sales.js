const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLocalSalesData() {
  console.log('🔍 TESTING LOCAL ADMIN/SALES DATA');
  console.log('==================================\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected - ${userCount} users found`);

    // Test transaction count
    console.log('\n2. Testing transaction data...');
    const totalTransactions = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    console.log(`✅ Found ${totalTransactions} SUCCESS transactions`);

    // Test affiliate conversions
    console.log('\n3. Testing affiliate conversions...');
    const conversions = await prisma.affiliateConversion.count();
    console.log(`✅ Found ${conversions} affiliate conversions`);

    // Test the exact query used in admin/sales API
    console.log('\n4. Testing admin/sales query...');
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
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`✅ Successfully queried ${transactions.length} transactions with includes`);

    console.log('\n5. Sample data:');
    transactions.forEach((tx, i) => {
      const affiliate = tx.affiliateConversion?.affiliate?.user?.name || 'No affiliate';
      const commission = tx.affiliateConversion?.commissionAmount || 0;
      console.log(`  ${i+1}. ${tx.invoiceNumber || 'No invoice'} - ${affiliate} - Rp ${commission}`);
    });

    console.log('\n✅ LOCAL DATABASE TEST PASSED');
    console.log('If admin/sales page is empty, it might be a frontend/authentication issue, not database.');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.log('\nThis might explain why admin/sales is empty locally.');
  } finally {
    await prisma.$disconnect();
  }
}

testLocalSalesData();