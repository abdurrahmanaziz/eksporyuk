const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixConversionsByName() {
  console.log('\n🔧 Creating Conversions by Matching Affiliate Names');
  console.log('====================================================\n');

  try {
    // Get all transactions with affiliate metadata but no conversion
    console.log('Step 1: Finding transactions with affiliate names...');
    
    const transactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' }
    });
    
    const withAffiliate = transactions.filter(tx => 
      tx.metadata && 
      typeof tx.metadata === 'object' && 
      tx.metadata.affiliateName
    );
    
    console.log(`Found ${withAffiliate.length} transactions with affiliate names\n`);
    
    // Check which need conversions
    let needConversion = [];
    for (const tx of withAffiliate) {
      const existing = await prisma.affiliateConversion.findUnique({
        where: { transactionId: tx.id }
      });
      
      if (!existing) {
        needConversion.push(tx);
      }
    }
    
    console.log(`${needConversion.length} need conversions\n`);

    if (needConversion.length === 0) {
      console.log('✅ All transactions already have conversions!');
      return;
    }

    // Build name to profile mapping
    console.log('Step 2: Building name to affiliate profile mapping...');
    
    const allProfiles = await prisma.affiliateProfile.findMany();
    console.log(`Found ${allProfiles.length} affiliate profiles`);
    
    // Get users for all profiles
    const profileMap = new Map();
    
    for (const profile of allProfiles) {
      const user = await prisma.user.findUnique({
        where: { id: profile.userId }
      });
      
      if (user) {
        // Store by normalized name (lowercase, trimmed)
        const normalizedName = user.name.toLowerCase().trim();
        profileMap.set(normalizedName, {
          profileId: profile.id,
          userName: user.name,
          userEmail: user.email
        });
      }
    }
    
    console.log(`Mapped ${profileMap.size} profiles by name\n`);

    // Create conversions
    console.log('Step 3: Creating conversions...\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of needConversion) {
      try {
        const metadata = tx.metadata;
        const affiliateName = metadata.affiliateName;
        const commissionAmount = metadata.commissionAmount || 0;

        // Normalize name and look up
        const normalizedName = affiliateName.toLowerCase().trim();
        const mapping = profileMap.get(normalizedName);
        
        if (!mapping) {
          // Try partial match
          let found = null;
          for (const [name, data] of profileMap.entries()) {
            if (name.includes(normalizedName) || normalizedName.includes(name)) {
              found = data;
              break;
            }
          }
          
          if (!found) {
            if (skipped < 10) {
              console.log(`⚠️  No profile for "${affiliateName}" - INV${tx.invoiceNumber}`);
            }
            skipped++;
            continue;
          }
          
          mapping = found;
        }

        // Calculate commission rate
        const commissionRate = tx.amount > 0 ? (commissionAmount / parseFloat(tx.amount)) * 100 : 0;

        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: mapping.profileId,
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
        if (error.code === 'P2002') {
          skipped++;
        } else {
          if (errors < 5) {
            console.error(`Error processing INV${tx.invoiceNumber}:`, error.message);
          }
          errors++;
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('=====================================');
    console.log(`Transactions with affiliate names: ${withAffiliate.length}`);
    console.log(`Needed conversions: ${needConversion.length}`);
    console.log(`✅ Successfully created: ${created}`);
    console.log(`⚠️  Skipped (no match): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');

    // Verify INV19285
    console.log('🔍 Verifying INV19285...');
    const inv19285 = await prisma.transaction.findFirst({
      where: { invoiceNumber: 'INV19285' }
    });

    if (inv19285) {
      const conv19285 = await prisma.affiliateConversion.findUnique({
        where: { transactionId: inv19285.id }
      });

      if (conv19285) {
        console.log('✅ INV19285 conversion created!');
        console.log(`   Commission: Rp ${conv19285.commissionAmount.toLocaleString('id-ID')}`);
        
        const profile = await prisma.affiliateProfile.findUnique({
          where: { id: conv19285.affiliateId }
        });
        
        if (profile) {
          const affUser = await prisma.user.findUnique({
            where: { id: profile.userId }
          });
          console.log(`   Affiliate: ${affUser?.name || 'Unknown'}`);
        }
      } else {
        console.log('❌ INV19285 conversion still missing');
        if (inv19285.metadata) {
          console.log(`   Affiliate Name in metadata: ${inv19285.metadata.affiliateName}`);
        }
      }
    }
    
    // Final totals
    const totalConversions = await prisma.affiliateConversion.count();
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('');
    console.log('📈 Database Totals:');
    console.log(`Total Conversions: ${totalConversions.toLocaleString()}`);
    console.log(`Total Commission: Rp ${totalCommission._sum.commissionAmount?.toLocaleString('id-ID') || 0}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConversionsByName();
