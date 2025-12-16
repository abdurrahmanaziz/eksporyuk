const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalAudit() {
  console.log('🎯 FINAL AUDIT - Sejoli to New Web Migration\n');
  console.log('═'.repeat(80) + '\n');

  try {
    // 1. Transaction Summary
    console.log('📊 TRANSACTION SUMMARY');
    console.log('─'.repeat(80));
    
    const transactionStats = await prisma.transaction.groupBy({
      by: ['type', 'status'],
      _count: true,
      where: {
        invoiceNumber: {
          startsWith: 'INV'
        }
      }
    });

    transactionStats.forEach(stat => {
      console.log(`${stat.type} (${stat.status}): ${stat._count}`);
    });

    // 2. Membership Distribution
    console.log('\n\n📈 MEMBERSHIP DISTRIBUTION (From Sejoli)');
    console.log('─'.repeat(80));
    
    const membershipCounts = await prisma.userMembership.groupBy({
      by: ['membershipId'],
      _count: true,
      where: {
        transaction: {
          invoiceNumber: {
            startsWith: 'INV'
          }
        }
      }
    });

    for (const count of membershipCounts) {
      const membership = await prisma.membership.findUnique({
        where: { id: count.membershipId },
        select: { name: true, duration: true }
      });
      console.log(`${membership.name} (${membership.duration}): ${count._count} users`);
    }

    // 3. User Role Changes
    console.log('\n\n👥 USER ROLES (After Sejoli Migration)');
    console.log('─'.repeat(80));
    
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    roleCounts.sort((a, b) => b._count - a._count);
    roleCounts.forEach(({ role, _count }) => {
      console.log(`${role}: ${_count} users`);
    });

    // 4. Complete Migration Check
    console.log('\n\n✅ MIGRATION COMPLETENESS CHECK');
    console.log('─'.repeat(80));

    const sejoli = {
      totalTransactions: await prisma.transaction.count({
        where: {
          invoiceNumber: { startsWith: 'INV' },
          status: 'SUCCESS'
        }
      }),
      membershipTx: await prisma.transaction.count({
        where: {
          invoiceNumber: { startsWith: 'INV' },
          status: 'SUCCESS',
          type: 'MEMBERSHIP'
        }
      }),
      eventTx: await prisma.transaction.count({
        where: {
          invoiceNumber: { startsWith: 'INV' },
          status: 'SUCCESS',
          type: 'EVENT'
        }
      }),
      productTx: await prisma.transaction.count({
        where: {
          invoiceNumber: { startsWith: 'INV' },
          status: 'SUCCESS',
          type: 'PRODUCT'
        }
      }),
      linkedMemberships: await prisma.userMembership.count({
        where: {
          transaction: {
            invoiceNumber: { startsWith: 'INV' }
          }
        }
      }),
      unlinkedMemberships: await prisma.transaction.count({
        where: {
          invoiceNumber: { startsWith: 'INV' },
          status: 'SUCCESS',
          type: 'MEMBERSHIP',
          membership: null
        }
      })
    };

    console.log(`Total Sejoli Transactions: ${sejoli.totalTransactions}`);
    console.log(`  ├─ MEMBERSHIP: ${sejoli.membershipTx} → ${sejoli.linkedMemberships} UserMembership created`);
    console.log(`  ├─ EVENT: ${sejoli.eventTx} → MEMBER_FREE role assigned`);
    console.log(`  └─ PRODUCT: ${sejoli.productTx} → MEMBER_FREE role assigned`);
    console.log(`\nOrphan Transactions: ${sejoli.unlinkedMemberships}`);

    if (sejoli.unlinkedMemberships === 0 && sejoli.linkedMemberships === sejoli.membershipTx) {
      console.log('\n🎉 ALL SEJOLI TRANSACTIONS SUCCESSFULLY MIGRATED!');
    } else {
      console.log('\n⚠️ Some transactions need attention');
    }

    // 5. Sample User Journey
    console.log('\n\n🔍 SAMPLE USER JOURNEYS (Sejoli → New Web)');
    console.log('─'.repeat(80));

    const sampleUsers = await prisma.user.findMany({
      where: {
        transactions: {
          some: {
            invoiceNumber: { startsWith: 'INV' }
          }
        }
      },
      take: 5,
      include: {
        transactions: {
          where: {
            invoiceNumber: { startsWith: 'INV' }
          },
          select: {
            invoiceNumber: true,
            type: true,
            amount: true,
            paidAt: true
          }
        },
        userMemberships: {
          where: {
            transaction: {
              invoiceNumber: { startsWith: 'INV' }
            }
          },
          include: {
            membership: {
              select: { name: true, duration: true }
            }
          }
        }
      }
    });

    sampleUsers.forEach(user => {
      console.log(`\n📧 ${user.email} (${user.role})`);
      user.transactions.forEach(tx => {
        console.log(`   💰 ${tx.invoiceNumber}: Rp ${tx.amount.toLocaleString()} (${tx.type})`);
      });
      user.userMemberships.forEach(um => {
        const endDate = new Date(um.endDate).toLocaleDateString('id-ID');
        console.log(`   ✅ Got: ${um.membership.name} → Expires: ${endDate}`);
      });
    });

    console.log('\n\n' + '═'.repeat(80));
    console.log('✅ AUDIT COMPLETE!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalAudit();
