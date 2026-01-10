const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function applyAffiliateCommissions() {
  try {
    console.log('💰 APPLYING AFFILIATE COMMISSIONS FROM SEJOLI DATA');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
    // Load commission data
    const commissionData = JSON.parse(fs.readFileSync('scripts/migration/flat-commission-final.json', 'utf8'));
    
    console.log('📊 COMMISSION DATA SUMMARY:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    console.log(`Total Affiliates: ${commissionData.stats.totalAffiliates}`);
    console.log(`Total Sales: Rp ${commissionData.stats.totalSales.toLocaleString('id-ID')}`);
    console.log(`Total Commission: Rp ${commissionData.stats.totalCommission.toLocaleString('id-ID')}\n`);
    
    console.log('📦 COMMISSION RATES:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    for (const [range, amount] of Object.entries(commissionData.commissionRates)) {
      console.log(`  ${range.padEnd(15)} : Rp ${amount.toLocaleString('id-ID')}`);
    }
    console.log();
    
    // Process each affiliate
    console.log('🔄 PROCESSING AFFILIATES:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────\n');
    
    let processed = 0;
    let skipped = 0;
    let totalCommissionApplied = 0;
    
    for (const affiliate of commissionData.affiliates) {
      const email = affiliate.email.toLowerCase();
      
      // Find user in database
      const user = await prisma.user.findFirst({
        where: { 
          email: { equals: email, mode: 'insensitive' }
        },
        select: { id: true, email: true, name: true }
      });
      
      if (!user) {
        console.log(`  ⏭️  Skipped: ${email} (user not found)`);
        skipped++;
        continue;
      }
      
      // Get or create wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId: user.id }
      });
      
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            balancePending: 0
          }
        });
      }
      
      // Update wallet balance
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: affiliate.totalCommission,
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ ${user.name || user.email}`);
      console.log(`     Commission: Rp ${affiliate.totalCommission.toLocaleString('id-ID')} (${affiliate.orderCount} orders)`);
      
      processed++;
      totalCommissionApplied += affiliate.totalCommission;
      
      // Show progress every 10 affiliates
      if (processed % 10 === 0) {
        console.log(`\n  Progress: ${processed}/${commissionData.affiliates.length}\n`);
      }
    }
    
    console.log('\n\n✅ COMMISSION APPLICATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    console.log(`  Processed: ${processed} affiliates`);
    console.log(`  Skipped: ${skipped} (users not in database)`);
    console.log(`  Total Commission Applied: Rp ${totalCommissionApplied.toLocaleString('id-ID')}`);
    console.log(`  Expected: Rp ${commissionData.stats.totalCommission.toLocaleString('id-ID')}`);
    console.log(`  Match: ${totalCommissionApplied === commissionData.stats.totalCommission ? '✅ PERFECT!' : '⚠️  Mismatch'}`);
    
    // Verify final state
    console.log('\n\n📊 FINAL VERIFICATION:');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    
    const walletsWithBalance = await prisma.wallet.findMany({
      where: { balance: { gt: 0 } },
      include: {
        user: {
          select: { email: true, name: true }
        }
      },
      orderBy: { balance: 'desc' },
      take: 10
    });
    
    console.log('\n  Top 10 Wallets by Balance:');
    for (const wallet of walletsWithBalance) {
      console.log(`    ${wallet.user.name || wallet.user.email}: Rp ${wallet.balance.toLocaleString('id-ID')}`);
    }
    
    const totalWalletBalance = await prisma.wallet.aggregate({
      _sum: { balance: true },
      where: { balance: { gt: 0 } }
    });
    
    console.log(`\n  Total Balance in All Wallets: Rp ${(totalWalletBalance._sum.balance || 0).toLocaleString('id-ID')}`);
    console.log(`  Wallets with Balance: ${walletsWithBalance.length}+`);
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 AFFILIATE COMMISSIONS SUCCESSFULLY APPLIED!');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

applyAffiliateCommissions();
