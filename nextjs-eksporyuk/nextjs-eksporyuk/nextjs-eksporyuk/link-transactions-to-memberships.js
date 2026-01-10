const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkTransactionsToMemberships() {
  console.log('🔗 Linking Sejoli transactions to their UserMembership records...\n');

  try {
    // Get all SUCCESS MEMBERSHIP transactions without membership link
    const orphanTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP',
        membership: null
      },
      include: {
        user: {
          include: {
            userMemberships: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    console.log(`📊 Found ${orphanTransactions.length} transactions to link\n`);

    let linked = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of orphanTransactions) {
      try {
        const latestMembership = tx.user.userMemberships[0];
        
        if (!latestMembership) {
          console.log(`⚠️ ${tx.invoiceNumber}: No membership found for ${tx.user.email}`);
          skipped++;
          continue;
        }

        // Link transaction to membership
        await prisma.userMembership.update({
          where: {
            userId_membershipId: {
              userId: tx.userId,
              membershipId: latestMembership.membershipId
            }
          },
          data: {
            transactionId: tx.id
          }
        });

        console.log(`✅ ${tx.invoiceNumber} → UserMembership for ${tx.user.email}`);
        linked++;

      } catch (error) {
        console.log(`❌ Error linking ${tx.invoiceNumber}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 LINKING SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`✅ Successfully linked: ${linked}`);
    console.log(`⚠️ Skipped (no membership): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('═'.repeat(80));

    // Verify final state
    console.log('\n🔍 Final verification...');
    const remainingOrphans = await prisma.transaction.count({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP',
        membership: null
      }
    });

    console.log(`\n📊 Remaining unlinked MEMBERSHIP transactions: ${remainingOrphans}`);
    console.log('\n✅ Linking completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

linkTransactionsToMemberships();
