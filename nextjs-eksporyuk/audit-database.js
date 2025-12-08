const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDatabase() {
  console.log('=== DATABASE AUDIT ===\n');
  
  try {
    // Count all records
    const userCount = await prisma.user.count();
    const membershipCount = await prisma.membership.count();
    const courseCount = await prisma.course.count();
    const productCount = await prisma.product.count();
    const transactionCount = await prisma.transaction.count();
    const enrollmentCount = await prisma.courseEnrollment.count();
    const couponCount = await prisma.coupon.count();
    const affiliateCount = await prisma.affiliate.count();
    const groupCount = await prisma.communityGroup.count();
    
    console.log('📊 RECORD COUNTS:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Memberships: ${membershipCount}`);
    console.log(`   Courses: ${courseCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Enrollments: ${enrollmentCount}`);
    console.log(`   Coupons: ${couponCount}`);
    console.log(`   Affiliates: ${affiliateCount}`);
    console.log(`   Community Groups: ${groupCount}\n`);
    
    // Check memberships detail
    console.log('📦 MEMBERSHIPS DETAIL:');
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        duration: true,
        price: true,
        isActive: true,
      }
    });
    memberships.forEach(m => {
      console.log(`   ✓ ${m.name} (${m.slug}) - ${m.duration} - Rp ${m.price.toLocaleString()} - ${m.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    // Check users by role
    console.log('\n👥 USERS BY ROLE:');
    const roleGroups = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });
    roleGroups.forEach(r => {
      console.log(`   ${r.role}: ${r._count} users`);
    });
    
    // Check active memberships
    console.log('\n💎 ACTIVE USER MEMBERSHIPS:');
    const activeMemberships = await prisma.userMembership.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: { select: { name: true, email: true } },
        membership: { select: { name: true, duration: true } }
      }
    });
    if (activeMemberships.length > 0) {
      activeMemberships.forEach(um => {
        console.log(`   ✓ ${um.user.name} (${um.user.email}) - ${um.membership.name}`);
        console.log(`      Valid: ${um.startDate.toLocaleDateString()} - ${um.endDate.toLocaleDateString()}`);
      });
    } else {
      console.log('   ⚠️  No active memberships found');
    }
    
    // Check courses
    console.log('\n📚 COURSES:');
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        isPremium: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true
          }
        }
      }
    });
    if (courses.length > 0) {
      courses.forEach(c => {
        console.log(`   ${c.isPublished ? '✓' : '○'} ${c.title} (${c.slug})`);
        console.log(`      ${c.isPremium ? '💎 PREMIUM' : '🆓 FREE'} - ${c._count.lessons} lessons - ${c._count.enrollments} enrollments`);
      });
    } else {
      console.log('   ⚠️  No courses found');
    }
    
    // Check products
    console.log('\n📦 PRODUCTS:');
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        isActive: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });
    if (products.length > 0) {
      products.forEach(p => {
        console.log(`   ${p.isActive ? '✓' : '○'} ${p.name} (${p.slug}) - Rp ${p.price.toLocaleString()}`);
        console.log(`      ${p._count.transactions} transactions`);
      });
    } else {
      console.log('   ⚠️  No products found');
    }
    
    // Check transactions
    console.log('\n💰 TRANSACTIONS SUMMARY:');
    const txByStatus = await prisma.transaction.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true }
    });
    if (txByStatus.length > 0) {
      txByStatus.forEach(tx => {
        console.log(`   ${tx.status}: ${tx._count} transactions - Rp ${(tx._sum.amount || 0).toLocaleString()}`);
      });
    } else {
      console.log('   ⚠️  No transactions found');
    }
    
    // Check coupons
    console.log('\n🎟️  COUPONS:');
    const coupons = await prisma.coupon.findMany({
      select: {
        code: true,
        type: true,
        value: true,
        isActive: true,
        usageLimit: true,
        usageCount: true,
        validFrom: true,
        validUntil: true
      }
    });
    if (coupons.length > 0) {
      coupons.forEach(c => {
        const validity = c.validUntil ? `Valid until ${c.validUntil.toLocaleDateString()}` : 'No expiry';
        const usage = c.usageLimit ? `${c.usageCount}/${c.usageLimit}` : `${c.usageCount}/∞`;
        console.log(`   ${c.isActive ? '✓' : '○'} ${c.code} - ${c.type} ${c.value}${c.type === 'PERCENTAGE' ? '%' : ''}`);
        console.log(`      ${validity} - Used: ${usage}`);
      });
    } else {
      console.log('   ⚠️  No coupons found');
    }
    
    // Check affiliates
    console.log('\n🤝 AFFILIATES:');
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });
    if (affiliates.length > 0) {
      affiliates.forEach(a => {
        console.log(`   ${a.isActive ? '✓' : '○'} ${a.user.name} (${a.user.email})`);
        console.log(`      Code: ${a.affiliateCode} - Commission: ${a.commissionRate}% - Transactions: ${a._count.transactions}`);
      });
    } else {
      console.log('   ⚠️  No affiliates found');
    }
    
    // Check community groups
    console.log('\n👥 COMMUNITY GROUPS:');
    const groups = await prisma.communityGroup.findMany({
      select: {
        name: true,
        type: true,
        isActive: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });
    if (groups.length > 0) {
      groups.forEach(g => {
        console.log(`   ${g.isActive ? '✓' : '○'} ${g.name} (${g.type}) - ${g._count.members} members`);
      });
    } else {
      console.log('   ⚠️  No community groups found');
    }
    
    console.log('\n✅ Database audit complete!\n');
    
  } catch (error) {
    console.error('❌ Error during audit:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
