const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compareDataDiscrepancy() {
  try {
    console.log('🔍 INVESTIGATING DATA DISCREPANCY\n');
    console.log('📊 Dashboard shows different figures than database audit');
    console.log('🎯 Checking if we\'re using correct database\n');

    // Get Sutisna's exact data
    const sutisna = await prisma.affiliateProfile.findFirst({
      where: {
        user: {
          email: 'azzka42@gmail.com'
        }
      },
      include: {
        user: true,
        conversions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (sutisna) {
      console.log('👤 SUTISNA DATA FROM DATABASE:');
      console.log(`   Email: ${sutisna.user.email}`);
      console.log(`   Total Earnings: Rp ${parseFloat(sutisna.totalEarnings).toLocaleString('id-ID')}`);
      console.log(`   Total Conversions: ${sutisna.totalConversions}`);
      console.log(`   Is Active: ${sutisna.isActive}`);
      console.log(`   Last Updated: ${sutisna.updatedAt}`);
      console.log();

      console.log('📈 RECENT CONVERSIONS:');
      sutisna.conversions.forEach((conv, i) => {
        console.log(`   ${i+1}. ${conv.createdAt.toISOString().split('T')[0]} - Rp ${parseFloat(conv.commissionAmount).toLocaleString('id-ID')}`);
      });
    }

    console.log('\n📊 DASHBOARD VS DATABASE COMPARISON:');
    console.log('   Dashboard: Rp 133.475.000');
    console.log(`   Database : Rp ${parseFloat(sutisna?.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log();

    // Check if this is dev vs production database
    const dbInfo = await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log('🗄️  DATABASE INFO:', dbInfo);

    // Check latest transactions to see if this is current data
    const latestTx = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    console.log('\n📅 LATEST TRANSACTION IN DATABASE:');
    if (latestTx) {
      console.log(`   Date: ${latestTx.createdAt}`);
      console.log(`   Amount: Rp ${parseFloat(latestTx.amount).toLocaleString('id-ID')}`);
      console.log(`   User: ${latestTx.user?.email || 'Unknown'}`);
    }

    // Check total affiliate earnings to compare
    const totalEarnings = await prisma.affiliateProfile.aggregate({
      _sum: { totalEarnings: true }
    });

    console.log('\n💰 TOTAL ALL AFFILIATE EARNINGS IN DATABASE:');
    console.log(`   Rp ${parseFloat(totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID')}`);

    console.log('\n🎯 DASHBOARD TOTAL (from image): Rp 1.256.771.000');
    console.log('\n📊 POSSIBLE CAUSES:');
    console.log('   1. Using development database instead of production');
    console.log('   2. Data not synchronized between systems');
    console.log('   3. Different calculation methods');
    console.log('   4. Dashboard cache not updated');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

compareDataDiscrepancy();