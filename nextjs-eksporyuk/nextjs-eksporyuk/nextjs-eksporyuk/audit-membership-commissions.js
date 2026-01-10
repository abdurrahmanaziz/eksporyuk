const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAllMembershipCommissions() {
  try {
    console.log('🔍 AUDIT SEMUA MEMBERSHIP COMMISSION RATES...\n');
    
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      },
      orderBy: { price: 'asc' }
    });
    
    console.log(`Total Active Memberships: ${memberships.length}\n`);
    
    let properCommissions = 0;
    let suspiciousCommissions = 0;
    let zeroCommissions = 0;
    
    memberships.forEach((mem, i) => {
      console.log(`${i+1}. ${mem.name} (${mem.slug})`);
      console.log(`   Price: Rp ${Number(mem.price).toLocaleString('id-ID')}`);
      console.log(`   Commission Rate: ${mem.affiliateCommissionRate}`);
      console.log(`   Commission Type: ${mem.commissionType}`);
      
      // Calculate commission amount
      let commissionAmount = 0;
      if (mem.commissionType === 'PERCENTAGE') {
        commissionAmount = (Number(mem.price) * Number(mem.affiliateCommissionRate)) / 100;
        console.log(`   Commission Amount: Rp ${commissionAmount.toLocaleString('id-ID')} (${mem.affiliateCommissionRate}%)`);
      } else if (mem.commissionType === 'FLAT') {
        commissionAmount = Number(mem.affiliateCommissionRate);
        console.log(`   Commission Amount: Rp ${commissionAmount.toLocaleString('id-ID')} (Fixed)`);
      }
      
      // Check for suspicious rates
      const rate = Number(mem.affiliateCommissionRate);
      if (rate === 0) {
        console.log('   ❌ ZERO COMMISSION - No affiliate reward!');
        zeroCommissions++;
      } else if (rate === 30) {
        console.log('   ⚠️  SUSPICIOUS - Default 30% rate detected!');
        suspiciousCommissions++;
      } else if (mem.commissionType === 'PERCENTAGE' && (rate < 5 || rate > 50)) {
        console.log(`   ⚠️  UNUSUAL - ${rate}% seems too high/low`);
        suspiciousCommissions++;
      } else {
        console.log('   ✅ Proper commission rate');
        properCommissions++;
      }
      console.log('');
    });
    
    console.log('═══════════════════════════════════');
    console.log('📊 COMMISSION AUDIT SUMMARY:');
    console.log(`✅ Proper commissions: ${properCommissions}`);
    console.log(`⚠️  Suspicious commissions: ${suspiciousCommissions}`);
    console.log(`❌ Zero commissions: ${zeroCommissions}`);
    console.log(`📈 Total: ${memberships.length}`);
    
    if (suspiciousCommissions > 0 || zeroCommissions > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('- Review and set proper commission rates');
      console.log('- Remove hardcoded 30% defaults');
      console.log('- Ensure each membership has explicit commission');
    } else {
      console.log('\n🎉 ALL MEMBERSHIPS HAVE PROPER COMMISSIONS!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditAllMembershipCommissions();