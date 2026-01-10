const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUserIssues() {
  console.log('🔍 INVESTIGASI MASALAH USER DUPLICATE\n');
  
  try {
    // 1. Cari semua user dengan email azizbiasa@gmail.com
    const azizUsers = await prisma.user.findMany({
      where: { email: 'azizbiasa@gmail.com' },
      include: { wallet: true }
    });
    
    console.log(`USERS DENGAN EMAIL azizbiasa@gmail.com: ${azizUsers.length}`);
    azizUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString('id-ID')}`);
      if (user.wallet) {
        console.log(`   Balance: Rp ${parseFloat(user.wallet.balance).toLocaleString('id-ID')}`);
      } else {
        console.log(`   No wallet`);
      }
    });
    
    // 2. Cari user dengan nama Sambung Dakwah
    const sambungUsers = await prisma.user.findMany({
      where: { name: { contains: 'Sambung Dakwah', mode: 'insensitive' } },
      include: { wallet: true }
    });
    
    console.log(`\nUSERS DENGAN NAMA SAMBUNG DAKWAH: ${sambungUsers.length}`);
    sambungUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      if (user.wallet) {
        console.log(`   Balance: Rp ${parseFloat(user.wallet.balance).toLocaleString('id-ID')}`);
      }
    });
    
    // 3. Cari user dengan nama Abdurrahman Aziz
    const abdurrahmanUsers = await prisma.user.findMany({
      where: { name: { contains: 'Abdurrahman Aziz', mode: 'insensitive' } },
      include: { wallet: true }
    });
    
    console.log(`\nUSERS DENGAN NAMA ABDURRAHMAN AZIZ: ${abdurrahmanUsers.length}`);
    abdurrahmanUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      if (user.wallet) {
        console.log(`   Balance: Rp ${parseFloat(user.wallet.balance).toLocaleString('id-ID')}`);
      }
    });
    
    // 4. Check for all AFFILIATE users
    const affiliateUsers = await prisma.user.findMany({
      where: { role: 'AFFILIATE' },
      include: { wallet: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nALL AFFILIATE USERS: ${affiliateUsers.length}`);
    affiliateUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString('id-ID')}`);
      if (user.wallet) {
        console.log(`   Balance: Rp ${parseFloat(user.wallet.balance).toLocaleString('id-ID')}`);
      }
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

findUserIssues();