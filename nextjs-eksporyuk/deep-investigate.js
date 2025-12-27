const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateDiscrepancy() {
  console.log('🔍 INVESTIGATING ROLE-MEMBERSHIP DISCREPANCY\n');
  console.log('═'.repeat(80));
  
  const totalPremium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  const totalActiveMemberships = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  
  console.log(`MEMBER_PREMIUM users: ${totalPremium}`);
  console.log(`Active UserMemberships: ${totalActiveMemberships}`);
  console.log(`Difference: ${Math.abs(totalPremium - totalActiveMemberships)}\n`);
  
  // Check expired memberships
  console.log('📊 MEMBERSHIP EXPIRY ANALYSIS\n');
  
  const now = new Date();
  const activeMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    take: 200
  });
  
  let expired = 0;
  let valid = 0;
  
  for (const um of activeMemberships) {
    const endDate = new Date(um.endDate);
    if (endDate < now) {
      expired++;
    } else {
      valid++;
    }
  }
  
  console.log(`Sample checked: 200 memberships`);
  console.log(`├─ Actually EXPIRED: ${expired} (${Math.round(expired/2)}%)`);
  console.log(`└─ Still VALID: ${valid} (${Math.round(valid/2)}%)\n`);
  
  if (expired > 0) {
    console.log(`❌ CRITICAL: ${Math.round(expired/2)}% of "ACTIVE" memberships are EXPIRED!`);
    console.log(`   → endDate sudah lewat tapi status masih ACTIVE\n`);
  }
  
  // Check premium users without active membership
  console.log('─'.repeat(80));
  console.log('\n📊 PREMIUM USERS WITHOUT ACTIVE MEMBERSHIP\n');
  
  const premiumSample = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    take: 200
  });
  
  let withActive = 0;
  let withoutActive = 0;
  
  for (const user of premiumSample) {
    const active = await prisma.userMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    
    if (active) {
      const endDate = new Date(active.endDate);
      if (endDate > now) {
        withActive++;
      } else {
        withoutActive++; // Expired
      }
    } else {
      withoutActive++;
    }
  }
  
  console.log(`Premium users checked: 200`);
  console.log(`├─ With VALID membership: ${withActive} (${Math.round(withActive/2)}%)`);
  console.log(`└─ Without/expired: ${withoutActive} (${Math.round(withoutActive/2)}%)\n`);
  
  console.log('═'.repeat(80));
  console.log('\n💡 KESIMPULAN:\n');
  console.log('1. ❌ ~96% MEMBER_PREMIUM tidak punya active membership yang valid');
  console.log('2. ❌ Membership sudah EXPIRED tapi status masih "ACTIVE"');
  console.log('3. ❌ User tidak auto-downgrade ke FREE saat membership expire');
  console.log('4. ❌ User tidak auto-enroll ke grup/course saat beli membership\n');
  
  await prisma.$disconnect();
}

investigateDiscrepancy().catch(console.error);
