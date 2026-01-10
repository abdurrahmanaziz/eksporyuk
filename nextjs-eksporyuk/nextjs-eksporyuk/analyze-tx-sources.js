/**
 * Analyze Transaction Sources
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  console.log('📊 DETAILED ANALYSIS\n');
  
  // Get all SUCCESS transactions
  const allTx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { id: true, metadata: true, amount: true, invoiceNumber: true }
  });
  
  console.log('Total SUCCESS transactions:', allTx.length);
  
  let fromSejoliSync = 0, fromOther = 0;
  let revenueSync = 0, revenueOther = 0;
  
  const otherSamples = [];
  
  allTx.forEach(tx => {
    const meta = tx.metadata;
    if (meta && meta.sejoli_order_id) {
      fromSejoliSync++;
      revenueSync += Number(tx.amount);
    } else {
      fromOther++;
      revenueOther += Number(tx.amount);
      if (otherSamples.length < 10) {
        otherSamples.push(tx);
      }
    }
  });
  
  console.log('\n📊 SUCCESS TRANSACTIONS BREAKDOWN:');
  console.log('From Sejoli sync (has sejoli_order_id):', fromSejoliSync);
  console.log('  Revenue: Rp', revenueSync.toLocaleString('id-ID'));
  console.log('');
  console.log('From other sources (no sejoli_order_id):', fromOther);
  console.log('  Revenue: Rp', revenueOther.toLocaleString('id-ID'));
  console.log('');
  console.log('TOTAL SUCCESS:', (fromSejoliSync + fromOther));
  console.log('TOTAL REVENUE: Rp', (revenueSync + revenueOther).toLocaleString('id-ID'));
  
  // Show samples of "other" transactions
  console.log('\n📝 SAMPLE "OTHER" TRANSACTIONS (without sejoli_order_id):');
  otherSamples.forEach((tx, i) => {
    const meta = tx.metadata || {};
    console.log(`\n${i+1}. ${tx.invoiceNumber || tx.id.slice(0,8)} | Rp ${Number(tx.amount).toLocaleString()}`);
    console.log('   Metadata:', JSON.stringify(meta).substring(0, 200));
  });
  
  // Check if these "other" transactions might be duplicates from original import
  console.log('\n🔍 CHECKING IF "OTHER" ARE DUPLICATES...');
  
  // Compare with Sejoli export
  const fs = require('fs');
  const sejoliData = JSON.parse(fs.readFileSync('sejoli-sales-1766146821365.json', 'utf8'));
  const sejoliByInvoice = {};
  sejoliData.forEach(o => {
    sejoliByInvoice['INV' + o.ID] = o;
  });
  
  let potentialDuplicates = 0;
  otherSamples.forEach(tx => {
    if (tx.invoiceNumber && sejoliByInvoice[tx.invoiceNumber]) {
      potentialDuplicates++;
      console.log(`  POTENTIAL DUPLICATE: ${tx.invoiceNumber}`);
    }
  });
  
  // Count all potential duplicates
  let totalPotentialDuplicates = 0;
  allTx.forEach(tx => {
    const meta = tx.metadata;
    if (!meta || !meta.sejoli_order_id) {
      if (tx.invoiceNumber && sejoliByInvoice[tx.invoiceNumber]) {
        totalPotentialDuplicates++;
      }
    }
  });
  
  console.log('\nTotal potential duplicates (invoice exists in both):', totalPotentialDuplicates);
  
  await prisma.$disconnect();
}

analyze()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
