const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeMissingMemberships() {
  try {
    console.log('🔍 CHECKING MISSING MEMBERSHIPS\n');
    
    // Get all SUCCESS transactions
    const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: {
        id: true,
        userId: true,
        amount: true,
        createdAt: true
      }
    });
    
    console.log(`Total SUCCESS transactions: ${successTransactions.length.toLocaleString()}`);
    
    // Get all memberships
    const existingMemberships = await prisma.userMembership.findMany({
      select: { transactionId: true }
    });
    
    const membershipTransIds = new Set(existingMemberships.map(m => m.transactionId));
    
    console.log(`Total memberships: ${existingMemberships.length.toLocaleString()}`);
    console.log(`Memberships with transaction: ${membershipTransIds.size.toLocaleString()}\n`);
    
    // Find transactions without memberships
    const transactionsWithoutMembership = successTransactions.filter(t => !membershipTransIds.has(t.id));
    
    console.log(`❌ Missing memberships: ${transactionsWithoutMembership.length.toLocaleString()}\n`);
    
    if (transactionsWithoutMembership.length === 0) {
      console.log('✅ All SUCCESS transactions have memberships!');
      return;
    }
    
    // Helper: Calculate membership duration based on amount
    function calculateMembershipDuration(amount) {
      if (amount >= 4000000) return { duration: 'LIFETIME', months: 999 };
      if (amount >= 3500000) return { duration: 'ONE_YEAR', months: 12 };
      if (amount >= 800000) return { duration: 'SIX_MONTHS', months: 6 };
      if (amount >= 700000) return { duration: 'THREE_MONTHS', months: 3 };
      return { duration: 'ONE_MONTH', months: 1 };
    }
    
    // Get default membership
    const defaultMembership = await prisma.membership.findFirst({
      where: { name: { contains: '1 Bulan' } }
    });
    
    if (!defaultMembership) {
      console.error('❌ Default membership not found!');
      return;
    }
    
    console.log('🔄 Creating missing memberships...\n');
    
    let created = 0;
    for (const trans of transactionsWithoutMembership) {
      const { duration, months } = calculateMembershipDuration(trans.amount);
      const startDate = trans.createdAt;
      const endDate = new Date(startDate);
      
      if (duration === 'LIFETIME') {
        endDate.setFullYear(endDate.getFullYear() + 99);
      } else {
        endDate.setMonth(endDate.getMonth() + months);
      }
      
      try {
        await prisma.userMembership.create({
          data: {
            userId: trans.userId,
            membershipId: defaultMembership.id,
            transactionId: trans.id,
            startDate,
            endDate,
            isActive: endDate > new Date()
          }
        });
        
        created++;
        
        if (created % 100 === 0) {
          process.stdout.write(`\r  Created: ${created}/${transactionsWithoutMembership.length}`);
        }
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`\n  Error creating membership for trans ${trans.id}:`, error.message);
        }
      }
    }
    
    console.log(`\n\n✅ Created ${created.toLocaleString()} missing memberships!`);
    
    // Final verification
    const finalMemberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({
      where: { endDate: { gte: new Date() } }
    });
    
    console.log(`\n📊 FINAL STATUS:`);
    console.log(`  Total Memberships: ${finalMemberships.toLocaleString()}`);
    console.log(`  Active: ${activeMemberships.toLocaleString()}`);
    console.log(`  Expected: ${successTransactions.length.toLocaleString()}`);
    console.log(`  Match: ${finalMemberships === successTransactions.length ? '✅' : '⚠️  Still mismatch'}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeMissingMemberships();
