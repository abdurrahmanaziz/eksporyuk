const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGradingSystem() {
  console.log('🔍 Checking current data...\n');

  // Get courses
  const courses = await prisma.course.findMany({
    take: 3,
    select: { id: true, title: true }
  });
  console.log(`✓ Courses: ${courses.length}`);
  if (courses.length === 0) {
    console.log('  No courses found');
    process.exit(1);
  }

  // Get assignments
  const assignments = await prisma.assignment.findMany({
    take: 3,
    select: { id: true, title: true, courseId: true, maxScore: true }
  });
  console.log(`✓ Assignments: ${assignments.length}`);

  // If no assignments, create some
  if (assignments.length === 0) {
    console.log('\n📝 Creating test assignments...');
    const course = courses[0];
    for (let i = 1; i <= 2; i++) {
      const assignment = await prisma.assignment.create({
        data: {
          title: `Assignment ${i}`,
          description: `Test assignment ${i}`,
          maxScore: 100,
          courseId: course.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      assignments.push(assignment);
      console.log(`  ✓ Created: ${assignment.title}`);
    }
  }

  // Get submission
  const submissions = await prisma.assignmentSubmission.findMany({
    take: 3,
    select: { id: true, status: true, userId: true }
  });
  console.log(`✓ Assignment Submissions: ${submissions.length}`);

  // If no submissions, create some
  if (submissions.length === 0 && assignments.length > 0) {
    console.log('\n📝 Creating test submissions...');
    
    const users = await prisma.user.findMany({
      take: 2
    });

    if (users.length > 0) {
      for (let i = 0; i < users.length && i < assignments.length; i++) {
        const submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignments[i].id,
            userId: users[i].id,
            content: `Sample submission content from ${users[i].name}`,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        });
        console.log(`  ✓ Created submission for ${users[i].name}`);
      }
    }
  }

  // Now fetch and show submissions
  const allSubmissions = await prisma.assignmentSubmission.findMany({
    take: 5,
    include: {
      user: { select: { name: true, email: true } },
      assignment: { select: { title: true, maxScore: true } }
    }
  });

  console.log(`\n📋 Current Submissions (${allSubmissions.length}):`);
  allSubmissions.forEach((s, i) => {
    console.log(`  ${i+1}. ${s.user.name} - ${s.assignment.title}`);
    console.log(`     Status: ${s.status}, Score: ${s.score || 'N/A'}`);
  });

  process.exit(0);
}

testGradingSystem().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
