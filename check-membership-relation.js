import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js';
const p = new PrismaClient();

async function check() {
  // Cek apakah Membership dengan ID mem_6bulan_ekspor ada
  const membership = await p.membership.findUnique({
    where: { id: 'mem_6bulan_ekspor' }
  });
  
  if (membership) {
    console.log('✅ MEMBERSHIP PACKAGE DITEMUKAN:');
    console.log(JSON.stringify(membership, null, 2));
  } else {
    console.log('❌ MEMBERSHIP PACKAGE TIDAK DITEMUKAN!');
    console.log('UserMembership punya membershipId: mem_6bulan_ekspor');
    console.log('Tapi tabel Membership TIDAK punya record dengan ID ini!');
    console.log('\nINI AKAR MASALAHNYA! Foreign key rusak!');
  }
  
  await p.$disconnect();
}

check();
