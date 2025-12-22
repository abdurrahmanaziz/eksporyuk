const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactionDetails() {
  console.log('🔍 DETAILED TRANSACTION ANALYSIS');
  console.log('='.repeat(60));
  
  try {
    // Get all transaction data to understand structure
    const transactions = await prisma.transaction.findMany({
      where: {
        user: {
          name: {
            in: ['TRI ARDA PREBAWA', 'Dedy Kristiawan', 'Yohanes Ndona']
          }
        }
      },
      include: {
        user: true,
        membership: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${transactions.length} transactions for target users\n`);
    
    transactions.forEach(transaction => {
      console.log(`👤 User: ${transaction.user.name}`);
      console.log(`💰 Amount: Rp ${transaction.amount}`);
      console.log(`📅 Date: ${transaction.createdAt}`);
      console.log(`✅ Status: ${transaction.status}`);
      console.log(`🎯 Membership ID: ${transaction.membershipId}`);
      console.log(`📦 Membership Name: ${transaction.membership?.name || 'NULL'}`);
      console.log(`📝 Description: ${transaction.description || 'N/A'}`);
      console.log(`🏷️  External ID: ${transaction.externalId || 'N/A'}`);
      console.log('-'.repeat(50));
    });
    
    // Check amount patterns to determine membership type
    console.log('\n💡 AMOUNT ANALYSIS FOR MEMBERSHIP TYPE:');
    console.log('Rp 699,000 = 6 Bulan');
    console.log('Rp 1,199,000 = 12 Bulan'); 
    console.log('Rp 1,999,000 = Lifetime');
    console.log('Rp 0 = Manual/Admin entry');
    
    // Let's also check actual membership prices
    const memberships = await prisma.membership.findMany({
      where: { isActive: true }
    });
    
    console.log('\n📋 CURRENT MEMBERSHIP PRICES:');
    memberships.forEach(membership => {
      console.log(`${membership.name}: Rp ${membership.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionDetails();