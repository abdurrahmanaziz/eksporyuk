/**
 * Check if users in admin/sales have received their memberships
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsersMemberships() {
  console.log('🔍 CHECKING USERS MEMBERSHIPS FROM SALES TRANSACTIONS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Get all SUCCESS transactions with MEMBERSHIP type
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        membership: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            isActive: true,
            membershipId: true,
            membership: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Check last 100 transactions
    });

    console.log(`Total SUCCESS MEMBERSHIP transactions (last 100): ${transactions.length}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Statistics
    let withMembership = 0;
    let withoutMembership = 0;
    const missingMemberships = [];

    // Check each transaction
    for (const tx of transactions) {
      const hasMembership = tx.membership !== null;
      
      if (hasMembership) {
        withMembership++;
      } else {
        withoutMembership++;
        
        // Get membership name from metadata if available
        const membershipName = tx.metadata?.membershipName || 
                              tx.metadata?.product_name ||
                              'N/A';
        
        missingMemberships.push({
          invoiceNumber: tx.invoiceNumber,
          userName: tx.user?.name || 'N/A',
          userEmail: tx.user?.email || 'N/A',
          membershipName: membershipName,
          amount: tx.amount,
          createdAt: tx.createdAt,
          userId: tx.userId,
          metadata: tx.metadata
        });
      }
    }

    console.log('📊 SUMMARY:');
    console.log('─────────────────────────────────────────────────────────────\n');
    console.log(`✅ Users with membership: ${withMembership} (${((withMembership/transactions.length)*100).toFixed(1)}%)`);
    console.log(`❌ Users without membership: ${withoutMembership} (${((withoutMembership/transactions.length)*100).toFixed(1)}%)\n`);

    if (withoutMembership > 0) {
      console.log('\n⚠️  USERS MISSING MEMBERSHIPS:');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      missingMemberships.forEach((item, index) => {
        console.log(`${index + 1}. Invoice: ${item.invoiceNumber}`);
        console.log(`   User: ${item.userName} (${item.userEmail})`);
        console.log(`   Membership: ${item.membershipName}`);
        console.log(`   Amount: Rp ${item.amount.toLocaleString('id-ID')}`);
        console.log(`   Date: ${item.createdAt.toISOString().split('T')[0]}`);
        console.log(`   User ID: ${item.userId}`);
        if (item.metadata) {
          console.log(`   Metadata Keys:`, Object.keys(item.metadata));
        }
        console.log();
      });

      // Show sample of users WITH membership for comparison
      console.log('\n✅ SAMPLE USERS WITH MEMBERSHIP (for comparison):');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      const withMembershipSample = transactions
        .filter(tx => tx.membership !== null)
        .slice(0, 5);

      withMembershipSample.forEach((tx, index) => {
        console.log(`${index + 1}. Invoice: ${tx.invoiceNumber}`);
        console.log(`   User: ${tx.user?.name || 'N/A'} (${tx.user?.email || 'N/A'})`);
        console.log(`   Membership: ${tx.membership?.membership?.name || 'N/A'}`);
        console.log(`   Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
        console.log(`   Status: ${tx.membership.status}`);
        console.log(`   Active: ${tx.membership.isActive ? 'Yes' : 'No'}`);
        console.log(`   Start: ${tx.membership.startDate?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   End: ${tx.membership.endDate?.toISOString().split('T')[0] || 'LIFETIME'}`);
        console.log();
      });
    }

    // Additional check: Users who have multiple transactions
    console.log('\n📋 CHECKING FOR DUPLICATE TRANSACTIONS (same user, same membership):');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const userMembershipMap = new Map();
    
    transactions.forEach(tx => {
      // Use membership from UserMembership table
      const membershipId = tx.membership?.membershipId;
      if (!membershipId) return;
      
      const key = `${tx.userId}-${membershipId}`;
      if (!userMembershipMap.has(key)) {
        userMembershipMap.set(key, []);
      }
      userMembershipMap.get(key).push(tx);
    });

    const duplicates = Array.from(userMembershipMap.entries())
      .filter(([key, txs]) => txs.length > 1)
      .slice(0, 10); // Show first 10

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} users with multiple transactions for same membership:\n`);
      
      duplicates.forEach(([key, txs], index) => {
        const firstTx = txs[0];
        console.log(`${index + 1}. User: ${firstTx.user?.name || 'N/A'} (${firstTx.user?.email || 'N/A'})`);
        console.log(`   Membership: ${firstTx.membership?.membership?.name || 'N/A'}`);
        console.log(`   Transactions: ${txs.length}`);
        console.log(`   Invoices: ${txs.map(t => t.invoiceNumber).join(', ')}`);
        console.log(`   Has UserMembership: ${txs.some(t => t.membership !== null) ? 'Yes' : 'No'}`);
        console.log();
      });
    } else {
      console.log('No duplicate transactions found.\n');
    }

    // Check for transactions without membership reference
    const noMembershipRef = transactions.filter(tx => !tx.membership);
    
    if (noMembershipRef.length > 0) {
      console.log(`\n⚠️  TRANSACTIONS WITHOUT MEMBERSHIP REFERENCE: ${noMembershipRef.length}`);
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      noMembershipRef.slice(0, 10).forEach((tx, index) => {
        console.log(`${index + 1}. Invoice: ${tx.invoiceNumber}`);
        console.log(`   User: ${tx.user?.name || 'N/A'}`);
        console.log(`   Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
        console.log(`   Metadata:`, tx.metadata);
        console.log();
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('FINAL SUMMARY:');
    console.log(`Total Checked: ${transactions.length}`);
    console.log(`With Membership: ${withMembership} ✅`);
    console.log(`Without Membership: ${withoutMembership} ❌`);
    console.log(`Duplicate Transactions: ${duplicates.length}`);
    console.log(`No Membership Reference: ${noMembershipRef.length}`);
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
checkUsersMemberships()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
