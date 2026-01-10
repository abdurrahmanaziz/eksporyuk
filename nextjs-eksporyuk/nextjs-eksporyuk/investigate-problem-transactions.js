const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateProblematicTransactions() {
  console.log('🔍 INVESTIGATING PROBLEMATIC TRANSACTIONS FROM ADMIN/SALES...\n');
  
  try {
    // 1. Check Brahma Andira - user reported as paid via Xendit but not activated
    console.log('═══ BRAHMA ANDIRA CASE ═══');
    const brahma = await prisma.user.findUnique({
      where: { email: 'brahmandira@gmail.com' }
    });
    
    if (brahma) {
      console.log(`Found user: ${brahma.name} (${brahma.email})`);
      
      // Get transactions
      const brahmaTransactions = await prisma.transaction.findMany({
        where: { userId: brahma.id },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`\nTransactions: ${brahmaTransactions.length}`);
      for (const tx of brahmaTransactions) {
        console.log(`  ${tx.id}:`);
        console.log(`    Status: ${tx.status}`);
        console.log(`    Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
        console.log(`    Payment Method: ${tx.paymentMethod || 'N/A'}`);
        console.log(`    MembershipId: ${tx.membershipId || 'NONE'}`);
        console.log(`    External ID: ${tx.externalId || 'NONE'}`);
        console.log(`    Created: ${tx.createdAt.toLocaleString('id-ID')}`);
        console.log(`    Paid At: ${tx.paidAt ? tx.paidAt.toLocaleString('id-ID') : 'NOT PAID'}`);
        
        if (tx.metadata) {
          console.log(`    Metadata: ${JSON.stringify(tx.metadata, null, 2)}`);
        }
        console.log('');
      }
      
      // Check UserMembership records
      const brahmaMemberships = await prisma.userMembership.findMany({
        where: { userId: brahma.id }
      });
      
      console.log(`User Memberships: ${brahmaMemberships.length}`);
      for (const membership of brahmaMemberships) {
        console.log(`  Membership: ${membership.membershipId}`);
        console.log(`  Status: ${membership.status}`);
        console.log(`  Active: ${membership.isActive}`);
        console.log(`  Transaction: ${membership.transactionId || 'NONE'}`);
        console.log('');
      }
      
      // Check groups access
      const groupMembers = await prisma.groupMember.findMany({
        where: { userId: brahma.id }
      });
      console.log(`Group Access: ${groupMembers.length} groups`);
      
      // Check courses access  
      const courseEnrollments = await prisma.courseEnrollment.findMany({
        where: { userId: brahma.id }
      });
      console.log(`Course Access: ${courseEnrollments.length} courses`);
      
    } else {
      console.log('❌ Brahma Andira not found');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. Check Member Umar - massive commission over-crediting issue
    console.log('═══ MEMBER UMAR CASE (COMMISSION ISSUE) ═══');
    const umar = await prisma.user.findUnique({
      where: { email: 'umartanoe1@gmail.com' }
    });
    
    if (umar) {
      console.log(`Found user: ${umar.name} (${umar.email})`);
      
      // Get wallet info
      const umarWallet = await prisma.wallet.findUnique({
        where: { userId: umar.id }
      });
      
      if (umarWallet) {
        console.log(`\nWallet Balance: Rp ${umarWallet.balance.toLocaleString('id-ID')}`);
        console.log(`Wallet Pending: Rp ${umarWallet.balancePending.toLocaleString('id-ID')}`);
        
        // Get wallet transactions to see commission history
        const umarWalletTxs = await prisma.walletTransaction.findMany({
          where: { userId: umar.id },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        
        console.log(`\nWallet Transactions: ${umarWalletTxs.length}`);
        let totalCommissions = 0;
        
        for (const wt of umarWalletTxs) {
          console.log(`  ${wt.createdAt.toLocaleDateString('id-ID')}: ${wt.type} - Rp ${wt.amount.toLocaleString('id-ID')}`);
          console.log(`    Description: ${wt.description || 'N/A'}`);
          console.log(`    Reference: ${wt.referenceId || 'N/A'}`);
          
          if (wt.type === 'COMMISSION_EARNED' || wt.type === 'AFFILIATE_COMMISSION') {
            totalCommissions += parseFloat(wt.amount);
          }
        }
        
        console.log(`\n💰 Total Commissions Earned: Rp ${totalCommissions.toLocaleString('id-ID')}`);
        
        // This should be around Rp 200k-250k based on commission rates, not Rp 1.5B+
        if (totalCommissions > 1000000) {
          console.log('⚠️  WARNING: Commission amount seems excessive!');
          console.log('   Expected: ~Rp 200,000 - 300,000');
          console.log(`   Actual: Rp ${totalCommissions.toLocaleString('id-ID')}`);
          console.log('   Potential duplicate processing or calculation error');
        }
      }
      
      // Check recent transactions that might have triggered commissions
      const umarTransactions = await prisma.transaction.findMany({
        where: { userId: umar.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`\nRecent Transactions: ${umarTransactions.length}`);
      for (const tx of umarTransactions) {
        console.log(`  ${tx.id}: ${tx.status} - Rp ${tx.amount.toLocaleString('id-ID')}`);
        console.log(`    Membership: ${tx.membershipId || 'NONE'}`);
        console.log(`    Created: ${tx.createdAt.toLocaleDateString('id-ID')}`);
      }
      
    } else {
      console.log('❌ Member Umar not found');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 3. Summary of system issues found
    console.log('🔍 SUMMARY OF ISSUES DETECTED:');
    
    // Check for any PENDING transactions that might be stuck
    const pendingTransactions = await prisma.transaction.findMany({
      where: { 
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📋 Recent PENDING transactions: ${pendingTransactions.length}`);
    for (const tx of pendingTransactions) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true, email: true }
      });
      
      console.log(`  ${tx.id}: ${user ? user.name : 'Unknown'} - Rp ${tx.amount.toLocaleString('id-ID')}`);
      console.log(`    Payment: ${tx.paymentMethod} | Created: ${tx.createdAt.toLocaleDateString('id-ID')}`);
    }
    
    // Check for transactions with membershipId but no UserMembership
    const orphanedTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        membershipId: { not: null },
        NOT: {
          UserMembership: {
            transactionId: { not: null }
          }
        }
      },
      take: 10
    });
    
    console.log(`\n🔗 SUCCESS transactions missing UserMembership: ${orphanedTransactions.length}`);
    for (const tx of orphanedTransactions) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true, email: true }
      });
      
      console.log(`  ${tx.id}: ${user ? user.name : 'Unknown'} - ${tx.membershipId}`);
      console.log(`    Amount: Rp ${tx.amount.toLocaleString('id-ID')} | Created: ${tx.createdAt.toLocaleDateString('id-ID')}`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error during investigation:', error);
  }
}

// Run the investigation
investigateProblematicTransactions();