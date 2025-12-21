const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebinarCommissions() {
  // Get all webinar/event transactions from metadata
  const webinarTx = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      OR: [
        { metadata: { path: ['productName'], string_contains: 'Webinar' } },
        { metadata: { path: ['productName'], string_contains: 'Zoom' } },
        { metadata: { path: ['productName'], string_contains: 'Kopdar' } },
        { metadata: { path: ['productName'], string_contains: 'Workshop' } }
      ]
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      metadata: true
    }
  });
  
  console.log('=== Webinar/Event Commission Analysis ===\n');
  console.log('Total transactions:', webinarTx.length);
  
  // Group by product name
  const productData = {};
  
  for (const tx of webinarTx) {
    const productName = tx.metadata?.productName || 'Unknown';
    const amount = Number(tx.amount || 0);
    const commission = Number(tx.metadata?.commissionAmount || 0);
    
    if (!productData[productName]) {
      productData[productName] = {
        count: 0,
        prices: {},
        commissions: {},
        samples: []
      };
    }
    
    productData[productName].count++;
    
    // Track price variations
    const priceKey = amount.toString();
    productData[productName].prices[priceKey] = (productData[productName].prices[priceKey] || 0) + 1;
    
    // Track commission variations
    const commKey = commission.toString();
    productData[productName].commissions[commKey] = (productData[productName].commissions[commKey] || 0) + 1;
    
    // Store samples
    if (productData[productName].samples.length < 5) {
      productData[productName].samples.push({
        invoice: tx.invoiceNumber,
        amount: amount,
        commission: commission,
        percentage: amount > 0 ? (commission / amount * 100).toFixed(1) : 0
      });
    }
  }
  
  // Sort by count
  const sorted = Object.entries(productData).sort((a, b) => b[1].count - a[1].count);
  
  console.log('\n=== Commission Structure by Product ===\n');
  
  for (const [productName, data] of sorted) {
    console.log('📌', productName);
    console.log('   Total:', data.count, 'transactions');
    
    // Show price variations
    console.log('   Prices:');
    for (const [price, count] of Object.entries(data.prices)) {
      console.log('     Rp', Number(price).toLocaleString('id-ID'), '→', count, 'times');
    }
    
    // Show commission variations
    console.log('   Commissions:');
    for (const [comm, count] of Object.entries(data.commissions)) {
      console.log('     Rp', Number(comm).toLocaleString('id-ID'), '→', count, 'times');
    }
    
    // Show samples
    console.log('   Samples:');
    for (const s of data.samples) {
      console.log('     ' + s.invoice + ': Rp ' + s.amount.toLocaleString('id-ID') + 
                  ' → Komisi: Rp ' + s.commission.toLocaleString('id-ID') + 
                  ' (' + s.percentage + '%)');
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkWebinarCommissions().catch(console.error);
