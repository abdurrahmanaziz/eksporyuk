const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...\n');
    
    // Update system admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const updatedAdmin = await prisma.user.update({
      where: { email: 'system@eksporyuk.com' },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Password updated for:', updatedAdmin.email);
    console.log('Login credentials:');
    console.log('Email: system@eksporyuk.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();