const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMembershipAssignments() {
  console.log('🔍 Verifying membership assignments from Sejoli transactions...\n');

  try {
    // Get all UserMembership records
    const userMemberships = await prisma.userMembership.findMany({
      include: {
        user: { select: { email: true, name: true, role: true } },
        membership: { select: { name: true, duration: true } },
        transaction: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total UserMembership records: ${userMemberships.length}\n`);

    // Group by membership type
    const membershipGroups = {
      'LIFETIME': [],
      'TWELVE_MONTHS': [],
      'SIX_MONTHS': [],
      'THREE_MONTHS': [],
      'ONE_MONTH': []
    };

    userMemberships.forEach(um => {
      if (membershipGroups[um.membership.duration]) {
        membershipGroups[um.membership.duration].push(um);
      }
    });

    console.log('📈 Membership Distribution:');
    console.log('─'.repeat(80));
    Object.entries(membershipGroups).forEach(([duration, members]) => {
      if (members.length > 0) {
        console.log(`\n${duration}: ${members.length} users`);
        
        // Show first 5 examples
        members.slice(0, 5).forEach(um => {
          const invoiceInfo = um.transaction ? ` (INV: ${um.transaction.invoiceNumber})` : '';
          const endDateInfo = um.endDate ? ` → ${new Date(um.endDate).toLocaleDateString('id-ID')}` : ' → Lifetime';
          console.log(`  - ${um.user.email} | ${um.user.role}${endDateInfo}${invoiceInfo}`);
        });
        
        if (members.length > 5) {
          console.log(`  ... and ${members.length - 5} more users`);
        }
      }
    });

    // Check transactions without memberships
    console.log('\n\n🔍 Checking transactions without membership assignments...');
    const transactionsWithoutMembership = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP',
        membership: null  // Use correct relation name
      },
      include: {
        user: { select: { email: true, role: true } }
      }
    });

    console.log(`\n⚠️ Found ${transactionsWithoutMembership.length} MEMBERSHIP transactions without UserMembership records`);
    
    if (transactionsWithoutMembership.length > 0) {
      console.log('\nExamples:');
      transactionsWithoutMembership.slice(0, 10).forEach(tx => {
        const metadata = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
        console.log(`  - ${tx.invoiceNumber}: ${tx.user.email} | Tier: ${metadata?.tier || 'Unknown'}`);
      });
    }

    // Check role distribution
    console.log('\n\n👥 User Role Distribution:');
    console.log('─'.repeat(80));
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    roleCounts.forEach(({ role, _count }) => {
      console.log(`${role}: ${_count} users`);
    });

    // Check MEMBER_PREMIUM without memberships
    console.log('\n\n🚨 MEMBER_PREMIUM users without active memberships:');
    const premiumWithoutMembership = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        userMemberships: {
          none: {}
        }
      },
      select: { id: true, email: true, name: true }
    });

    console.log(`Found: ${premiumWithoutMembership.length} users`);
    if (premiumWithoutMembership.length > 0) {
      premiumWithoutMembership.slice(0, 10).forEach(user => {
        console.log(`  - ${user.email}`);
      });
      if (premiumWithoutMembership.length > 10) {
        console.log(`  ... and ${premiumWithoutMembership.length - 10} more`);
      }
    }

    console.log('\n✅ Verification completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMembershipAssignments();
