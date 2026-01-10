const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembershipCommission() {
  console.log('🔍 Checking Membership Commission Configuration\n');
  
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
  });
  
  console.log(`Found ${memberships.length} active memberships:\n`);
  
  memberships.forEach(m => {
    console.log(`📋 ${m.name}`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Price: Rp ${Number(m.price).toLocaleString()}`);
    console.log(`   affiliateCommissionRate: ${m.affiliateCommissionRate}`);
    console.log(`   commissionType: ${m.commissionType}`);
    console.log(`   rawCommissionType type: ${typeof m.commissionType}`);
    console.log('');
  });
  
  // Check if type is null/undefined
  const needsFix = memberships.filter(m => !m.commissionType);
  
  if (needsFix.length > 0) {
    console.log(`⚠️  ${needsFix.length} memberships need commission type fix\n`);
    console.log('💡 Recommended fix:');
    console.log('   Set commissionType = "FLAT" for all');
    console.log('   Keep affiliateCommissionRate values as-is (they represent Rupiah amount)\n');
    
    console.log('Run with FIX=true to apply: FIX=true node check-membership-commission.js\n');
    
    if (process.env.FIX === 'true') {
      console.log('🔧 Applying fix...\n');
      
      for (const membership of needsFix) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            commissionType: 'FLAT',
          },
        });
        
        console.log(`✅ Fixed: ${membership.name} - Set type to FLAT`);
      }
      
      console.log('\n✅ All memberships fixed!');
    }
  } else {
    console.log('✅ All memberships have proper commission type configuration');
  }
  
  await prisma.$disconnect();
}

checkMembershipCommission().catch(console.error);
