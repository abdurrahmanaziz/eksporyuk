const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Normalisasi field Membership.duration...');
  try {
    // Gunakan SQL mentah supaya tidak gagal di deserialisasi enum Prisma
    const res = await prisma.$executeRawUnsafe(`
      UPDATE "Membership"
      SET "duration" = CASE 
        WHEN "duration" = 'ONE_MONTH' THEN 'SIX_MONTHS'
        WHEN "duration" = 'THREE_MONTHS' THEN 'SIX_MONTHS'
        WHEN "duration" = 'TWELVE_MONTH' THEN 'TWELVE_MONTHS'
        ELSE "duration"
      END
      WHERE "duration" IN ('ONE_MONTH','THREE_MONTHS','TWELVE_MONTH');
    `);
    console.log('Updated rows:', res);
  } catch (e) {
    console.error('Gagal update durasi via SQL:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
