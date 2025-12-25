const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin password
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@eksporyuk.com' },
      data: {
        password: hashedPassword,
        isActive: true
      }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('Login credentials:');
    console.log('Email: admin@eksporyuk.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

setAdminPassword();