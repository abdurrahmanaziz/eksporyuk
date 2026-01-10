const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recoveryAffiliateProfiles() {
  console.log('🔄 RECOVERING AFFILIATE PROFILES FROM ORPHANED CONVERSIONS\n');
  
  try {
    // Get all unique affiliate IDs from conversions with their totals
    const orphanedConversions = await prisma.$queryRaw`
      SELECT DISTINCT "affiliateId", COUNT(*) as count, SUM("commissionAmount") as total
      FROM "AffiliateConversion"
      GROUP BY "affiliateId"
      ORDER BY SUM("commissionAmount") DESC
    `;
    
    console.log(`Found ${orphanedConversions.length} orphaned affiliate records\n`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let totalCommission = 0;
    
    for (const orphan of orphanedConversions) {
      const affiliateId = orphan.affiliateId;
      const commissionAmount = Number(orphan.total || 0);
      const conversionCount = Number(orphan.count || 0);
      
      // Check if affiliate profile already exists
      const existingProfile = await prisma.affiliateProfile.findUnique({
        where: { id: affiliateId },
      });
      
      if (existingProfile) {
        console.log(`⏭️  Affiliate ${affiliateId} already exists, skipping`);
        skippedCount++;
        totalCommission += commissionAmount;
        continue;
      }
      
      // Since we don't have user data for these orphaned affiliates,
      // we'll need to create a reference or mark them
      // For now, let's just accumulate the data
      console.log(`📍 Orphaned: ${affiliateId}, Conversions: ${conversionCount}, Total: Rp ${commissionAmount.toLocaleString('id-ID')}`);
      createdCount++;
      totalCommission += commissionAmount;
    }
    
    console.log(`\n✅ RECOVERY ANALYSIS COMPLETE!\n`);
    console.log(`Orphaned affiliates found: ${createdCount}`);
    console.log(`Already have profiles: ${skippedCount}`);
    console.log(`Total commission to recover: Rp ${totalCommission.toLocaleString('id-ID')}`);
    
    console.log(`\n⚠️  PROBLEM: These affiliate profiles don't have matching users!`);
    console.log(`Options:`);
    console.log(`1. Clean up these orphaned records (DELETE from AffiliateConversion)`);
    console.log(`2. Consolidate all commissions to existing affiliate (b5906e008c81954ecefdc938da3073e7)`);
    console.log(`3. Re-import affiliate data from backup\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recoveryAffiliateProfiles();
