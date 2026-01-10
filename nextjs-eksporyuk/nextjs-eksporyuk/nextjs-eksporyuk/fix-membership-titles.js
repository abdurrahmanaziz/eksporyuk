const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMembershipTitles() {
  console.log('🔧 FIXING MEMBERSHIP NAMES - NO DELETION, ONLY REPAIR');
  console.log('='.repeat(60));
  
  try {
    // First check current memberships
    const memberships = await prisma.membership.findMany({
      where: { isActive: true }
    });
    
    console.log('\n📦 CURRENT MEMBERSHIPS:');
    memberships.forEach((membership, index) => {
      console.log(`  ${index + 1}. ID: ${membership.id}`);
      console.log(`     Name: "${membership.name}" ${!membership.name ? '❌ KOSONG!' : '✅'}`);
      console.log(`     Slug: "${membership.slug}"`);
      console.log(`     Price: ${membership.price}`);
      console.log('');
    });
    
    if (memberships.length !== 3) {
      console.log(`❌ Expected 3 memberships, found ${memberships.length}. Check database!`);
      return;
    }
    
    // Define correct titles based on price patterns
    const titleMappings = [
      {
        pattern: 'lifetime',
        correctTitle: 'Paket Ekspor Yuk - Lifetime',
        expectedGroups: 2,
        expectedCourses: 2
      },
      {
        pattern: '6',
        correctTitle: 'Paket Ekspor Yuk - 6 Bulan', 
        expectedGroups: 1,
        expectedCourses: 1
      },
      {
        pattern: '12',
        correctTitle: 'Paket Ekspor Yuk - 12 Bulan',
        expectedGroups: 1, 
        expectedCourses: 1
      }
    ];
    
    console.log('\n🔍 ANALYZING AND FIXING NAMES:');
    let fixedCount = 0;
    
    for (const membership of memberships) {
      let needsFix = !membership.name || membership.name.trim() === '';
      let correctTitle = membership.name;
      
      if (needsFix) {
        // Get group and course counts to determine correct title
        const groupCount = await prisma.membershipGroup.count({
          where: { membershipId: membership.id }
        });
        const courseCount = await prisma.membershipCourse.count({
          where: { membershipId: membership.id }
        });
        
        console.log(`\n  📊 Membership ID: ${membership.id}`);
        console.log(`     Current Name: "${membership.name}" ❌`);
        console.log(`     Slug: "${membership.slug}"`);
        console.log(`     Groups: ${groupCount}, Courses: ${courseCount}`);
        console.log(`     Price: ${membership.price}`);
        
        // Determine correct title based on access level
        if (groupCount === 2 && courseCount === 2) {
          correctTitle = 'Paket Ekspor Yuk - Lifetime';
        } else if (groupCount === 1 && courseCount === 1) {
          // Check price or slug to differentiate 6 vs 12 month
          if (membership.slug && membership.slug.includes('6')) {
            correctTitle = 'Paket Ekspor Yuk - 6 Bulan';
          } else if (membership.slug && membership.slug.includes('12')) {
            correctTitle = 'Paket Ekspor Yuk - 12 Bulan';
          } else {
            // Default to 6 month for lower price, 12 month for higher
            correctTitle = Number(membership.price) < 500000 ? 
              'Paket Ekspor Yuk - 6 Bulan' : 
              'Paket Ekspor Yuk - 12 Bulan';
          }
        } else {
          console.log(`     ⚠️  Unusual access pattern: ${groupCount}g, ${courseCount}c`);
          correctTitle = 'Paket Ekspor Yuk - Unknown'; // Fallback
        }
        
        console.log(`     🎯 Correct Name: "${correctTitle}"`);
        
        // Update the membership name (not title)
        await prisma.membership.update({
          where: { id: membership.id },
          data: { name: correctTitle }
        });
        
        console.log(`     ✅ Name updated successfully!`);
        fixedCount++;
      } else {
        console.log(`\n  ✅ Membership ID: ${membership.id} - Name OK: "${membership.name}"`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 NAME FIX SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total memberships checked: ${memberships.length}`);
    console.log(`🔧 Names fixed: ${fixedCount}`);
    console.log(`📋 Already correct: ${memberships.length - fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 MEMBERSHIP NAMES FIXED!');
      console.log('📝 Now you can re-run the access verification script.');
    } else {
      console.log('\n✅ All membership names were already correct!');
    }
    
    // Verify final state
    console.log('\n📋 FINAL MEMBERSHIP STATE:');
    const updatedMemberships = await prisma.membership.findMany({
      where: { isActive: true },
      include: {
        membershipGroups: true,
        membershipCourses: true
      }
    });
    
    updatedMemberships.forEach((membership, index) => {
      console.log(`  ${index + 1}. "${membership.name}"`);
      console.log(`     Groups: ${membership.membershipGroups.length}, Courses: ${membership.membershipCourses.length}`);
      console.log(`     Price: Rp ${Number(membership.price).toLocaleString('id-ID')}`);
    });
    
    console.log('\n✅ Name fix complete!');
    
  } catch (error) {
    console.error('❌ Name fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMembershipTitles();