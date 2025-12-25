const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('Checking all admin users...\n');
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        username: true
      }
    });
    
    if (admins.length > 0) {
      console.log('✅ Admin users found:');
      admins.forEach((admin, i) => {
        console.log(`${i+1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Username: ${admin.username || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No admin users found');
    }
    
    // Also create a simple admin if not exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@eksporyuk.com' }
    });
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@eksporyuk.com',
          name: 'Admin Eksporyuk',
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
          isActive: true
        }
      });
      
      console.log('✅ Created admin user:', newAdmin.email);
      console.log('Login credentials:');
      console.log('Email: admin@eksporyuk.com');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();