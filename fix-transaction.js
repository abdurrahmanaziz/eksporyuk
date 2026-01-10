const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const txn = await prisma.transaction.update({
      where: { id: 'txn_1768036141053_lk8d7r75lh' },
      data: { membershipId: 'mem_6bulan_ekspor' }
    });

    console.log('✅ Transaction updated:');
    console.log(`  ID: ${txn.id}`);
    console.log(`  MembershipId: ${txn.membershipId}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
