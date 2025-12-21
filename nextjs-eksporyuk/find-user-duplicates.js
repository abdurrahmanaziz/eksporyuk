/**
 * FIND DUPLICATES: Transactions from same user with different invoice formats
 * INV##### (5 digit) = Sejoli original
 * INV###### (6 digit) = Web baru generated
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicates() {
  console.log('\n=== FIND USER DUPLICATES ===\n');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Get all SUCCESS transactions
    const allTx = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { 
        id: true, 
        userId: true,
        invoiceNumber: true, 
        amount: true, 
        metadata: true,
        createdAt: true 
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Total SUCCESS transactions:', allTx.length);
    
    // Categorize by invoice format
    const sejoliInvoices = allTx.filter(tx => {
      if (!tx.invoiceNumber) return false;
      // INV followed by 5 digits or less = Sejoli
      const match = tx.invoiceNumber.match(/^INV(\d+)$/);
      if (!match) return false;
      return match[1].length <= 5;
    });
    
    const newInvoices = allTx.filter(tx => {
      if (!tx.invoiceNumber) return false;
      // INV followed by 6 digits = Web baru
      const match = tx.invoiceNumber.match(/^INV(\d+)$/);
      if (!match) return false;
      return match[1].length === 6;
    });
    
    const otherInvoices = allTx.filter(tx => {
      if (!tx.invoiceNumber) return true;
      const match = tx.invoiceNumber.match(/^INV(\d+)$/);
      return !match;
    });
    
    console.log('\n📊 INVOICE FORMAT BREAKDOWN:');
    console.log(`- Sejoli (INV + 5 digit or less): ${sejoliInvoices.length}`);
    console.log(`- Web Baru (INV + 6 digit): ${newInvoices.length}`);
    console.log(`- Other format: ${otherInvoices.length}`);
    
    // Calculate revenue
    const sejoliRevenue = sejoliInvoices.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const newRevenue = newInvoices.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    console.log(`\n💰 REVENUE:`)
    console.log(`- Sejoli: Rp ${sejoliRevenue.toLocaleString('id-ID')}`);
    console.log(`- Web Baru: Rp ${newRevenue.toLocaleString('id-ID')}`);
    
    // Find users with transactions in BOTH systems
    const sejoliUserIds = new Set(sejoliInvoices.map(tx => tx.userId));
    const newUserIds = new Set(newInvoices.map(tx => tx.userId));
    
    const usersInBoth = [...sejoliUserIds].filter(id => newUserIds.has(id));
    console.log(`\n👥 USERS IN BOTH SYSTEMS: ${usersInBoth.length}`);
    
    // Detailed analysis of overlapping users
    console.log('\n🔍 ANALYZING POTENTIAL DUPLICATES...');
    
    let potentialDuplicates = 0;
    let duplicateAmount = 0;
    const duplicateDetails = [];
    
    for (const userId of usersInBoth) {
      const userSejoliTx = sejoliInvoices.filter(tx => tx.userId === userId);
      const userNewTx = newInvoices.filter(tx => tx.userId === userId);
      
      // Check if amounts match (potential duplicate)
      for (const sTx of userSejoliTx) {
        for (const nTx of userNewTx) {
          if (Number(sTx.amount) === Number(nTx.amount)) {
            potentialDuplicates++;
            duplicateAmount += Number(nTx.amount);
            
            if (duplicateDetails.length < 10) {
              duplicateDetails.push({
                userId,
                sejoli: { inv: sTx.invoiceNumber, amount: sTx.amount, date: sTx.createdAt },
                new: { inv: nTx.invoiceNumber, amount: nTx.amount, date: nTx.createdAt }
              });
            }
          }
        }
      }
    }
    
    console.log(`\n⚠️  POTENTIAL DUPLICATES (same user, same amount): ${potentialDuplicates}`);
    console.log(`💸 Duplicate Amount: Rp ${duplicateAmount.toLocaleString('id-ID')}`);
    
    // Show samples
    if (duplicateDetails.length > 0) {
      console.log('\n📋 SAMPLE DUPLICATES:');
      duplicateDetails.forEach((d, i) => {
        console.log(`\n${i+1}. User: ${d.userId.slice(0,8)}...`);
        console.log(`   Sejoli: ${d.sejoli.inv} | Rp ${Number(d.sejoli.amount).toLocaleString()} | ${new Date(d.sejoli.date).toLocaleDateString()}`);
        console.log(`   New:    ${d.new.inv} | Rp ${Number(d.new.amount).toLocaleString()} | ${new Date(d.new.date).toLocaleDateString()}`);
      });
    }
    
    // Expected vs Actual
    console.log('\n📊 SUMMARY:');
    console.log('Expected (Sejoli): ~12,857 SUCCESS, Rp 4,138,916,962');
    console.log(`Actual Sejoli invoices: ${sejoliInvoices.length}, Rp ${sejoliRevenue.toLocaleString('id-ID')}`);
    console.log(`Web Baru invoices (potential duplicates): ${newInvoices.length}, Rp ${newRevenue.toLocaleString('id-ID')}`);
    
    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    if (newInvoices.length > 0) {
      console.log(`Delete ${newInvoices.length} "Web Baru" transactions (INV + 6 digit)`);
      console.log('These are duplicates of Sejoli data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
