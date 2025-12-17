const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPriority2Issues() {
  console.log('🔧 PRIORITY 2 FIXES\n');
  console.log('='.repeat(80));
  
  // ==================== FIX 1: EXPIRED MEMBERSHIPS ====================
  console.log('\n📋 1. FIXING EXPIRED MEMBERSHIPS\n');
  
  const expiredMemberships = await prisma.userMembership.findMany({
    where: {
      isActive: true,
      endDate: {
        lt: new Date(),
      },
    },
    include: {
      user: { select: { email: true } },
      membership: { select: { name: true } },
    },
  });
  
  console.log(`Found ${expiredMemberships.length} expired memberships still marked active:\n`);
  
  if (expiredMemberships.length > 0) {
    expiredMemberships.forEach((um, idx) => {
      const daysExpired = Math.floor((new Date() - um.endDate) / (1000 * 60 * 60 * 24));
      console.log(`${idx + 1}. ${um.user.email}`);
      console.log(`   Membership: ${um.membership.name}`);
      console.log(`   Expired: ${um.endDate.toISOString().split('T')[0]} (${daysExpired} days ago)`);
    });
    
    console.log(`\n💡 Will deactivate ${expiredMemberships.length} expired memberships`);
    console.log('Run with FIX=true to apply\n');
    
    if (process.env.FIX === 'true') {
      console.log('🔧 Deactivating expired memberships...\n');
      
      const result = await prisma.userMembership.updateMany({
        where: {
          isActive: true,
          endDate: {
            lt: new Date(),
          },
        },
        data: {
          isActive: false,
          status: 'EXPIRED',
        },
      });
      
      console.log(`✅ Deactivated ${result.count} expired memberships\n`);
    }
  } else {
    console.log('✅ No expired memberships found\n');
  }
  
  // ==================== FIX 2: WALLET BALANCE INCONSISTENCIES ====================
  console.log('\n💼 2. FIXING WALLET BALANCE INCONSISTENCIES\n');
  
  console.log('Checking wallets where balance > totalEarnings...\n');
  
  // Manual check since Prisma doesn't support field comparison in where
  const allWallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { balance: { gt: 0 } },
        { totalEarnings: { gt: 0 } },
      ],
    },
    include: {
      user: { select: { email: true, role: true } },
    },
  });
  
  const problematic = allWallets.filter(w => 
    Number(w.balance || 0) > Number(w.totalEarnings || 0) + 100 // Allow 100 rounding
  );
  
  console.log(`Found ${problematic.length} wallets with balance > totalEarnings:\n`);
  
  if (problematic.length > 0) {
    for (const wallet of problematic) {
      const balance = Number(wallet.balance);
      const earnings = Number(wallet.totalEarnings);
      const difference = balance - earnings;
      
      console.log(`📧 ${wallet.user.email} (${wallet.user.role})`);
      console.log(`   Balance: Rp ${balance.toLocaleString()}`);
      console.log(`   Total Earnings: Rp ${earnings.toLocaleString()}`);
      console.log(`   Difference: Rp ${difference.toLocaleString()}`);
      
      // Check if there are any payouts that might explain this
      const payouts = await prisma.payout.findMany({
        where: {
          walletId: wallet.id,
          status: 'APPROVED',
        },
      });
      
      const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
      
      if (totalPayouts > 0) {
        console.log(`   Payouts: Rp ${totalPayouts.toLocaleString()} (might explain difference)`);
      }
      
      // Check conversions to find actual earnings
      const user = await prisma.user.findUnique({
        where: { id: wallet.userId },
        include: { affiliateProfile: true },
      });
      
      if (user?.affiliateProfile) {
        const actualEarnings = await prisma.affiliateConversion.aggregate({
          where: { affiliateId: user.affiliateProfile.id },
          _sum: { commissionAmount: true },
        });
        
        const actual = Number(actualEarnings._sum.commissionAmount || 0);
        console.log(`   Actual from Conversions: Rp ${actual.toLocaleString()}`);
        
        if (Math.abs(actual - balance) < 10) {
          console.log(`   💡 Recommendation: Set totalEarnings = balance (${balance})`);
        } else if (Math.abs(actual - earnings) < 10) {
          console.log(`   💡 Recommendation: Set balance = totalEarnings (${earnings})`);
        } else {
          console.log(`   ⚠️  Complex case - manual review needed`);
        }
      } else {
        // Non-affiliate user with balance but no earnings
        console.log(`   💡 Recommendation: Set totalEarnings = balance (${balance}) - likely manual credit`);
      }
      
      console.log('');
    }
    
    console.log(`\n⚠️  Wallet fixes require manual review due to complexity`);
    console.log(`   These cases might be:
   - Manual top-ups/credits from admin
   - Missing conversion records
   - Data migration artifacts
   
   Recommended action: Review each case individually`);
  } else {
    console.log('✅ All wallets are consistent\n');
  }
  
  await prisma.$disconnect();
}

fixPriority2Issues().catch(console.error);
