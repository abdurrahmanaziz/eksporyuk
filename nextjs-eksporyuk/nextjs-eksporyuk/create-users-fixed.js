const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 CREATE MISSING USERS FIXED');
  console.log('═'.repeat(60));
  
  const usersToCreate = JSON.parse(fs.readFileSync('users-to-create.json', 'utf-8'));
  console.log(`Users to create: ${usersToCreate.length}`);
  
  const defaultPassword = await bcrypt.hash('Eksporyuk123!', 10);
  
  let created = 0;
  let skippedExists = 0;
  let errors = 0;
  
  for (let i = 0; i < usersToCreate.length; i++) {
    const user = usersToCreate[i];
    
    try {
      // Check if exists by email
      const exists = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() }
      });
      
      if (exists) {
        skippedExists++;
        continue;
      }
      
      // Generate unique username
      let baseUsername = (user.login || user.email.split('@')[0])
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .substring(0, 20);
      
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = 'user' + user.sejoliUserId;
      }
      
      // Check if username exists, add suffix if needed
      let username = baseUsername;
      let suffix = 1;
      while (true) {
        const usernameExists = await prisma.user.findUnique({
          where: { username: username }
        });
        if (!usernameExists) break;
        username = `${baseUsername}${suffix}`;
        suffix++;
        if (suffix > 100) {
          username = `${baseUsername}_${Date.now()}`;
          break;
        }
      }
      
      await prisma.user.create({
        data: {
          email: user.email.toLowerCase().trim(),
          name: user.name || user.login || user.email.split('@')[0],
          username: username,
          password: defaultPassword,
          role: 'MEMBER_FREE',
          isActive: true,
          sejoliUserId: parseInt(user.sejoliUserId) || null
        }
      });
      
      created++;
      
      if (created % 50 === 0) {
        console.log(`Created: ${created}/${usersToCreate.length}`);
      }
    } catch (err) {
      errors++;
      console.log(`Error for ${user.email}: ${err.message}`);
    }
  }
  
  console.log(`\n✅ Results:`);
  console.log(`   Created: ${created}`);
  console.log(`   Already exists: ${skippedExists}`);
  console.log(`   Errors: ${errors}`);
  
  // Get new total users
  const totalUsers = await prisma.user.count();
  console.log(`\n   Total Users Now: ${totalUsers}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
