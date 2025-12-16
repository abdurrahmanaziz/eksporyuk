const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const plans = await prisma.membership.findMany({ orderBy: { price: 'desc' } });
    console.log('Plans:', plans.map(p => ({id: p.id, name: p.name, duration: p.duration})));
  } catch (e) {
    console.error('Error findMany memberships:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
