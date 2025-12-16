const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cek distinct duration di tabel Membership...');
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT DISTINCT "duration", COUNT(*) as cnt FROM "Membership" GROUP BY "duration"`);
    console.log(rows);
  } catch (e) {
    console.error('Query gagal:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
