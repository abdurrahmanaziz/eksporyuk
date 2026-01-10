/**
 * Fix Group & Course Access for Premium Members
 * 
 * This script adds premium members to their appropriate groups and courses
 * based on their membership type.
 * 
 * Problem found:
 * - User abdurrahmanazizsultan@gmail.com bought Paket 6 Bulan
 * - Membership ACTIVE, Transaction SUCCESS
 * - But NO GROUP ACCESS and NO COURSE ACCESS
 * 
 * Root cause:
 * - Admin confirm API was not running auto-join group/course logic
 * - Now fixed, but existing users need to be patched
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const prisma = new PrismaClient();

const createId = () => randomBytes(16).toString('hex');

async function fixAccess() {
  console.log('=== FIX GROUP & COURSE ACCESS FOR PREMIUM MEMBERS ===\n');
  
  // 1. Get all ACTIVE memberships
  const activeMemberships = await prisma.userMembership.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true
    },
    select: {
      userId: true,
      membershipId: true
    }
  });
  
  console.log(`Found ${activeMemberships.length} active memberships to check\n`);
  
  let groupsAdded = 0;
  let coursesAdded = 0;
  let usersFixed = 0;
  let errors = 0;
  
  for (let i = 0; i < activeMemberships.length; i++) {
    const um = activeMemberships[i];
    let userFixed = false;
    
    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: um.membershipId },
      select: { id: true, name: true }
    });
    
    if (!membership) continue;
    
    // ===== FIX GROUPS =====
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: membership.id }
    });
    
    for (const mg of membershipGroups) {
      try {
        const existing = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: mg.groupId,
              userId: um.userId
            }
          }
        });
        
        if (!existing) {
          await prisma.groupMember.create({
            data: {
              id: createId(),
              groupId: mg.groupId,
              userId: um.userId,
              role: 'MEMBER'
            }
          });
          groupsAdded++;
          userFixed = true;
        }
      } catch (err) {
        errors++;
      }
    }
    
    // ===== FIX COURSES =====
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: membership.id }
    });
    
    for (const mc of membershipCourses) {
      try {
        const existing = await prisma.courseEnrollment.findFirst({
          where: {
            courseId: mc.courseId,
            userId: um.userId
          }
        });
        
        if (!existing) {
          await prisma.courseEnrollment.create({
            data: {
              id: createId(),
              courseId: mc.courseId,
              userId: um.userId,
              updatedAt: new Date()
            }
          });
          coursesAdded++;
          userFixed = true;
        }
      } catch (err) {
        errors++;
      }
    }
    
    if (userFixed) usersFixed++;
    
    // Progress every 100
    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1}/${activeMemberships.length}...`);
    }
  }
  
  console.log('\n=== RESULT ===');
  console.log(`Users fixed: ${usersFixed}`);
  console.log(`Group memberships added: ${groupsAdded}`);
  console.log(`Course enrollments added: ${coursesAdded}`);
  console.log(`Errors: ${errors}`);
  
  // Verify specific user
  console.log('\n=== VERIFY: abdurrahmanazizsultan@gmail.com ===');
  const user = await prisma.user.findUnique({
    where: { email: 'abdurrahmanazizsultan@gmail.com' }
  });
  
  if (user) {
    const groups = await prisma.groupMember.findMany({
      where: { userId: user.id }
    });
    const courses = await prisma.courseEnrollment.findMany({
      where: { userId: user.id }
    });
    
    console.log(`Groups: ${groups.length}`);
    for (const g of groups) {
      const group = await prisma.group.findUnique({ where: { id: g.groupId }, select: { name: true }});
      console.log(`  ✅ ${group?.name}`);
    }
    
    console.log(`Courses: ${courses.length}`);
    for (const c of courses) {
      const course = await prisma.course.findUnique({ where: { id: c.courseId }, select: { title: true }});
      console.log(`  ✅ ${course?.title}`);
    }
  }
  
  await prisma.$disconnect();
}

fixAccess().catch(console.error);
