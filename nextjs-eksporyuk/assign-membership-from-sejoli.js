const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignMembershipFromTransactions() {
  console.log('🚀 Starting membership assignment from Sejoli transactions...\n');
  console.log('═'.repeat(80));

  try {
    // Get all successful transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${transactions.length} successful transactions to process\n`);

    let membershipAssigned = 0;
    let freeRoleAssigned = 0;
    let alreadyHasMembership = 0;
    let errors = 0;

    // Membership tier mapping based on metadata from transactions
    const MEMBERSHIP_TIER_MAPPING = {
      'LIFETIME': 'LIFETIME',
      '6_MONTH': 'SIX_MONTHS',
      '12_MONTH': 'TWELVE_MONTHS',
      '3_MONTH': 'THREE_MONTHS',
      '1_MONTH': 'ONE_MONTH',
      'FREE': null // Free gets MEMBER_FREE role only
    };

    for (const tx of transactions) {
      try {
        const userId = tx.user.id;
        const txType = tx.type;
        const membershipTier = tx.metadata?.membershipTier;

        console.log(`\n🔄 Processing ${tx.invoiceNumber} - ${tx.user.email}`);
        console.log(`   Type: ${txType}, Tier: ${membershipTier || 'N/A'}`);

        // Check if user already has active membership
        const existingMembership = await prisma.userMembership.findFirst({
          where: {
            userId: userId,
            status: 'ACTIVE'
          },
          include: {
            membership: true
          }
        });

        if (existingMembership) {
          console.log(`   ⚠️ Already has membership: ${existingMembership.membership.name}`);
          alreadyHasMembership++;
          continue;
        }

        // Process based on transaction type
        if (txType === 'MEMBERSHIP' && membershipTier) {
          const duration = MEMBERSHIP_TIER_MAPPING[membershipTier];
          
          if (!duration && membershipTier !== 'FREE') {
            console.log(`   ⚠️ Unknown tier: ${membershipTier}`);
            continue;
          }

          // Find or create membership plan
          let membership = await prisma.membership.findFirst({
            where: {
              duration: duration || 'ONE_MONTH',
              isActive: true
            }
          });

          if (!membership) {
            // Create membership plan if not exists
            const tierLabels = {
              'LIFETIME': 'Paket Lifetime',
              'SIX_MONTHS': 'Paket 6 Bulan',
              'TWELVE_MONTHS': 'Paket 12 Bulan',
              'THREE_MONTHS': 'Paket 3 Bulan',
              'ONE_MONTH': 'Paket 1 Bulan'
            };

            membership = await prisma.membership.create({
              data: {
                name: tierLabels[duration] || 'Paket Member',
                slug: duration?.toLowerCase().replace('_', '-') || 'member',
                description: `Membership ${tierLabels[duration] || 'Member'}`,
                duration: duration || 'ONE_MONTH',
                price: parseInt(tx.amount),
                isActive: true,
                status: 'PUBLISHED',
                affiliateCommissionRate: 0.30
              }
            });

            console.log(`   ✅ Created membership: ${membership.name}`);
          }

          // Calculate end date (required field)
          let endDate = new Date(tx.paidAt || tx.createdAt);
          if (duration && duration !== 'LIFETIME') {
            const months = duration === 'ONE_MONTH' ? 1 :
                          duration === 'THREE_MONTHS' ? 3 :
                          duration === 'SIX_MONTHS' ? 6 : 12;
            endDate = new Date(tx.paidAt || tx.createdAt);
            endDate.setMonth(endDate.getMonth() + months);
          } else {
            // For lifetime, set far future date
            endDate = new Date('2099-12-31');
          }

          // Create user membership
          await prisma.userMembership.create({
            data: {
              user: {
                connect: { id: userId }
              },
              membership: {
                connect: { id: membership.id }
              },
              status: 'ACTIVE',
              startDate: tx.paidAt || tx.createdAt,
              endDate: endDate,
              autoRenew: false,
              isActive: true,
              price: tx.amount
            }
          });

          // Update user role to MEMBER_PREMIUM
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'MEMBER_PREMIUM' }
          });

          console.log(`   ✅ Assigned ${membership.name} to ${tx.user.email}`);
          console.log(`   📅 Expires: ${endDate ? endDate.toLocaleDateString('id-ID') : 'Never (Lifetime)'}`);
          membershipAssigned++;

        } else if (txType === 'EVENT' || txType === 'PRODUCT') {
          // For events and products, just give MEMBER_FREE role if they don't have premium
          if (tx.user.role === 'ADMIN' || tx.user.role === 'MEMBER_PREMIUM' || tx.user.role === 'AFFILIATE') {
            console.log(`   ℹ️ User already has role: ${tx.user.role}`);
          } else {
            await prisma.user.update({
              where: { id: userId },
              data: { role: 'MEMBER_FREE' }
            });
            console.log(`   ✅ Assigned MEMBER_FREE role to ${tx.user.email}`);
            freeRoleAssigned++;
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing transaction ${tx.invoiceNumber}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 SUMMARY REPORT:');
    console.log('─'.repeat(80));
    console.log(`Total transactions processed: ${transactions.length}`);
    console.log(`✅ Membership assigned: ${membershipAssigned}`);
    console.log(`✅ Free role assigned: ${freeRoleAssigned}`);
    console.log(`⚠️ Already has membership: ${alreadyHasMembership}`);
    console.log(`❌ Errors: ${errors}`);

    // Show membership stats
    console.log('\n📈 Membership Distribution:');
    console.log('─'.repeat(80));
    
    const membershipStats = await prisma.membership.findMany({
      include: {
        _count: {
          select: {
            userMemberships: true
          }
        }
      },
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    membershipStats.forEach(m => {
      if (m._count.userMemberships > 0) {
        console.log(`- ${m.name}: ${m._count.userMemberships} users`);
      }
    });

    // Show role distribution
    console.log('\n👥 User Role Distribution:');
    console.log('─'.repeat(80));
    
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    roleStats.forEach(stat => {
      console.log(`- ${stat.role}: ${stat._count.id} users`);
    });

    console.log('\n✅ Membership assignment completed!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignMembershipFromTransactions();