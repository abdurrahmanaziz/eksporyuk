import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  console.log('📊 CURRENT DATABASE STATUS\n');
  
  // Check memberships
  const memberships = await prisma.userMembership.findMany({
    select: { status: true }
  });
  
  const active = memberships.filter(m => m.status === 'ACTIVE').length;
  const expired = memberships.filter(m => m.status === 'EXPIRED').length;
  
  console.log('UserMembership:');
  console.log(`├─ Total: ${memberships.length}`);
  console.log(`├─ ACTIVE: ${active}`);
  console.log(`└─ EXPIRED: ${expired}\n`);
  
  // Check users with MEMBER_FREE role
  const freeUsers = await prisma.user.count({
    where: { role: 'MEMBER_FREE' }
  });
  
  console.log(`Users with MEMBER_FREE role: ${freeUsers}`);
  
  // Check transactions
  const successTx = await prisma.transaction.count({
    where: { status: 'SUCCESS' }
  });
  
  console.log(`SUCCESS transactions: ${successTx}\n`);
  
  await prisma.$disconnect();
}

checkStatus();
