import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'abdurrahmanazizsultan@gmail.com';
  
  console.log(`\n📧 Checking user: ${email}\n`);
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log('👤 User Info:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email Verified: ${user.emailVerified}`);
  console.log(`   Created: ${user.createdAt}`);
  
  // Check memberships using Prisma
  try {
    const membershipsViaModel = await prisma.$queryRaw`
      SELECT 
        um.id, 
        um.membershipId, 
        um.status,
        um.isActive,
        um.startDate,
        um.endDate,
        m.name
      FROM "UserMembership" um
      LEFT JOIN "Membership" m ON um.membershipId = m.id
      WHERE um.userId = ${user.id}
    `;
    
    console.log('\n💳 Memberships:');
    if (membershipsViaModel.length === 0) {
      console.log('   None');
    } else {
      membershipsViaModel.forEach((m) => {
        console.log(`   - ${m.name} (ID: ${m.id})`);
        console.log(`     Status: ${m.status}, Active: ${m.isActive}`);
        console.log(`     Start: ${m.startDate}, End: ${m.endDate}`);
      });
    }
  } catch (e) {
    console.log('\n💳 Memberships: Error querying -', e.message);
  }
  
  // Check wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id }
  });
  
  console.log('\n💵 Wallet:');
  if (!wallet) {
    console.log('   No wallet found');
  } else {
    console.log(`   Balance: ${wallet.balance}`);
    console.log(`   Pending: ${wallet.balancePending}`);
  }
  
  // Check all models for this user
  console.log('\n📊 Direct Query - All tables containing user:');
  
  const allUserData = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table'
  `;
  
  console.log('Tables found:', allUserData.map(t => t.name).join(', '));
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
