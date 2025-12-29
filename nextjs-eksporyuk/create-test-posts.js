const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const createId = () => crypto.randomBytes(16).toString('hex');

(async () => {
  try {
    // Get or create test user
    let testUser = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          id: createId(),
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed_password',
          role: 'MEMBER_FREE',
          isActive: true,
        }
      });
    }
    
    console.log('Test user:', testUser.id);
    console.log('Creating sample posts...');
    
    // Create 3 sample posts
    for (let i = 0; i < 3; i++) {
      const post = await prisma.post.create({
        data: {
          id: createId(),
          content: `Ini adalah postingan uji coba #${i + 1}. Postingan ini dibuat untuk menguji fitur feed komunitas.`,
          authorId: testUser.id,
          type: 'POST',
          approvalStatus: 'APPROVED',
          updatedAt: new Date(),
        }
      });
      console.log('✓ Created post:', post.id);
    }
    
    const totalPosts = await prisma.post.count();
    console.log('\n✓ Total posts now:', totalPosts);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
