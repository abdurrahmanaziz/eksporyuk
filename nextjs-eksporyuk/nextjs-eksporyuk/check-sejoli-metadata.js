const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSejoliMetadata() {
  console.log('🔍 Checking Sejoli Transaction Metadata for Expiry Info...\n');

  try {
    // Get sample Sejoli transactions with metadata
    const sejoliTransactions = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { startsWith: 'INV' },
        type: 'MEMBERSHIP'
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Checking ${sejoliTransactions.length} Sejoli MEMBERSHIP transactions\n`);
    console.log('═'.repeat(100) + '\n');

    sejoliTransactions.forEach((tx, idx) => {
      const metadata = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
      
      console.log(`${idx + 1}. ${tx.invoiceNumber}`);
      console.log(`   Customer: ${tx.customerEmail}`);
      console.log(`   Amount: Rp ${tx.amount.toLocaleString()}`);
      console.log(`   Paid At: ${tx.paidAt ? new Date(tx.paidAt).toLocaleString('id-ID') : 'N/A'}`);
      console.log(`   Created: ${new Date(tx.createdAt).toLocaleString('id-ID')}`);
      
      if (metadata) {
        console.log(`   Metadata Keys: ${Object.keys(metadata).join(', ')}`);
        
        // Look for date-related fields
        const dateFields = ['expiryDate', 'expiredAt', 'expireDate', 'validUntil', 'endDate', 
                           'membershipExpiry', 'subscriptionEnd', 'duration', 'membershipTier',
                           'sejoli_expire', 'sejoli_end_date', 'expired_date'];
        
        const foundDates = {};
        dateFields.forEach(field => {
          if (metadata[field]) {
            foundDates[field] = metadata[field];
          }
        });
        
        if (Object.keys(foundDates).length > 0) {
          console.log(`   📅 Date Fields Found:`);
          Object.entries(foundDates).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        } else {
          console.log(`   ⚠️ No expiry date info found in metadata`);
        }
        
        // Show full metadata for first 3
        if (idx < 3) {
          console.log(`   Full Metadata:`, JSON.stringify(metadata, null, 2));
        }
      } else {
        console.log(`   ⚠️ No metadata`);
      }
      
      console.log('');
    });

    console.log('═'.repeat(100));
    console.log('\n📋 METADATA STRUCTURE ANALYSIS:\n');
    
    // Analyze all unique metadata keys
    const allKeys = new Set();
    sejoliTransactions.forEach(tx => {
      const metadata = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
      if (metadata) {
        Object.keys(metadata).forEach(key => allKeys.add(key));
      }
    });
    
    console.log('All unique metadata keys found across transactions:');
    console.log(Array.from(allKeys).sort().join(', '));
    
    console.log('\n\n💡 RECOMMENDATION:\n');
    console.log('Jika metadata dari Sejoli memiliki field expiry date asli,');
    console.log('kita bisa hitung sisa waktu dengan formula:');
    console.log('');
    console.log('remainingDays = sejoli_expiry_date - now');
    console.log('new_end_date = now + remainingDays');
    console.log('');
    console.log('Jika TIDAK ada field expiry, kita bisa:');
    console.log('1. Berikan membership PENUH dari sekarang (fresh start)');
    console.log('2. Atau tanya user untuk data expiry dari Sejoli');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSejoliMetadata();
