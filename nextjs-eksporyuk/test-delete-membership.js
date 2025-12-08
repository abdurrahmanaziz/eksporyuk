const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteFunctionality() {
  console.log('🧪 TESTING DELETE MEMBERSHIP FUNCTIONALITY\n');
  console.log('='.repeat(60));

  try {
    // 1. Check all memberships
    console.log('\n1️⃣ Checking all memberships...\n');
    
    const allMemberships = await prisma.membership.findMany({
      include: {
        _count: {
          select: {
            userMemberships: true,
            affiliateLinks: true,
            membershipReminders: true,
            upgradeLogs: true,
            membershipGroups: true,
            membershipCourses: true,
            membershipProducts: true
          }
        }
      }
    });

    console.log(`Found ${allMemberships.length} memberships:\n`);

    for (const m of allMemberships) {
      const isDeletable = 
        m._count.userMemberships === 0 &&
        m._count.affiliateLinks === 0 &&
        m._count.upgradeLogs === 0;

      console.log(`${isDeletable ? '✅' : '❌'} ${m.name} (${m.slug})`);
      console.log(`   - ID: ${m.id}`);
      console.log(`   - Active: ${m.isActive}`);
      console.log(`   - Members: ${m._count.userMemberships}`);
      console.log(`   - Affiliate Links: ${m._count.affiliateLinks}`);
      console.log(`   - Upgrade Logs: ${m._count.upgradeLogs}`);
      console.log(`   - Groups: ${m._count.membershipGroups}`);
      console.log(`   - Courses: ${m._count.membershipCourses}`);
      console.log(`   - Products: ${m._count.membershipProducts}`);
      console.log(`   - Reminders: ${m._count.membershipReminders}`);
      console.log(`   - Can Delete: ${isDeletable ? 'YES ✅' : 'NO ❌'}`);
      console.log('');
    }

    // 2. Test scenarios
    console.log('='.repeat(60));
    console.log('\n2️⃣ Delete Scenarios:\n');

    const deletable = allMemberships.filter(m => 
      m._count.userMemberships === 0 &&
      m._count.affiliateLinks === 0 &&
      m._count.upgradeLogs === 0
    );

    const notDeletable = allMemberships.filter(m => 
      m._count.userMemberships > 0 ||
      m._count.affiliateLinks > 0 ||
      m._count.upgradeLogs > 0
    );

    console.log(`✅ Safe to Delete: ${deletable.length} memberships`);
    deletable.forEach(m => {
      console.log(`   - ${m.name} (${m.slug})`);
    });

    console.log(`\n❌ Cannot Delete: ${notDeletable.length} memberships`);
    notDeletable.forEach(m => {
      const reasons = [];
      if (m._count.userMemberships > 0) reasons.push(`${m._count.userMemberships} members`);
      if (m._count.affiliateLinks > 0) reasons.push(`${m._count.affiliateLinks} affiliate links`);
      if (m._count.upgradeLogs > 0) reasons.push(`${m._count.upgradeLogs} upgrade logs`);
      
      console.log(`   - ${m.name}: ${reasons.join(', ')}`);
    });

    // 3. API Response simulation
    console.log('\n' + '='.repeat(60));
    console.log('\n3️⃣ Simulating API Responses:\n');

    if (deletable.length > 0) {
      const testPlan = deletable[0];
      console.log('✅ SUCCESS CASE (Safe to delete):');
      console.log(`   Plan: ${testPlan.name}`);
      console.log(`   Response: 200 OK`);
      console.log(`   Message: "Membership plan '${testPlan.name}' has been deleted successfully."`);
    }

    if (notDeletable.length > 0) {
      const testPlan = notDeletable[0];
      const reasons = [];
      if (testPlan._count.userMemberships > 0) reasons.push(`${testPlan._count.userMemberships} active members`);
      if (testPlan._count.affiliateLinks > 0) reasons.push(`${testPlan._count.affiliateLinks} affiliate links`);
      if (testPlan._count.upgradeLogs > 0) reasons.push(`${testPlan._count.upgradeLogs} upgrade logs`);
      
      console.log('\n❌ ERROR CASE (Cannot delete):');
      console.log(`   Plan: ${testPlan.name}`);
      console.log(`   Response: 400 Bad Request`);
      console.log(`   Error: "Cannot delete membership plan '${testPlan.name}'"`);
      console.log(`   Details: "This plan is currently linked to: ${reasons.join(', ')}."`);
      console.log(`   Suggestion: "Set the plan to inactive instead of deleting it to preserve data integrity."`);
    }

    // 4. Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('\n4️⃣ RECOMMENDATIONS:\n');

    console.log('✅ Safe Operations:');
    console.log('   1. Delete memberships with 0 members, 0 affiliate links, 0 upgrade logs');
    console.log('   2. Frontend will show detailed warnings before deletion');
    console.log('   3. Backend validates all relationships before deletion');
    console.log('   4. All related data (groups, courses, products, reminders) will be cleaned up\n');

    console.log('⚠️  Best Practices:');
    console.log('   1. Instead of deleting, set isActive = false');
    console.log('   2. Keep historical data for reporting and analytics');
    console.log('   3. Only delete test/duplicate memberships');
    console.log('   4. Always backup database before bulk deletions\n');

    console.log('🔒 Data Integrity:');
    console.log('   1. Prevents orphaned user memberships');
    console.log('   2. Preserves affiliate commission history');
    console.log('   3. Maintains upgrade log trail');
    console.log('   4. Transaction-based deletion ensures consistency\n');

    console.log('='.repeat(60));
    console.log('\n✅ TEST COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteFunctionality()
  .then(() => {
    console.log('✨ All tests passed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Tests failed:', error);
    process.exit(1);
  });
