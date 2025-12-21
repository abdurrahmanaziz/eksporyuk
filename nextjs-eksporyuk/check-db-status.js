const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Checking database...\n');
  
  // Check memberships
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true, duration: true }
  });
  console.log('Memberships in DB:', memberships.length);
  memberships.forEach(m => {
    console.log(`  - ${m.slug}: ${m.name} (${m.duration} days)`);
  });
  
  // Check transactions
  const txCount = await prisma.transaction.count({
    where: { paymentProvider: 'SEJOLI' }
  });
  console.log(`\nSejoli Transactions: ${txCount}`);
  
  // Check users
  const userCount = await prisma.user.count();
  const premiumCount = await prisma.user.count({
    where: { role: 'MEMBER_PREMIUM' }
  });
  console.log(`\nUsers: ${userCount}`);
  console.log(`Premium Users: ${premiumCount}`);
  
  // Sample invoice
  const sample = await prisma.transaction.findFirst({
    where: { invoiceNumber: { not: null } },
    select: { invoiceNumber: true, externalId: true }
  });
  console.log(`\nSample Invoice: ${sample?.invoiceNumber} (${sample?.externalId})`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
