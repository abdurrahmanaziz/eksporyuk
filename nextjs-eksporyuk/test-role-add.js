const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

async function main() {
  // Get a sample user to test
  const user = await prisma.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' },
    select: { id: true, name: true, role: true, userRoles: true }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', user.name);
  console.log('Current Role:', user.role);
  console.log('Existing UserRoles:', user.userRoles);
  
  // Check if MENTOR role already exists
  const existingMentor = user.userRoles?.find(r => r.role === 'MENTOR');
  if (existingMentor) {
    console.log('\nMENTOR role already exists');
    return;
  }
  
  // Test creating a UserRole
  try {
    const newRole = await prisma.userRole.create({
      data: {
        id: `role_${nanoid()}`,
        userId: user.id,
        role: 'MENTOR',
      }
    });
    console.log('\n✅ MENTOR role created successfully!');
    console.log('New UserRole ID:', newRole.id);
  } catch (e) {
    console.log('\n❌ Error:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
