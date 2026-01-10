const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const membership = await prisma.membership.findUnique({
      where: { id: 'mem_6bulan_ekspor' }
    });
    
    if (membership) {
      console.log('✅ Membership found:');
      console.log({
        id: membership.id,
        name: membership.name,
        price: membership.price,
        duration: membership.duration,
        affiliateCommissionRate: membership.affiliateCommissionRate,
        mailketingListId: membership.mailketingListId,
        autoAddToList: membership.autoAddToList,
      });
    } else {
      console.log('❌ Membership NOT found: mem_6bulan_ekspor');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
