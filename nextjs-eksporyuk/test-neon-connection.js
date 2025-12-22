const { PrismaClient } = require('@prisma/client');

async function testNeonConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing Neon PostgreSQL connection...\n');
    
    // Simple query to test connection
    const userCount = await prisma.user.count();
    console.log(`✅ Connection successful! Found ${userCount} users in database`);
    
    // Test affiliate data
    const affiliateCount = await prisma.affiliateProfile.count();
    console.log(`✅ Found ${affiliateCount} affiliate profiles`);
    
    // Test transaction data
    const transactionCount = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    console.log(`✅ Found ${transactionCount} successful transactions`);
    
    console.log('\n🎉 Database Neon berfungsi dengan baik!');
    console.log('📊 Data tersedia dan dapat diakses untuk audit');
    
  } catch (error) {
    console.error('❌ Neon connection failed:', error.message);
    console.error('\n🤔 Possible reasons:');
    console.error('1. Network connectivity issues');
    console.error('2. Neon database is sleeping (need to wake up)');
    console.error('3. Connection credentials changed');
    console.error('4. Database server maintenance');
  } finally {
    await prisma.$disconnect();
  }
}

testNeonConnection();