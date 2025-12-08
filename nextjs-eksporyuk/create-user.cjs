const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating missing users...');

  const usersToCreate = [
    {
      id: 'cmicwesiz0000um0gmy0tcy4r',
      email: 'babycerdas.aghnia@gmail.com',
      name: 'Abdurrahman Aziz',
      role: 'MEMBER_FREE'
    },
    {
      id: 'admin-001',
      email: 'admin@eksporyuk.com',
      name: 'Admin User',
      role: 'ADMIN'
    }
  ];

  for (const userData of usersToCreate) {
    try {
      const existing = await prisma.user.findUnique({
        where: { id: userData.id }
      });

      if (existing) {
        console.log(`✓ User already exists: ${userData.email}`);
      } else {
        const created = await prisma.user.create({
          data: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            emailVerified: false,
            avatar: null
          }
        });
        console.log(`✓ Created user: ${created.email} (${created.id})`);
      }
    } catch (error) {
      console.error(`✗ Error processing user ${userData.email}:`, error.message);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

main().catch(console.error);
