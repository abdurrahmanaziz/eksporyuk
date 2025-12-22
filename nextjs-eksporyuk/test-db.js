const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');
    const plans = await prisma.membership.findMany({ take: 3 });
    console.log('SUCCESS! Found', plans.length, 'membership plans');
    plans.forEach(p => console.log('  -', p.name));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
