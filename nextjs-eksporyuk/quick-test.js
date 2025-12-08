const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
  try {
    // Test database connection
    console.log('Testing database...');
    
    const userCount = await prisma.user.count();
    console.log(`Users in database: ${userCount}`);
    
    const groupCount = await prisma.group.count();
    console.log(`Groups in database: ${groupCount}`);
    
    // Create quick test mentor
    const testMentor = await prisma.user.upsert({
      where: { email: 'quicktest@mentor.com' },
      update: {
        isOnline: true,
        role: 'MENTOR',
        lastActiveAt: new Date()
      },
      create: {
        email: 'quicktest@mentor.com',
        name: 'Quick Test Mentor',
        password: 'dummy',
        role: 'MENTOR',
        isOnline: true,
        lastActiveAt: new Date()
      }
    });
    
    console.log('✅ Test mentor created/updated:', testMentor.name);
    
    // Check if our target group exists
    let targetGroup = await prisma.group.findFirst({
      where: { slug: 'komunitas-ekspor-kosmetik' }
    });
    
    if (!targetGroup) {
      targetGroup = await prisma.group.create({
        data: {
          name: 'Komunitas Ekspor Kosmetik',
          slug: 'komunitas-ekspor-kosmetik',
          description: 'Test group for sidebar',
          type: 'PUBLIC',
          ownerId: testMentor.id
        }
      });
      console.log('✅ Created target group');
    } else {
      console.log('✅ Target group exists:', targetGroup.name);
    }
    
    // Add mentor to group
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: targetGroup.id,
          userId: testMentor.id
        }
      },
      update: { role: 'ADMIN' },
      create: {
        groupId: targetGroup.id,
        userId: testMentor.id,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Mentor added to group');
    console.log('\nReady to test at: http://localhost:3000/community/groups/komunitas-ekspor-kosmetik');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();