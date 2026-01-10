import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating minimal test data...\n');

  try {
    // 1. Create or update mentor user
    const mentor = await prisma.user.upsert({
      where: { email: 'mentor@test.com' },
      update: {
        isOnline: true,
        lastActiveAt: new Date(),
        role: 'MENTOR'
      },
      create: {
        email: 'mentor@test.com',
        name: 'John Mentor',
        password: '$2a$12$hash', // dummy hash
        role: 'MENTOR',
        isOnline: true,
        lastActiveAt: new Date(),
      }
    });

    console.log('✅ Created/updated mentor:', mentor.name);

    // 2. Find or create group
    let group = await prisma.group.findFirst({
      where: { slug: 'komunitas-ekspor-kosmetik' }
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Komunitas Ekspor Kosmetik',
          slug: 'komunitas-ekspor-kosmetik',
          description: 'Grup untuk eksportir produk kecantikan',
          type: 'PUBLIC',
          ownerId: mentor.id
        }
      });
      console.log('✅ Created group:', group.name);
    } else {
      console.log('✅ Found group:', group.name);
    }

    // 3. Add mentor to group
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: mentor.id
        }
      },
      update: {
        role: 'ADMIN'
      },
      create: {
        groupId: group.id,
        userId: mentor.id,
        role: 'ADMIN'
      }
    });

    console.log('✅ Added mentor to group');

    // 4. Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Workshop Export 2025',
        description: 'Workshop strategi ekspor',
        type: 'WORKSHOP',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: 'Jakarta',
        maxAttendees: 50,
        isPublished: true,
        groupId: group.id,
        creatorId: mentor.id
      }
    });

    console.log('✅ Created event:', event.title);
    console.log('\n🎉 Test data ready!');
    console.log('🌐 Visit: http://localhost:3000/community/groups/komunitas-ekspor-kosmetik');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });