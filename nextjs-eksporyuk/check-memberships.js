const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      name: true,
      price: true
    },
    orderBy: { name: 'asc' }
  });
  
  console.log('Memberships in database:');
  memberships.forEach((m, i) => {
    const hasEmptyId = !m.id || m.id === '';
    console.log((i+1) + '. id=' + m.id + ' name=' + m.name + ' (empty: ' + hasEmptyId + ')');
  });
  
  await prisma.$disconnect();
}
main().catch(console.error);
