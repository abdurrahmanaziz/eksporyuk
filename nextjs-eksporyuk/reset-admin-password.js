const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Finding admin users...\n');
    
    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, password: true, isActive: true }
    });
    
    console.log('Found', admins.length, 'admin users:');
    admins.forEach(a => {
      console.log('- Email:', a.email);
      console.log('  Name:', a.name);
      console.log('  Has Password:', a.password ? 'YES' : 'NO');
      console.log('  Is Active:', a.isActive);
      console.log('');
    });
    
    // Hash new password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update all admin passwords
    for (const admin of admins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword, isActive: true }
      });
      console.log('Updated password for:', admin.email);
    }
    
    console.log('\nAll admin passwords reset to: admin123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();