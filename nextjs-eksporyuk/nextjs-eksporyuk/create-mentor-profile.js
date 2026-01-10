const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function createMentor() {
  try {
    // Use first user as sample mentor
    const user = await p.user.findFirst({
      where: { email: 'azizbiasa@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Creating mentor from user:', user.name, user.email);
    
    // Update user role to MENTOR
    await p.user.update({
      where: { id: user.id },
      data: { role: 'MENTOR' }
    });
    console.log('✅ User role updated to MENTOR');
    
    // Create mentor profile with specific ID that courses reference
    const mentorProfile = await p.mentorProfile.upsert({
      where: { id: 'cmj547e5d0004it1e6434w860' },
      update: {
        userId: user.id,
        bio: 'Mentor dan praktisi ekspor dengan pengalaman lebih dari 5 tahun di bidang ekspor.',
        expertise: 'Ekspor Produk UMKM',
        rating: 4.8,
        totalStudents: 1000,
        totalCourses: 2,
        isActive: true
      },
      create: {
        id: 'cmj547e5d0004it1e6434w860',
        userId: user.id,
        bio: 'Mentor dan praktisi ekspor dengan pengalaman lebih dari 5 tahun di bidang ekspor.',
        expertise: 'Ekspor Produk UMKM',
        rating: 4.8,
        totalStudents: 1000,
        totalCourses: 2,
        isActive: true
      }
    });
    
    console.log('✅ MentorProfile created:', mentorProfile.id);
    
    // Verify courses now have valid mentor
    const courses = await p.course.findMany({
      where: { mentorId: 'cmj547e5d0004it1e6434w860' },
      select: { title: true, mentorId: true }
    });
    
    console.log('\n=== COURSES NOW LINKED TO MENTOR ===');
    courses.forEach(c => console.log('  📚', c.title));
    
    console.log('\n✅ DONE! Mentor profile created successfully.');
    console.log('User:', user.name, 'is now a MENTOR for both courses.');
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await p.$disconnect();
  }
}

createMentor();
