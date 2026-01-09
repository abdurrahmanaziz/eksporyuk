const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('====== AUDIT SISTEM MEMBERSHIP EKSPORYUK ======\n');
  
  // 1. Total Users by Role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  console.log('📊 USER STATISTICS:');
  usersByRole.forEach(r => console.log(`   ${r.role}: ${r._count.id}`));
  
  // 2. Memberships
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, price: true, duration: true }
  });
  console.log(`\n📦 AVAILABLE MEMBERSHIPS (${memberships.length}):`);
  memberships.slice(0, 5).forEach(m => console.log(`   - ${m.name} (Rp ${Number(m.price).toLocaleString()})`));
  
  // 3. MembershipGroup, MembershipCourse, MembershipProduct
  const [groupLinks, courseLinks, productLinks] = await Promise.all([
    prisma.membershipGroup.count(),
    prisma.membershipCourse.count(),
    prisma.membershipProduct.count()
  ]);
  console.log('\n🔗 MEMBERSHIP LINKS:');
  console.log(`   - MembershipGroup: ${groupLinks}`);
  console.log(`   - MembershipCourse: ${courseLinks}`);
  console.log(`   - MembershipProduct: ${productLinks}`);
  
  // 4. Transaction Statistics
  const txStats = await prisma.transaction.groupBy({
    by: ['status', 'type'],
    _count: { id: true },
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  });
  console.log('\n💳 TRANSACTIONS (Last 30 days):');
  txStats.forEach(t => console.log(`   ${t.type}/${t.status}: ${t._count.id}`));
  
  // 5. UserMembership Statistics
  const umStats = await prisma.userMembership.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('\n🎫 USER MEMBERSHIPS:');
  umStats.forEach(u => console.log(`   ${u.status}: ${u._count.id}`));
  
  // 6. GroupMember Count
  const groupMembers = await prisma.groupMember.count();
  console.log(`\n👥 GROUP MEMBERS: ${groupMembers}`);
  
  // 7. CourseEnrollment Count
  const enrollments = await prisma.courseEnrollment.count();
  console.log(`📚 COURSE ENROLLMENTS: ${enrollments}`);
  
  // 8. UserProduct Count
  const userProducts = await prisma.userProduct.count();
  console.log(`📦 USER PRODUCTS: ${userProducts}`);
  
  // 9. Notifications sent
  const notifications = await prisma.notification.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  });
  console.log(`\n🔔 NOTIFICATIONS (Last 7 days): ${notifications}`);
  
  // 10. Check for problematic transactions (SUCCESS but no UserMembership)
  const successMembershipTx = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS'
    },
    select: { id: true, userId: true, membershipId: true, metadata: true },
    take: 100
  });
  
  let problemTxCount = 0;
  let problemTxIds = [];
  for (const tx of successMembershipTx) {
    const membershipId = tx.membershipId || (tx.metadata)?.membershipId;
    if (membershipId) {
      const um = await prisma.userMembership.findFirst({
        where: { transactionId: tx.id }
      });
      if (!um) {
        problemTxCount++;
        problemTxIds.push(tx.id);
      }
    }
  }
  console.log(`\n⚠️  PROBLEMATIC TRANSACTIONS (SUCCESS without activation): ${problemTxCount}`);
  if (problemTxIds.length > 0) {
    console.log('   IDs:', problemTxIds.join(', '));
  }
  
  // 11. Check sample memberships with their linked groups/courses
  console.log('\n📋 SAMPLE MEMBERSHIP DETAILS:');
  const sampleMemberships = await prisma.membership.findMany({
    take: 3,
    select: { id: true, name: true }
  });
  
  for (const m of sampleMemberships) {
    const groups = await prisma.membershipGroup.count({ where: { membershipId: m.id } });
    const courses = await prisma.membershipCourse.count({ where: { membershipId: m.id } });
    const products = await prisma.membershipProduct.count({ where: { membershipId: m.id } });
    console.log(`   ${m.name}: ${groups} groups, ${courses} courses, ${products} products`);
  }
  
  await prisma.$disconnect();
  console.log('\n====== AUDIT COMPLETE ======');
}

audit().catch(e => { console.error(e); process.exit(1); });
