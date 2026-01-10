const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('Checking user: derryking914@gmail.com');
    
    const user = await prisma.user.findUnique({
      where: { email: 'derryking914@gmail.com' },
      include: {
        transactions: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('User role:', user.role);
      console.log('Transactions count:', user.transactions.length);
      console.log('Recent transactions:');
      user.transactions.forEach(t => {
        console.log(`  - ID: ${t.id}, Status: ${t.status}, Amount: ${t.amount}, Invoice: ${t.invoiceNumber}`);
      });
    } else {
      console.log('User not found');
    }
    
    // Check if there are any pending transaction creation operations
    console.log('\nChecking for duplicate invoice numbers...');
    const invoiceStats = await prisma.transaction.groupBy({
      by: ['invoiceNumber'],
      _count: {
        invoiceNumber: true
      },
      having: {
        invoiceNumber: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log('Duplicate invoices found:', invoiceStats.length);
    
  } catch (error) {
    console.error('Error details:', error);
    if (error.code) {
      console.log('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();