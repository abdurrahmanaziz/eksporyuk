import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js';
const p = new PrismaClient();

async function testCalculate() {
  const userId = 'cmjqpmirm0000js0497jyiqx1';
  
  // Get current membership (sama seperti di API)
  const currentMembership = await p.userMembership.findFirst({
    where: {
      userId: userId,
      isActive: true,
      endDate: { gte: new Date() }
    },
    orderBy: { endDate: 'desc' }
  });
  
  console.log('Current Membership:', currentMembership);
  
  if (!currentMembership) {
    console.log('No membership found');
    await p.$disconnect();
    return;
  }
  
  // Get membership package
  const currentPackage = await p.membership.findUnique({
    where: { id: currentMembership.membershipId }
  });
  
  console.log('\nCurrent Package:', currentPackage);
  
  // Get target (12 bulan)
  const targetPackage = await p.membership.findFirst({
    where: { 
      slug: 'paket-12-bulan',
      isActive: true 
    }
  });
  
  console.log('\nTarget Package:', targetPackage);
  
  if (!targetPackage) {
    console.log('Target package tidak ditemukan!');
  }
  
  await p.$disconnect();
}

testCalculate();
