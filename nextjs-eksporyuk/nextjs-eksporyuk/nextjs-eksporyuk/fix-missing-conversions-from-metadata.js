const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingConversions() {
  console.log('\n🔧 Fixing Missing Affiliate Conversions from Metadata');
  console.log('=======================================================\n');

  try {
    // 1. Find all SUCCESS transactions - we'll filter metadata in JS
    console.log('Step 1: Finding all SUCCESS transactions...');
    
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      }
    });

    console.log(`Found ${transactions.length} SUCCESS transactions`);
    
    // Filter for those with affiliateId in metadata
    const withAffiliate = transactions.filter(tx => 
      tx.metadata && 
      typeof tx.metadata === 'object' && 
      tx.metadata.affiliateId
    );
    
    console.log(`${withAffiliate.length} have affiliate metadata\n`);

    // 2. Check which ones already have conversions
    let needConversion = [];
    for (const tx of withAffiliate) {
      const existing = await prisma.affiliateConversion.findUnique({
        where: { transactionId: tx.id }
      });
      
      if (!existing && tx.metadata && tx.metadata.affiliateId) {
        needConversion.push(tx);
      }
    }

    console.log(`${needConversion.length} transactions need conversion records\n`);

    if (needConversion.length === 0) {
      console.log('✅ All transactions already have conversions!');
      return;
    }

    // 3. Group by affiliateId to find/create profiles
    console.log('Step 2: Mapping affiliate IDs to profiles...\n');
    
    const affiliateIds = [...new Set(needConversion.map(tx => tx.metadata.affiliateId))];
    console.log(`Found ${affiliateIds.length} unique affiliate IDs`);

    // 4. Create conversions
    console.log('\nStep 3: Creating conversion records...\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of needConversion) {
      try {
        const metadata = tx.metadata;
        const affiliateSejoliId = metadata.affiliateId;
        const commissionAmount = metadata.commissionAmount || 0;
        const productId = metadata.sejoliProductId;

        // Find affiliate profile by sejoliAffiliateId
        const profile = await prisma.affiliateProfile.findFirst({
          where: { sejoliAffiliateId: String(affiliateSejoliId) }
        });

        if (!profile) {
          console.log(`⚠️  No profile for affiliate ${affiliateSejoliId} (${metadata.affiliateName || 'unknown'}) - skipping INV${tx.invoiceNumber}`);
          skipped++;
          continue;
        }

        // Calculate commission rate
        const commissionRate = tx.amount > 0 ? (commissionAmount / tx.amount) * 100 : 0;

        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: profile.id,
            transactionId: tx.id,
            commissionAmount: commissionAmount,
            commissionRate: commissionRate,
            paidOut: false
          }
        });

        created++;
        
        if (created % 100 === 0) {
          console.log(`  Progress: ${created} conversions created...`);
        }

      } catch (error) {
        console.error(`Error processing ${tx.invoiceNumber}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('=====================================');
    console.log(`Total transactions checked: ${transactions.length}`);
    console.log(`Needed conversions: ${needConversion.length}`);
    console.log(`✅ Successfully created: ${created}`);
    console.log(`⚠️  Skipped (no profile): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');

    // Verify INV19285 specifically
    console.log('🔍 Verifying INV19285...');
    const inv19285 = await prisma.transaction.findFirst({
      where: { invoiceNumber: 'INV19285' }
    });

    if (inv19285) {
      const conv19285 = await prisma.affiliateConversion.findUnique({
        where: { transactionId: inv19285.id }
      });

      if (conv19285) {
        console.log('✅ INV19285 now has conversion!');
        console.log(`   Commission: Rp ${conv19285.commissionAmount.toLocaleString('id-ID')}`);
      } else {
        console.log('❌ INV19285 still missing conversion');
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingConversions();
