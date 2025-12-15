const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditCommissions() {
  console.log('🔍 FINAL COMMISSION AUDIT\n');
  console.log('═══════════════════════════════════════\n');

  // Load commission data
  const commissionData = JSON.parse(fs.readFileSync(__dirname + '/scripts/migration/flat-commission-final.json', 'utf8'));
  
  console.log('📂 COMMISSION FILE DATA:');
  console.log('  Total Affiliates:', commissionData.stats.totalAffiliates);
  console.log('  Total Commission:', commissionData.stats.totalCommission.toLocaleString('id-ID'));
  console.log('  Target Commission:', commissionData.stats.targetCommission.toLocaleString('id-ID'));
  
  // Check database
  const wallets = await prisma.wallet.findMany({
    where: { balance: { gt: 0 } },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { balance: 'desc' }
  });
  
  console.log('\n💰 DATABASE WALLET DATA:');
  console.log('  Total Wallets:', wallets.length);
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  console.log('  Total Balance:', totalBalance.toLocaleString('id-ID'));
  
  // Compare top 5
  console.log('\n🏆 TOP 5 COMPARISON:\n');
  const topFile = commissionData.affiliates
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 5);
  
  for (let i = 0; i < topFile.length; i++) {
    const fileData = topFile[i];
    const dbWallet = wallets.find(w => w.user.email === fileData.email);
    
    console.log(`${i+1}. ${fileData.name} (${fileData.email})`);
    console.log(`   FILE: Rp ${fileData.totalCommission.toLocaleString('id-ID')} | Orders: ${fileData.orderCount}`);
    console.log(`   DB:   Rp ${dbWallet ? dbWallet.balance.toLocaleString('id-ID') : '0'}`);
    console.log(`   Match: ${fileData.totalCommission === Number(dbWallet?.balance) ? '✅ EXACT' : '❌ DIFFERENT'}\n`);
  }
  
  // Check mismatches
  console.log('🔎 CHECKING ALL AFFILIATES FOR MISMATCHES:\n');
  let matches = 0;
  let mismatches = 0;
  
  commissionData.affiliates.forEach(fileAff => {
    const dbWallet = wallets.find(w => w.user.email === fileAff.email);
    if (dbWallet && fileAff.totalCommission === Number(dbWallet.balance)) {
      matches++;
    } else {
      mismatches++;
      if (mismatches <= 5) {
        console.log(`❌ ${fileAff.email}`);
        console.log(`   Expected: Rp ${fileAff.totalCommission.toLocaleString('id-ID')}`);
        console.log(`   Actual: Rp ${dbWallet ? dbWallet.balance.toLocaleString('id-ID') : '0'}\n`);
      }
    }
  });
  
  console.log('\n📊 SUMMARY:');
  console.log('  Exact Matches:', matches);
  console.log('  Mismatches:', mismatches);
  console.log('  Accuracy:', ((matches / (matches + mismatches)) * 100).toFixed(2) + '%');
  
  // Final verdict
  console.log('\n═══════════════════════════════════════');
  if (totalBalance === commissionData.stats.totalCommission) {
    console.log('✅ STATUS: COMMISSION DATA 100% ACCURATE');
  } else {
    console.log('⚠️  STATUS: COMMISSION DATA NEEDS VERIFICATION');
    console.log(`   Difference: Rp ${Math.abs(totalBalance - commissionData.stats.totalCommission).toLocaleString('id-ID')}`);
  }
  console.log('═══════════════════════════════════════');
  
  await prisma.$disconnect();
}

auditCommissions().catch(console.error);
