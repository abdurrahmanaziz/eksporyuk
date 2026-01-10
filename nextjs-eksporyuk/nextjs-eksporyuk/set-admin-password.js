const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setAdminPassword() {
  try {
    const email = 'admin@eksporyuk.com';
    const password = 'admin123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update admin password
    const admin = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin password set successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Login URL: http://localhost:3000/auth/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminPassword();