/**
 * AUTO-ENROLL EXISTING MEMBERS
 * 
 * Script ini akan:
 * 1. Cari semua UserMembership yang ACTIVE
 * 2. Cek apakah user sudah join grup/course yang seharusnya
 * 3. Auto-enroll jika belum
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoEnrollExistingMembers() {
  console.log('🔄 AUTO-ENROLL EXISTING MEMBERS\n');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Get all active memberships
    const activeMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`Found ${activeMemberships.length} active memberships\n`);
    console.log('Processing...\n');
    
    let totalGroupsAdded = 0;
    let totalCoursesEnrolled = 0;
    let totalProductsGranted = 0;
    let usersProcessed = 0;
    
    for (const um of activeMemberships) {
      usersProcessed++;
      
      if (usersProcessed % 100 === 0) {
        console.log(`   Processed ${usersProcessed}/${activeMemberships.length}...`);
      }
      
      // Get membership details
      const membership = await prisma.membership.findUnique({
        where: { id: um.membershipId }
      });
      
      if (!membership) continue;
      
      // Get assigned groups
      const membershipGroups = await prisma.membershipGroup.findMany({
        where: { membershipId: um.membershipId }
      });
      
      for (const mg of membershipGroups) {
        // Check if already member
        const existing = await prisma.groupMember.findFirst({
          where: {
            groupId: mg.groupId,
            userId: um.userId
          }
        });
        
        if (!existing) {
          // Add to group
          try {
            await prisma.groupMember.create({
              data: {
                id: `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                groupId: mg.groupId,
                userId: um.userId,
                role: 'MEMBER',
                joinedAt: new Date()
              }
            });
            totalGroupsAdded++;
          } catch (error) {
            // Ignore duplicates
          }
        }
      }
      
      // Get assigned courses
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId: um.membershipId }
      });
      
      for (const mc of membershipCourses) {
        // Check if already enrolled
        const existing = await prisma.courseEnrollment.findFirst({
          where: {
            courseId: mc.courseId,
            userId: um.userId
          }
        });
        
        if (!existing) {
          // Enroll in course
          try {
            await prisma.courseEnrollment.create({
              data: {
                id: `ce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: um.userId,
                courseId: mc.courseId,
                enrolledAt: new Date(),
                status: 'ACTIVE',
                progress: 0
              }
            });
            totalCoursesEnrolled++;
          } catch (error) {
            // Ignore duplicates
          }
        }
      }
      
      // Get assigned products
      const membershipProducts = await prisma.membershipProduct.findMany({
        where: { membershipId: um.membershipId }
      });
      
      for (const mp of membershipProducts) {
        // Check if already granted
        const existing = await prisma.userProduct.findFirst({
          where: {
            productId: mp.productId,
            userId: um.userId
          }
        });
        
        if (!existing) {
          // Grant product
          try {
            await prisma.userProduct.create({
              data: {
                id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: um.userId,
                productId: mp.productId,
                purchaseDate: new Date(),
                price: 0, // Free as part of membership
                transactionId: um.transactionId
              }
            });
            totalProductsGranted++;
          } catch (error) {
            // Ignore duplicates
          }
        }
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 ENROLLMENT SUMMARY:\n');
    console.log(`Users processed: ${usersProcessed}`);
    console.log(`├─ Groups added: ${totalGroupsAdded}`);
    console.log(`├─ Courses enrolled: ${totalCoursesEnrolled}`);
    console.log(`└─ Products granted: ${totalProductsGranted}`);
    
    if (totalGroupsAdded + totalCoursesEnrolled + totalProductsGranted > 0) {
      console.log(`\n✅ Successfully enrolled ${totalGroupsAdded + totalCoursesEnrolled + totalProductsGranted} items!`);
    } else {
      console.log(`\n✅ All members already enrolled!`);
    }
    
    // Sample verification
    console.log('\n' + '═'.repeat(80));
    console.log('\n🔍 SAMPLE VERIFICATION:\n');
    
    const sampleUser = await prisma.user.findFirst({
      where: { role: 'MEMBER_PREMIUM' }
    });
    
    if (sampleUser) {
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: sampleUser.id,
          status: 'ACTIVE'
        }
      });
      
      if (userMembership) {
        const membershipData = await prisma.membership.findUnique({
          where: { id: userMembership.membershipId }
        });
        
        const groupCount = await prisma.groupMember.count({
          where: { userId: sampleUser.id }
        });
        
        const courseCount = await prisma.courseEnrollment.count({
          where: { userId: sampleUser.id }
        });
        
        console.log(`Sample: ${sampleUser.email}`);
        console.log(`├─ Membership: ${membershipData?.name}`);
        console.log(`├─ In ${groupCount} groups`);
        console.log(`└─ Enrolled in ${courseCount} courses`);
        
        if (groupCount > 0 || courseCount > 0) {
          console.log(`\n✅ Auto-enrollment working!`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirm before running
const args = process.argv.slice(2);
if (args.includes('--confirm') || args.includes('-y')) {
  autoEnrollExistingMembers();
} else {
  console.log('\n⚠️  This script will auto-enroll existing members to groups/courses');
  console.log('   To run, use: node auto-enroll-existing-members.js --confirm\n');
  process.exit(0);
}
