const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'abdurrahmanazizsultan@gmail.com';
  
  console.log(`\n📧 Checking user: ${email}\n`);
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userMemberships: true,
      transactions: { take: 10 },
      invoices: { take: 10 }
    }
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
  
  console.log('\n💳 Memberships:');
  if (user.userMemberships.length === 0) {
    console.log('   None');
  } else {
    user.userMemberships.forEach(m => {
      console.log(`   - ID: ${m.id}`);
      console.log(`     Membership ID: ${m.membershipId}`);
      console.log(`     Status: ${m.status}`);
      console.log(`     Active: ${m.isActive}`);
      console.log(`     Start: ${m.startDate}`);
      console.log(`     End: ${m.endDate}`);
    });
  }
  
  console.log('\n💰 Transactions:');
  if (user.transactions.length === 0) {
    console.log('   None');
  } else {
    user.transactions.forEach(t => {
      console.log(`   - ID: ${t.id}`);
      console.log(`     Type: ${t.type}`);
      console.log(`     Amount: ${t.amount}`);
      console.log(`     Status: ${t.status}`);
      console.log(`     Created: ${t.createdAt}`);
    });
  }
  
  console.log('\n📄 Invoices:');
  if (user.invoices.length === 0) {
    console.log('   None');
  } else {
    user.invoices.forEach(inv => {
      console.log(`   - ID: ${inv.id}`);
      console.log(`     Amount: ${inv.amount}`);
      console.log(`     Status: ${inv.status}`);
      console.log(`     Created: ${inv.createdAt}`);
    });
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
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
