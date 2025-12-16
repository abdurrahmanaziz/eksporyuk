const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAzizCommission() {
  console.log('🔍 Analyzing azizbiasa@gmail.com commission data...\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'azizbiasa@gmail.com' },
    include: {
      wallet: true,
      affiliateProfile: true,
    }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('👤 User:', user.name);
  console.log('📧 Email:', user.email);
  console.log('🆔 ID:', user.id);
  console.log('\n💳 Current Wallet:');
  console.log('   Balance:', user.wallet?.balance || 0);
  console.log('   TotalEarnings:', user.wallet?.totalEarnings || 0);
  
  // Get all conversions
  const conversions = await prisma.affiliateConversion.findMany({
    where: {
      affiliateId: user.affiliateProfile.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  console.log(`\n📊 Recent Conversions (${conversions.length} total):\n`);
  
  let totalCommission = 0;
  conversions.forEach((conv, idx) => {
    const amount = Number(conv.commissionAmount);
    totalCommission += amount;
    console.log(`${idx + 1}. ${conv.createdAt.toISOString().split('T')[0]} - Rp ${amount.toLocaleString()} - ${conv.paidOut ? '✅ Paid' : '⏳ Pending'}`);
  });
  
  // Calculate actual total from ALL conversions
  const actualTotal = await prisma.affiliateConversion.aggregate({
    where: {
      affiliateId: user.affiliateProfile.id,
    },
    _sum: { commissionAmount: true },
    _count: true,
  });
  
  const correctTotal = Number(actualTotal._sum.commissionAmount || 0);
  const correctCount = actualTotal._count;
  
  console.log(`\n💰 Calculation Summary:`);
  console.log(`   Total Conversions: ${correctCount}`);
  console.log(`   Correct Total Earnings: Rp ${correctTotal.toLocaleString()}`);
  console.log(`   Current Wallet.totalEarnings: Rp ${Number(user.wallet?.totalEarnings || 0).toLocaleString()}`);
  console.log(`   Current AffiliateProfile.totalEarnings: Rp ${Number(user.affiliateProfile?.totalEarnings || 0).toLocaleString()}`);
  console.log(`   Difference: Rp ${(Number(user.wallet?.totalEarnings || 0) - correctTotal).toLocaleString()}`);
  
  // Check if we should fix it
  if (Math.abs(Number(user.wallet?.totalEarnings || 0) - correctTotal) > 10) {
    console.log(`\n⚠️  DATA MISMATCH DETECTED!`);
    console.log(`\n🔧 Recommended Fix:`);
    console.log(`   1. Set Wallet.totalEarnings = ${correctTotal}`);
    console.log(`   2. Set Wallet.balance = ${correctTotal} (if no withdrawals)`);
    console.log(`   3. Set AffiliateProfile.totalEarnings = ${correctTotal}`);
    console.log(`   4. Set AffiliateProfile.totalConversions = ${correctCount}`);
    
    // Check if there are any withdrawals/payouts
    const payouts = await prisma.payout.findMany({
      where: {
        wallet: {
          userId: user.id,
        },
        status: 'APPROVED',
      },
    });
    
    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const correctBalance = correctTotal - totalPayouts;
    
    console.log(`\n💸 Payout Check:`);
    console.log(`   Total Payouts: Rp ${totalPayouts.toLocaleString()}`);
    console.log(`   Correct Balance: Rp ${correctBalance.toLocaleString()}`);
    
    console.log(`\n❓ Apply fix? (This will update the database)`);
    console.log(`   Run with FIX=true to apply: FIX=true node fix-aziz-commission.js`);
    
    if (process.env.FIX === 'true') {
      console.log(`\n🔧 Applying fix...`);
      
      // Update wallet
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          totalEarnings: correctTotal,
          balance: correctBalance,
        },
      });
      
      // Update affiliate profile
      await prisma.affiliateProfile.update({
        where: { id: user.affiliateProfile.id },
        data: {
          totalEarnings: correctTotal,
          totalConversions: correctCount,
        },
      });
      
      console.log(`\n✅ Fix applied successfully!`);
      console.log(`   Wallet.totalEarnings: ${correctTotal}`);
      console.log(`   Wallet.balance: ${correctBalance}`);
      console.log(`   AffiliateProfile.totalEarnings: ${correctTotal}`);
      console.log(`   AffiliateProfile.totalConversions: ${correctCount}`);
    }
  } else {
    console.log(`\n✅ Data is consistent, no fix needed!`);
  }
  
  await prisma.$disconnect();
}

fixAzizCommission().catch(console.error);
