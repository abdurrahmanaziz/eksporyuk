const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@eksporyuk.com' },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true,
      password: true,
      isActive: true,
      isSuspended: true
    }
  });
  
  if (!admin) {
    console.log('❌ User tidak ditemukan!');
    return;
  }
  
  console.log('📊 Data Admin:');
  console.log('  Email:', admin.email);
  console.log('  Name:', admin.name);
  console.log('  Role:', admin.role);
  console.log('  isActive:', admin.isActive);
  console.log('  isSuspended:', admin.isSuspended);
  console.log('  Has password:', !!admin.password);
  console.log('');
  
  // Test password
  const testPassword = 'Admin123!';
  const isValid = await bcrypt.compare(testPassword, admin.password);
  
  console.log('🔑 Password Test:');
  console.log('  Test password:', testPassword);
  console.log('  Match:', isValid ? '✅ VALID' : '❌ INVALID');
  console.log('');
  
  if (!isValid) {
    console.log('🔧 Resetting password...');
    const newHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: newHash }
    });
    console.log('✅ Password di-reset ke: Admin123!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
