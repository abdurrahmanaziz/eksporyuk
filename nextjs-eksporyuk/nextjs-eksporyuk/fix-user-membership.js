const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMembership() {
  const userId = 'cmjqpmirm0000js0497jyiqx1';
  
  // Find the SUCCESS transaction
  const successTx = await prisma.transaction.findFirst({
    where: { userId, type: 'MEMBERSHIP', status: 'SUCCESS' }
  });
  
  console.log('SUCCESS Transaction:', successTx?.id);
  console.log('Description:', successTx?.description);
  
  // Parse metadata
  let membershipId = null;
  if (successTx?.metadata) {
    try {
      const meta = typeof successTx.metadata === 'string' ? JSON.parse(successTx.metadata) : successTx.metadata;
      membershipId = meta.membershipId || meta.priceOption?.membershipId;
    } catch(e) {}
  }
  
  if (!membershipId) {
    // Find by description - Paket 6 Bulan
    const membership = await prisma.membership.findFirst({
      where: { name: { contains: 'Paket 6 Bulan' } }
    });
    membershipId = membership?.id;
    console.log('Found membership:', membership?.name, membershipId);
  }
  
  if (membershipId) {
    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    const now = new Date();
    let endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const um = await prisma.userMembership.create({
      data: {
        id: 'um_' + Date.now(),
        userId,
        membershipId,
        transactionId: successTx.id,
        status: 'ACTIVE',
        isActive: true,
        startDate: now,
        endDate,
        activatedAt: now,
        price: Number(successTx.amount),
        updatedAt: now
      }
    });
    console.log('✅ Created UserMembership:', um.id);
  }
  
  await prisma.$disconnect();
}
createMembership();
