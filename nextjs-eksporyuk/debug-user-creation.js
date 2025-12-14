const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debug() {
  const usersToCreate = JSON.parse(fs.readFileSync('users-to-create.json', 'utf-8'));
  console.log(`Users to create: ${usersToCreate.length}`);
  
  // Try creating first user
  const user = usersToCreate[0];
  console.log('\nFirst user:', user);
  
  // Check if email exists
  const byEmail = await prisma.user.findUnique({ where: { email: user.email } });
  console.log('Exists by email:', !!byEmail);
  
  // Check if username exists
  const username = user.login || user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  console.log('Username would be:', username);
  
  const byUsername = await prisma.user.findUnique({ where: { username: username } });
  console.log('Exists by username:', !!byUsername);
  
  // Try create with unique username
  try {
    const result = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name || 'Test User',
        username: `${username}_${Date.now()}`,
        password: await bcrypt.hash('Test123!', 10),
        role: 'MEMBER_FREE',
        isActive: true
      }
    });
    console.log('Created successfully:', result.id);
    
    // Delete test user
    await prisma.user.delete({ where: { id: result.id } });
    console.log('Test user deleted');
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  await prisma.$disconnect();
}

debug();
