const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('\n=== CLEANUP TEST DATA ===\n');
  
  try {
    // 1. Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } },
          { email: { contains: 'test' } }
        ]
      },
      select: { id: true, name: true, email: true }
    });
    
    console.log('Test users found:', testUsers.length);
    testUsers.forEach(u => console.log('  - ' + u.name + ' (' + u.email + ')'));
    
    // 2. Find transactions from test users
    const testTx = await prisma.transaction.findMany({
      where: {
        userId: { in: testUsers.map(u => u.id) }
      },
      select: { id: true, invoiceNumber: true, type: true, amount: true }
    });
    
    console.log('\nTest transactions:', testTx.length);
    testTx.forEach(t => console.log('  - ' + t.invoiceNumber + ' | ' + t.type + ' | Rp ' + Number(t.amount).toLocaleString()));
    
    // 3. Delete test transactions
    if (testTx.length > 0) {
      const deleted = await prisma.transaction.deleteMany({
        where: { userId: { in: testUsers.map(u => u.id) } }
      });
      console.log('\n✅ Deleted test transactions:', deleted.count);
    }
    
    // 4. Delete affiliated conversions from test users
    const testConversions = await prisma.affiliateConversion.deleteMany({
      where: { 
        OR: [
          { userId: { in: testUsers.map(u => u.id) } },
          { affiliateId: { in: testUsers.map(u => u.id) } }
        ]
      }
    });
    console.log('✅ Deleted test conversions:', testConversions.count);
    
    // 5. Delete test user memberships
    const testMemberships = await prisma.userMembership.deleteMany({
      where: { userId: { in: testUsers.map(u => u.id) } }
    });
    console.log('✅ Deleted test memberships:', testMemberships.count);
    
    // 6. Verify
    console.log('\n=== VERIFIKASI ===');
    
    const allInv = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { startsWith: 'INV' },
        type: { in: ['MEMBERSHIP', 'PRODUCT'] }
      },
      select: { invoiceNumber: true }
    });
    
    const nums = allInv
      .map(t => parseInt(t.invoiceNumber.replace('INV', '')))
      .filter(n => n > 0)
      .sort((a, b) => b - a);
    
    console.log('Total transaksi real:', nums.length);
    console.log('Invoice tertinggi:', 'INV' + nums[0]);
    console.log('Invoice baru mulai dari: INV' + (nums[0] + 1));
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
