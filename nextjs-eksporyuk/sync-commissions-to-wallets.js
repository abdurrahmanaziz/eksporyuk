const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCommissionsToWallets() {
  console.log('💰 SYNCING AFFILIATE COMMISSIONS TO WALLETS\n');
  
  try {
    // Get all unique affiliate profiles
    const profiles = await prisma.affiliateProfile.findMany({
      select: { id: true, userId: true }
    });
    
    console.log(`Found ${profiles.length} affiliate profiles\n`);
    
    let created = 0;
    let updated = 0;
    let totalAmount = 0;
    
    for (const profile of profiles) {
      // Calculate total commission for this affiliate
      const commissionSum = await prisma.affiliateConversion.aggregate({
        where: { affiliateId: profile.id },
        _sum: { commissionAmount: true }
      });
      
      const totalCommission = Number(commissionSum._sum.commissionAmount || 0);
      
      if (totalCommission === 0) {
        continue;
      }
      
      // Check if wallet exists
      const existingWallet = await prisma.wallet.findUnique({
        where: { userId: profile.userId }
      });
      
      if (existingWallet) {
        // Update existing wallet
        await prisma.wallet.update({
          where: { userId: profile.userId },
          data: {
            totalEarnings: totalCommission,
            balance: totalCommission, // Set balance = earnings (all available for withdrawal)
          }
        });
        updated++;
      } else {
        // Create new wallet
        // Helper to generate ID
        function generateId() {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        }
        
        await prisma.wallet.create({
          data: {
            id: generateId(),
            userId: profile.userId,
            balance: totalCommission,
            balancePending: 0,
            totalEarnings: totalCommission,
            updatedAt: new Date(),
          }
        });
        created++;
      }
      
      totalAmount += totalCommission;
      
      if ((created + updated) % 20 === 0) {
        console.log(`✓ Processed ${created + updated} profiles...`);
      }
    }
    
    console.log(`\n✅ SYNC COMPLETE:`);
    console.log(`  Wallets created: ${created}`);
    console.log(`  Wallets updated: ${updated}`);
    console.log(`  Total synced: Rp ${totalAmount.toLocaleString('id-ID')}`);
    
    // Final verification
    console.log(`\n✅ VERIFICATION:`);
    const walletsWithEarnings = await prisma.wallet.count({
      where: { totalEarnings: { gt: 0 } }
    });
    
    const totalEarningsInWallets = await prisma.wallet.aggregate({
      _sum: { totalEarnings: true }
    });
    
    console.log(`  Wallets with earnings: ${walletsWithEarnings}`);
    console.log(`  Total in wallets: Rp ${Number(totalEarningsInWallets._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncCommissionsToWallets();
