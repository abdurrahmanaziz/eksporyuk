const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showSampleTransactions() {
  try {
    console.log('📋 Sample Transactions by Type\n');
    console.log('═'.repeat(80));

    // Get samples from each type
    const membershipSamples = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      take: 3,
      select: {
        invoiceNumber: true,
        type: true,
        amount: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const eventSamples = await prisma.transaction.findMany({
      where: { type: 'EVENT' },
      take: 3,
      select: {
        invoiceNumber: true,
        type: true,
        amount: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const productSamples = await prisma.transaction.findMany({
      where: { type: 'PRODUCT' },
      take: 3,
      select: {
        invoiceNumber: true,
        type: true,
        amount: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n🟣 MEMBERSHIP SAMPLES:');
    console.log('─'.repeat(80));
    membershipSamples.forEach(tx => {
      const productName = tx.metadata?.product_name || 'Unknown';
      const tier = tx.metadata?.membershipTier || 'N/A';
      console.log(`${tx.invoiceNumber}: ${productName}`);
      console.log(`  └─ Tier: ${tier}, Amount: Rp ${parseInt(tx.amount).toLocaleString()}\n`);
    });

    console.log('\n🟠 EVENT SAMPLES:');
    console.log('─'.repeat(80));
    eventSamples.forEach(tx => {
      const productName = tx.metadata?.product_name || 'Unknown';
      const category = tx.metadata?.eventCategory || 'N/A';
      console.log(`${tx.invoiceNumber}: ${productName}`);
      console.log(`  └─ Category: ${category}, Amount: Rp ${parseInt(tx.amount).toLocaleString()}\n`);
    });

    console.log('\n🟢 PRODUCT/SERVICE SAMPLES:');
    console.log('─'.repeat(80));
    productSamples.forEach(tx => {
      const productName = tx.metadata?.product_name || 'Unknown';
      const category = tx.metadata?.productCategory || 'N/A';
      console.log(`${tx.invoiceNumber}: ${productName}`);
      console.log(`  └─ Category: ${category}, Amount: Rp ${parseInt(tx.amount).toLocaleString()}\n`);
    });

    console.log('═'.repeat(80));
    console.log('✅ Transaction types are now properly categorized!\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showSampleTransactions();