const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreCorrectWalletBalances() {
  console.log('🔄 RESTORING CORRECT WALLET BALANCES FROM FILE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Load correct commission data
    const commissionData = JSON.parse(
      fs.readFileSync(__dirname + '/scripts/migration/flat-commission-final.json', 'utf8')
    );

    console.log(`📂 Loading ${commissionData.affiliates.length} affiliates from file\n`);

    let updated = 0;
    let notFound = 0;

    for (const affData of commissionData.affiliates) {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: affData.email },
          include: { wallet: true }
        });

        if (!user) {
          notFound++;
          continue;
        }

        // Update or create wallet
        await prisma.wallet.upsert({
          where: { userId: user.id },
          update: { balance: affData.totalCommission },
          create: {
            userId: user.id,
            balance: affData.totalCommission,
            balancePending: 0
          }
        });

        updated++;

        if (updated <= 5) {
          console.log(`✅ ${affData.email}`);
          console.log(`   Balance: Rp ${affData.totalCommission.toLocaleString('id-ID')}`);
        }

      } catch (err) {
        console.error(`❌ Error for ${affData.email}:`, err.message);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Not Found: ${notFound}`);

    // Verify total
    const totalInWallets = await prisma.wallet.aggregate({
      _sum: { balance: true },
      where: { balance: { gt: 0 } }
    });

    console.log(`\n💰 Total Commission in Wallets: Rp ${totalInWallets._sum.balance?.toLocaleString('id-ID') || '0'}`);
    console.log(`📂 Expected from file: Rp ${commissionData.stats.totalCommission.toLocaleString('id-ID')}`);
    
    const match = totalInWallets._sum.balance === commissionData.stats.totalCommission;
    console.log(`\n${match ? '✅' : '❌'} Wallets ${match ? 'MATCH' : 'DO NOT MATCH'} file data!`);

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreCorrectWalletBalances();
