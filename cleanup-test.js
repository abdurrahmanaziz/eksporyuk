const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete UserMemberships we created for manual test
    const deleted = await prisma.userMembership.deleteMany({
      where: { id: { startsWith: 'um_txn_1768036141053' } }
    });

    console.log(`✅ Deleted ${deleted.count} test UserMemberships`);

    // Revert user role back to MEMBER_FREE
    const user = await prisma.user.update({
      where: { id: 'cae2eab3-e653-40e9-893d-2e98994ba004' },
      data: { role: 'MEMBER_FREE' }
    });

    console.log(`✅ Reverted user role to: ${user.role}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
