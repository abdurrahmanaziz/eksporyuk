const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateTransactionIssues() {
  try {
    console.log('🔍 INVESTIGATING TRANSACTION ISSUES FROM SCREENSHOT...\n');
    
    // 1. Check Member Umar over-credited commission
    console.log('=== ISSUE 1: MEMBER UMAR OVER-CREDITED ===');
    const umarTx = await prisma.transaction.findUnique({
      where: { id: 'txn_1767578979716_psftdqns4jb' },
      select: {
        id: true,
        amount: true,
        membershipId: true,
        affiliateId: true
      }
    });
    
    console.log('Transaction Amount: Rp', Number(umarTx.amount).toLocaleString('id-ID'));
    
    if (umarTx.membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: umarTx.membershipId },
        select: {
          name: true,
          affiliateCommissionRate: true,
          commissionType: true
        }
      });
      
      console.log('Membership:', membership.name);
      console.log('Commission Rate:', membership.affiliateCommissionRate, membership.commissionType);
      
      // Calculate expected
      const txAmount = Number(umarTx.amount);
      const rate = Number(membership.affiliateCommissionRate);
      
      let expected = 0;
      if (membership.commissionType === 'FLAT') {
        expected = Math.min(rate, txAmount);
      } else {
        expected = (txAmount * rate) / 100;
      }
      
      console.log('Expected Commission: Rp', expected.toLocaleString('id-ID'));
      console.log('Actual Credited: Rp 1,597,914,000 (MASSIVE OVERCREDIT!)');
      
      // Check wallet transactions
      const walletTxs = await prisma.walletTransaction.findMany({
        where: { reference: umarTx.id }
      });
      
      console.log('Wallet Transactions:', walletTxs.length);
      walletTxs.forEach((wt, i) => {
        console.log(`  ${i+1}. ${wt.type}: Rp ${Number(wt.amount).toLocaleString('id-ID')} at ${wt.createdAt}`);
      });
    }
    
    console.log('\n=== ISSUE 2: BRAHMA ANDIRA NOT ACTIVATED ===');
    
    // 2. Check Brahma Andira transactions
    const brahmaAll = await prisma.transaction.findMany({
      where: {
        OR: [
          { customerEmail: 'brahmandira@gmail.com' },
          { customerName: { contains: 'Brahma' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total Brahma transactions:', brahmaAll.length);
    brahmaAll.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.paymentMethod} - ${tx.status}`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`);
      console.log(`   External: ${tx.externalId}`);
      console.log(`   Created: ${tx.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Paid: ${tx.paidAt || 'NOT PAID'}`);
      console.log('');
    });
    
    // 3. Check low commission issue
    console.log('=== ISSUE 3: LOW COMMISSIONS ===');
    const lowCommissions = await prisma.walletTransaction.findMany({
      where: {
        type: 'COMMISSION',
        amount: { lt: 300000 } // Less than 300k
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Recent low commissions:');
    for (const wt of lowCommissions) {
      const tx = await prisma.transaction.findUnique({
        where: { id: wt.reference }
      });
      
      if (tx) {
        console.log(`- Rp ${Number(wt.amount).toLocaleString('id-ID')} for tx ${tx.customerName} (Rp ${Number(tx.amount).toLocaleString('id-ID')})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTransactionIssues();