import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      update: {},
      create: {
        email: 'admin@eksporyuk.com',
        name: 'Admin Eksporyuk',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      }
    });
    
    console.log('✅ Admin created:', admin.email, admin.id);
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        siteTitle: 'Eksporyuk',
        siteDescription: 'Platform Ekspor Indonesia',
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
      }
    });
    
    console.log('✅ Settings created:', settings.id);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
