const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKopdarUsers() {
  // Get user yang beli Kopdar
  const email = 'intanmargarita@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true }
  });
  
  console.log('User:', user);
  
  // Get SEMUA transaksi user ini
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, status: 'SUCCESS' },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`\nTotal transaksi: ${transactions.length}\n`);
  
  for (const tx of transactions) {
    console.log(`- ${tx.description} (Rp ${tx.amount}) - ${tx.createdAt}`);
  }
  
  // Check membership
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id, status: 'ACTIVE' }
  });
  
  if (membership) {
    const membershipData = await prisma.membership.findUnique({
      where: { id: membership.membershipId }
    });
    console.log(`\nMembership: ${membershipData?.duration}`);
    console.log(`Start: ${membership.startDate}, End: ${membership.endDate}`);
  } else {
    console.log('\nNo active membership');
  }
  
  await prisma.$disconnect();
}

checkKopdarUsers().catch(console.error);
