const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating sample data for GroupSidebar testing...\n');

  // 1. Create sample mentor user
  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor@test.com' },
    update: {
      isOnline: true,
      lastActiveAt: new Date(),
      role: 'MENTOR'
    },
    create: {
      email: 'mentor@test.com',
      name: 'John Mentor',
      password: 'hashedpassword',
      role: 'MENTOR',
      isOnline: true,
      lastActiveAt: new Date(),
      avatar: 'https://ui-avatars.com/api/?name=John+Mentor&background=0D8ABC&color=fff'
    }
  });

  console.log('✅ Created mentor user:', mentorUser.name);

  // 2. Create mentor profile
  await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {
      expertise: 'Digital Marketing & Export Strategy',
      bio: 'Experienced mentor in international trade'
    },
    create: {
      userId: mentorUser.id,
      expertise: 'Digital Marketing & Export Strategy',
      bio: 'Experienced mentor in international trade',
      hourlyRate: 150000,
      availableHours: 40
    }
  });

  console.log('✅ Created mentor profile');

  // 3. Find the group
  const group = await prisma.group.findFirst({
    where: { slug: 'komunitas-ekspor-kosmetik' }
  });

  if (!group) {
    console.log('❌ Group not found, creating...');
    const newGroup = await prisma.group.create({
      data: {
        name: 'Komunitas Ekspor Kosmetik',
        slug: 'komunitas-ekspor-kosmetik',
        description: 'Grup untuk eksportir produk kecantikan dan kosmetik',
        type: 'PUBLIC',
        ownerId: mentorUser.id,
        avatar: 'https://ui-avatars.com/api/?name=Komunitas+Ekspor&background=FF6B6B&color=fff'
      }
    });
    console.log('✅ Created group:', newGroup.name);
  } else {
    console.log('✅ Group found:', group.name);
  }

  const targetGroup = group || await prisma.group.findFirst({
    where: { slug: 'komunitas-ekspor-kosmetik' }
  });

  // 4. Add mentor to group
  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: targetGroup.id,
        userId: mentorUser.id
      }
    },
    update: {
      role: 'ADMIN'
    },
    create: {
      groupId: targetGroup.id,
      userId: mentorUser.id,
      role: 'ADMIN'
    }
  });

  console.log('✅ Added mentor to group as ADMIN');

  // 5. Create sample event
  const event = await prisma.event.create({
    data: {
      title: 'Workshop Export Strategy 2025',
      description: 'Learn the latest export strategies for cosmetic products',
      type: 'WORKSHOP',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
      location: 'Jakarta Convention Center',
      maxAttendees: 50,
      isPublished: true,
      groupId: targetGroup.id,
      creatorId: mentorUser.id
    }
  });

  console.log('✅ Created sample event:', event.title);

  // 6. Create another mentor for variety
  const mentor2 = await prisma.user.upsert({
    where: { email: 'sarah.mentor@test.com' },
    update: {
      isOnline: false,
      lastActiveAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      role: 'MENTOR'
    },
    create: {
      email: 'sarah.mentor@test.com',
      name: 'Sarah Export Expert',
      password: 'hashedpassword',
      role: 'MENTOR',
      isOnline: false,
      lastActiveAt: new Date(Date.now() - 10 * 60 * 1000),
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Expert&background=9C27B0&color=fff'
    }
  });

  await prisma.mentorProfile.upsert({
    where: { userId: mentor2.id },
    update: {
      expertise: 'International Business & Regulations',
      bio: 'Expert in export regulations and compliance'
    },
    create: {
      userId: mentor2.id,
      expertise: 'International Business & Regulations',
      bio: 'Expert in export regulations and compliance',
      hourlyRate: 200000,
      availableHours: 30
    }
  });

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: targetGroup.id,
        userId: mentor2.id
      }
    },
    update: {
      role: 'MODERATOR'
    },
    create: {
      groupId: targetGroup.id,
      userId: mentor2.id,
      role: 'MODERATOR'
    }
  });

  console.log('✅ Created second mentor:', mentor2.name);

  // 7. Create admin user for testing
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (adminUser) {
    // Add admin to group
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: targetGroup.id,
          userId: adminUser.id
        }
      },
      update: {},
      create: {
        groupId: targetGroup.id,
        userId: adminUser.id,
        role: 'MEMBER'
      }
    });
    console.log('✅ Added admin user to group');
  }

  console.log('\n🎉 Sample data created successfully!');
  console.log('📋 Summary:');
  console.log(`   • Group: ${targetGroup.name}`);
  console.log(`   • Mentors: 2 (1 online, 1 offline)`);
  console.log(`   • Events: 1 upcoming workshop`);
  console.log(`   • Group Members: ${await prisma.groupMember.count({ where: { groupId: targetGroup.id } })}`);
  console.log('\n🌐 Test at: http://localhost:3000/community/groups/komunitas-ekspor-kosmetik');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });