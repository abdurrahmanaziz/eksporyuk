const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔍 Checking user dheproject29@gmail.com...');

async function checkUser() {
// Check user dheproject29@gmail.com
const user = await prisma.user.findUnique({
  where: { email: 'dheproject29@gmail.com' }
});

if (!user) {
  console.log('❌ User not found!');
  process.exit(1);
}

console.log('✅ User found:');
console.log('  ID:', user.id);
console.log('  Email:', user.email);
console.log('  Name:', user.name);
console.log('  Role:', user.role);

// Find transactions manually
const transactions = await prisma.transaction.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' },
  take: 10
});

console.log('\n📊 Transaction count by userId:', transactions.length);

if (transactions.length > 0) {
  console.log('\n💳 Recent transactions by userId:');
  transactions.forEach((t, i) => {
    console.log(`  ${i+1}. [${t.id}] ${t.invoiceNumber} - ${t.status}`);
    console.log(`     Amount: Rp ${t.amount.toString()}`);
    console.log(`     Type: ${t.type}`);
    console.log(`     Created: ${t.createdAt.toISOString()}`);
  });
}

// IMPORTANT: Also check by customer email (maybe userId mismatch)
const txByEmail = await prisma.transaction.findMany({
  where: { customerEmail: user.email },
  orderBy: { createdAt: 'desc' },
  take: 10
});

console.log('\n📧 Transaction count by customerEmail:', txByEmail.length);

if (txByEmail.length > 0) {
  console.log('\n💌 Recent transactions by customer email:');
  txByEmail.forEach((t, i) => {
    console.log(`  ${i+1}. [${t.id}] ${t.invoiceNumber} - ${t.status}`);
    console.log(`     UserId: ${t.userId} (should be: ${user.id})`);
    console.log(`     Customer Email: ${t.customerEmail}`);
    console.log(`     Amount: Rp ${t.amount.toString()}`);
    console.log(`     Type: ${t.type}`);
    console.log(`     Created: ${t.createdAt.toISOString()}`);
  });
}

// Find memberships
const memberships = await prisma.userMembership.findMany({
  where: { userId: user.id }
});

console.log('\n🎫 Active memberships:', memberships.filter(m => m.isActive).length);
console.log('🎫 Total memberships:', memberships.length);

// Find products
const products = await prisma.userProduct.findMany({
  where: { userId: user.id }
});

console.log('📦 Products owned:', products.length);

prisma.$disconnect().then(() => process.exit(0));
}

checkUser().catch(console.error);