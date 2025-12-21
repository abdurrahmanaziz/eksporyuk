const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixConversionsWithSejoliMapping() {
  console.log('\n🔧 Creating Missing Conversions using Sejoli Affiliate Mapping');
  console.log('==============================================================\n');

  try {
    // Load Sejoli data
    console.log('Step 1: Loading Sejoli export data...');
    const sejoliDataPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const sejoliData = JSON.parse(fs.readFileSync(sejoliDataPath, 'utf-8'));
    
    console.log(`Loaded ${sejoliData.affiliates.length} Sejoli affiliates`);
    console.log(`Loaded ${sejoliData.users.length} Sejoli users\n`);

    // Create mapping: sejoliAffiliateCode -> affiliateProfileId
    console.log('Step 2: Building affiliate mapping from Sejoli data...');
    
    const affiliateMap = new Map();
    let mappedCount = 0;
    
    for (const sejolAff of sejoliData.affiliates) {
      // Find the user in Sejoli by user_id
      const sejoliUser = sejoliData.users.find(u => u.ID === sejolAff.user_id);
      if (!sejoliUser) continue;
      
      // Find the user in Next.js database by email
      const nextjsUser = await prisma.user.findUnique({
        where: { email: sejoliUser.user_email }
      });
      
      if (!nextjsUser) continue;
      
      // Find affiliate profile for this user
      const profile = await prisma.affiliateProfile.findUnique({
        where: { userId: nextjsUser.id }
      });
      
      if (!profile) continue;
      
      affiliateMap.set(sejolAff.affiliate_code, {
        sejoliUserId: sejolAff.user_id,
        nextjsUserId: nextjsUser.id,
        affiliateProfileId: profile.id,
        name: sejolAff.name,
        email: sejolAff.email
      });
      
      mappedCount++;
      if (mappedCount % 10 === 0) {
        process.stdout.write(`\r  Mapped: ${mappedCount}...`);
      }
    }
    
    console.log(`\r  Successfully mapped ${affiliateMap.size} affiliates\n`);

    // Get all SUCCESS transactions with affiliate metadata but no conversion
    console.log('Step 3: Finding transactions needing conversions...');
    
    const transactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' }
    });
    
    const withAffiliate = transactions.filter(tx => 
      tx.metadata && 
      typeof tx.metadata === 'object' && 
      tx.metadata.affiliateId
    );
    
    console.log(`Found ${withAffiliate.length} transactions with affiliate data`);
    
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

    // Create conversions
    console.log('Step 4: Creating conversions...\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of needConversion) {
      try {
        const metadata = tx.metadata;
        const sejoliAffiliateCode = metadata.affiliateId;
        const commissionAmount = metadata.commissionAmount || 0;

        // Look up affiliate profile
        const mapping = affiliateMap.get(sejoliAffiliateCode);
        
        if (!mapping) {
          console.log(`⚠️  No mapping for Sejoli affiliate ${sejoliAffiliateCode} - INV${tx.invoiceNumber}`);
          skipped++;
          continue;
        }

        // Calculate commission rate
        const commissionRate = tx.amount > 0 ? (commissionAmount / parseFloat(tx.amount)) * 100 : 0;

        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: mapping.affiliateProfileId,
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
          // Unique constraint violation - conversion already exists
          skipped++;
        } else {
          console.error(`Error processing INV${tx.invoiceNumber}:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('=====================================');
    console.log(`Transactions with affiliate: ${withAffiliate.length}`);
    console.log(`Needed conversions: ${needConversion.length}`);
    console.log(`✅ Successfully created: ${created}`);
    console.log(`⚠️  Skipped (no mapping): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');

    // Verify specific cases
    console.log('🔍 Verification:');
    
    // Check INV19285
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
      }
    }
    
    // Check total
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

fixConversionsWithSejoliMapping();
