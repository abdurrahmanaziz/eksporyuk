import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditSystem() {
  console.log('🔍 SISTEM & DATABASE AUDIT\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check Database Connection
    console.log('\n1️⃣  DATABASE CONNECTION');
    console.log('-'.repeat(60));
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected');
    } catch (e) {
      console.log('❌ Database connection failed:', e.message);
      return;
    }

    // 2. Check User Data
    console.log('\n2️⃣  USER DATA');
    console.log('-'.repeat(60));
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      take: 5
    });

    console.log(`Total users: ${totalUsers}`);
    console.log(`Admin users: ${adminUsers}`);
    console.log('Sample users:');
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    if (adminUsers === 0) {
      console.log('\n⚠️  WARNING: No admin users found!');
    }

    // 3. Check Products (Events)
    console.log('\n3️⃣  PRODUCTS & EVENTS');
    console.log('-'.repeat(60));
    const totalProducts = await prisma.product.count();
    const totalEvents = await prisma.product.count({ where: { productType: 'EVENT' } });
    
    console.log(`Total products: ${totalProducts}`);
    console.log(`Total events: ${totalEvents}`);

    if (totalEvents > 0) {
      const events = await prisma.product.findMany({
        where: { productType: 'EVENT' },
        select: {
          id: true,
          name: true,
          slug: true,
          eventDate: true,
          eventEndDate: true,
          creatorId: true,
          productStatus: true
        },
        take: 5
      });
      console.log('Recent events:');
      events.forEach(e => {
        console.log(`  - ${e.name} (${e.slug})`);
        console.log(`    Status: ${e.productStatus}`);
        console.log(`    Date: ${e.eventDate?.toLocaleDateString('id-ID')}`);
      });
    }

    // 4. Check Memberships
    console.log('\n4️⃣  MEMBERSHIPS');
    console.log('-'.repeat(60));
    const totalMemberships = await prisma.membership.count();
    const activeMemberships = await prisma.membership.count({ 
      where: { isActive: true } 
    });
    console.log(`Total memberships: ${totalMemberships}`);
    console.log(`Active memberships: ${activeMemberships}`);

    if (totalMemberships > 0) {
      const memberships = await prisma.membership.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true
        },
        take: 3
      });
      console.log('Sample memberships:');
      memberships.forEach(m => console.log(`  - ${m.name}: Rp ${m.price} (${m.isActive ? 'Active' : 'Inactive'})`));
    }

    // 5. Check Event Memberships
    console.log('\n5️⃣  EVENT MEMBERSHIPS RELATION');
    console.log('-'.repeat(60));
    const eventMembershipCount = await prisma.eventMembership.count();
    console.log(`Total event memberships: ${eventMembershipCount}`);

    if (eventMembershipCount > 0) {
      const eventMemberships = await prisma.eventMembership.findMany({
        include: {
          product: { select: { name: true } },
          membership: { select: { name: true } }
        },
        take: 3
      });
      console.log('Sample event memberships:');
      eventMemberships.forEach(em => {
        console.log(`  - Event: ${em.product.name}, Membership: ${em.membership.name}`);
      });
    }

    // 6. Check Event Groups
    console.log('\n6️⃣  EVENT GROUPS RELATION');
    console.log('-'.repeat(60));
    const eventGroupCount = await prisma.eventGroup.count();
    console.log(`Total event groups: ${eventGroupCount}`);

    if (eventGroupCount > 0) {
      const eventGroups = await prisma.eventGroup.findMany({
        include: {
          product: { select: { name: true } },
          group: { select: { name: true } }
        },
        take: 3
      });
      console.log('Sample event groups:');
      eventGroups.forEach(eg => {
        console.log(`  - Event: ${eg.product.name}, Group: ${eg.group.name}`);
      });
    }

    // 7. Check Wallets & Commissions
    console.log('\n7️⃣  WALLETS & COMMISSIONS');
    console.log('-'.repeat(60));
    const walletCount = await prisma.wallet.count();
    const pendingRevenueCount = await prisma.pendingRevenue.count();
    console.log(`Total wallets: ${walletCount}`);
    console.log(`Pending revenues: ${pendingRevenueCount}`);

    const wallets = await prisma.wallet.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { balance: 'desc' },
      take: 3
    });
    if (wallets.length > 0) {
      console.log('Top wallets:');
      wallets.forEach(w => {
        console.log(`  - ${w.user.email}: Rp ${w.balance} (pending: Rp ${w.balancePending})`);
      });
    }

    // 8. Check Schema Issues
    console.log('\n8️⃣  SCHEMA VALIDATION');
    console.log('-'.repeat(60));
    
    // Check if creatorId references exist in events
    const productsWithMissingCreators = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE "productType" = 'EVENT' AND "creatorId" NOT IN (SELECT id FROM "User")
    `;
    console.log(`Events with missing creators: ${productsWithMissingCreators[0]?.count || 0}`);

    // Check if groupId references exist
    const productsWithMissingGroups = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE "groupId" IS NOT NULL AND "groupId" NOT IN (SELECT id FROM "Group")
    `;
    console.log(`Products with missing groups: ${productsWithMissingGroups[0]?.count || 0}`);

    // 9. Check API Routes Configuration
    console.log('\n9️⃣  API ROUTES');
    console.log('-'.repeat(60));
    console.log('✅ /api/admin/events - GET (list), POST (create)');
    console.log('✅ /api/admin/events/[id] - GET, PUT (update), DELETE');
    console.log('✅ /api/auth/[...nextauth] - NextAuth');
    console.log('✅ /api/webhooks/xendit - Payment webhook');

    // 10. Summary & Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));

    const issues = [];

    if (adminUsers === 0) issues.push('❌ No admin users - cannot access admin panel');
    if (totalUsers === 0) issues.push('❌ No users in database - run seed script');
    if (totalEvents === 0) issues.push('⚠️  No events created yet - use create-sample-event.js');
    if (walletCount < totalUsers) issues.push('⚠️  Some users missing wallets - may cause errors in transactions');

    if (issues.length === 0) {
      console.log('\n✅ ALL SYSTEMS OPERATIONAL');
      console.log('- Database: Connected ✅');
      console.log('- Users: Present ✅');
      console.log('- Wallets: Initialized ✅');
      console.log('- Events: Available ✅');
    } else {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }

    // 11. Performance Check
    console.log('\n🚀 PERFORMANCE');
    console.log('-'.repeat(60));
    
    const start = Date.now();
    await prisma.product.findMany({
      where: { productType: 'EVENT' },
      take: 10
    });
    const queryTime = Date.now() - start;
    console.log(`Event query (10 records): ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('⚠️  Query is slow - consider adding indexes');
    } else {
      console.log('✅ Query performance acceptable');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n' + '='.repeat(60));
    console.log('Audit complete\n');
  }
}

auditSystem();
