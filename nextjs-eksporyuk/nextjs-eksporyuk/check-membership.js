import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js';
const p = new PrismaClient();

async function check() {
  const user = await p.user.findFirst({ 
    where: { email: 'abdurrahmanazizsultan@gmail.com' } 
  });
  
  if (!user) {
    console.log('❌ User tidak ditemukan');
    await p.$disconnect();
    return;
  }
  
  console.log('✅ User ID:', user.id);
  
  const membership = await p.userMembership.findFirst({
    where: { 
      userId: user.id, 
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    }
  });
  
  if (membership) {
    console.log('✅ MEMBERSHIP AKTIF DITEMUKAN:', membership);
  } else {
    console.log('❌ TIDAK ADA MEMBERSHIP AKTIF - INI MASALAHNYA!');
    console.log('User belum punya membership, makanya redirect ke checkout');
  }
  
  await p.$disconnect();
}

check();
