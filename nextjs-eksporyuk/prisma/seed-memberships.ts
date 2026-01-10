import { seedMembershipPlans } from './seeders/membership-plans';

async function main() {
  console.log('🚀 Starting membership plans seeder...\n');
  
  try {
    await seedMembershipPlans();
    console.log('\n🎉 All done!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
