const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickAudit() {
  console.log('\n=== QUICK SYSTEM AUDIT ===\n');
  
  try {
    // 1. Memberships
    console.log('📦 MEMBERSHIP PACKAGES:');
    const memberships = await prisma.membership.findMany({
      orderBy: { createdAt: 'asc' }
    });
    console.log(`   Total: ${memberships.length} packages`);
    memberships.forEach(m => {
      console.log(`   ${m.isActive ? '✅' : '❌'} ${m.name} (${m.slug})`);
      console.log(`      Duration: ${m.duration} | Price: Rp ${m.price.toLocaleString()}`);
    });
    
    // 2. Users
    console.log('\n👥 USERS:');
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    console.log(`   Total: ${users.length} users`);
    const roleCount = {};
    users.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
      console.log(`   ${u.isActive ? '✅' : '❌'} ${u.name} - ${u.role}`);
    });
    console.log('\n   By Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`      ${role}: ${count}`);
    });
    
    // 3. Active User Memberships
    console.log('\n💎 ACTIVE USER MEMBERSHIPS:');
    const activeUserMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { name: true, email: true, role: true } },
        membership: { select: { name: true, duration: true } }
      }
    });
    console.log(`   Total: ${activeUserMemberships.length}`);
    activeUserMemberships.forEach(um => {
      const expiry = new Date(um.endDate) > new Date() ? '✅ Active' : '⚠️ Expired';
      console.log(`   ${expiry} ${um.user.name} → ${um.membership.name}`);
      console.log(`      Period: ${new Date(um.startDate).toLocaleDateString()} - ${new Date(um.endDate).toLocaleDateString()}`);
    });
    
    // 4. Courses
    console.log('\n📚 COURSES:');
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { modules: true, userProgress: true }
        }
      }
    });
    console.log(`   Total: ${courses.length} courses`);
    courses.forEach(c => {
      const status = c.isPublished ? '✅ Published' : '⏸️ Draft';
      const access = c.isPremium ? '💎 Premium' : '🆓 Free';
      console.log(`   ${status} ${access} ${c.title}`);
      console.log(`      Modules: ${c._count.modules} | Progress: ${c._count.userProgress}`);
    });
    
    // 5. Products
    console.log('\n🛍️ PRODUCTS:');
    const products = await prisma.product.findMany({
      include: {
        _count: { select: { transactions: true } }
      }
    });
    console.log(`   Total: ${products.length} products`);
    products.forEach(p => {
      console.log(`   ${p.isActive ? '✅' : '❌'} ${p.name} (${p.slug})`);
      console.log(`      Price: Rp ${p.price.toLocaleString()} | Sales: ${p._count.transactions}`);
    });
    
    // 6. Transactions
    console.log('\n💰 TRANSACTIONS:');
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    console.log(`   Recent 10 transactions:`);
    transactions.forEach(tx => {
      const statusIcon = tx.status === 'SUCCESS' ? '✅' : tx.status === 'PENDING' ? '⏳' : '❌';
      console.log(`   ${statusIcon} ${tx.type} - ${tx.user.name}`);
      console.log(`      Amount: Rp ${tx.amount.toLocaleString()} | Status: ${tx.status}`);
      console.log(`      Date: ${new Date(tx.createdAt).toLocaleString()}`);
    });
    
    const txStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true }
    });
    console.log('\n   Transaction Summary:');
    txStats.forEach(stat => {
      console.log(`      ${stat.status}: ${stat._count} txs - Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    });
    
    // 7. Coupons
    console.log('\n🎟️ COUPONS:');
    const coupons = await prisma.coupon.findMany();
    console.log(`   Total: ${coupons.length} coupons`);
    coupons.forEach(c => {
      const active = c.isActive && (!c.validUntil || new Date(c.validUntil) > new Date());
      console.log(`   ${active ? '✅' : '❌'} ${c.code} - ${c.type} ${c.value}${c.type === 'PERCENTAGE' ? '%' : ''}`);
      console.log(`      Used: ${c.usageCount}${c.usageLimit ? `/${c.usageLimit}` : ''}`);
    });
    
    // 8. Affiliates
    console.log('\n🤝 AFFILIATES:');
    const affiliates = await prisma.affiliateProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { links: true } }
      }
    });
    console.log(`   Total: ${affiliates.length} affiliates`);
    affiliates.forEach(a => {
      console.log(`   ${a.isActive ? '✅' : '❌'} ${a.user.name}`);
      console.log(`      Code: ${a.affiliateCode} | Commission: ${a.commissionRate}%`);
      console.log(`      Links: ${a._count.links} | Earnings: Rp ${a.totalEarnings.toLocaleString()}`);
    });
    
    // 9. Groups
    console.log('\n👥 COMMUNITY GROUPS:');
    const groups = await prisma.group.findMany({
      include: {
        owner: { select: { name: true } },
        _count: { select: { members: true, posts: true } }
      }
    });
    console.log(`   Total: ${groups.length} groups`);
    groups.forEach(g => {
      console.log(`   ${g.isActive ? '✅' : '❌'} ${g.name} (${g.type})`);
      console.log(`      Owner: ${g.owner.name} | Members: ${g._count.members} | Posts: ${g._count.posts}`);
    });
    
    // 10. Check Paket Pro
    console.log('\n🔍 PAKET PRO CHECK:');
    const paketPro = await prisma.membership.findUnique({
      where: { slug: 'pro' }
    });
    if (paketPro) {
      console.log(`   ✅ Found: ${paketPro.name}`);
      console.log(`      ID: ${paketPro.id}`);
      console.log(`      Active: ${paketPro.isActive}`);
      console.log(`      Price: Rp ${paketPro.price.toLocaleString()}`);
    } else {
      console.log('   ❌ Paket Pro NOT FOUND in database!');
    }
    
    console.log('\n✅ Audit complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

quickAudit();
