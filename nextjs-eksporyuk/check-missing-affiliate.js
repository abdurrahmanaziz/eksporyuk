/**
 * CHECK MISSING AFFILIATE & COMMISSION DATA
 * Find transactions that should have affiliate but don't
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMissingAffiliate() {
  console.log('\n=== CHECK MISSING AFFILIATE & COMMISSION ===\n');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Get all SUCCESS transactions
    const successTx = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      include: {
        affiliateConversion: true
      }
    });
    
    console.log('Total SUCCESS transactions:', successTx.length);
    
    // Count transactions with/without affiliate conversion
    const withConversion = successTx.filter(tx => tx.affiliateConversion);
    const withoutConversion = successTx.filter(tx => !tx.affiliateConversion);
    
    console.log(`\n📊 AFFILIATE CONVERSION STATUS:`);
    console.log(`- With AffiliateConversion: ${withConversion.length}`);
    console.log(`- Without AffiliateConversion: ${withoutConversion.length}`);
    
    // Check metadata for affiliate info
    let hasAffiliateInMeta = 0;
    let missingAffiliate = 0;
    const affiliateMetaSamples = [];
    
    for (const tx of withoutConversion) {
      const meta = tx.metadata || {};
      const affiliateId = meta.affiliateId || meta.affiliate_id || meta.sejoliAffiliateId;
      
      if (affiliateId && affiliateId !== '0' && affiliateId !== 0) {
        hasAffiliateInMeta++;
        if (affiliateMetaSamples.length < 5) {
          affiliateMetaSamples.push({
            id: tx.id,
            invoice: tx.invoiceNumber,
            amount: tx.amount,
            affiliateId,
            meta
          });
        }
      } else {
        missingAffiliate++;
      }
    }
    
    console.log(`\n📋 TRANSACTIONS WITHOUT CONVERSION:`);
    console.log(`- Has affiliate_id in metadata: ${hasAffiliateInMeta}`);
    console.log(`- No affiliate (legitimate): ${missingAffiliate}`);
    
    if (affiliateMetaSamples.length > 0) {
      console.log('\n⚠️  SAMPLES WITH AFFILIATE BUT NO CONVERSION:');
      affiliateMetaSamples.forEach((s, i) => {
        console.log(`\n${i+1}. ${s.invoice}`);
        console.log(`   Amount: Rp ${Number(s.amount).toLocaleString()}`);
        console.log(`   Affiliate ID in meta: ${s.affiliateId}`);
        console.log(`   sejoliOrderId: ${s.meta.sejoliOrderId || 'N/A'}`);
        console.log(`   product_id: ${s.meta.product_id || s.meta.productId || 'N/A'}`);
      });
    }
    
    // Check existing conversions
    const totalConversions = await prisma.affiliateConversion.count();
    const conversionSum = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log(`\n💰 CURRENT AFFILIATE CONVERSIONS:`);
    console.log(`- Total conversions: ${totalConversions}`);
    console.log(`- Total commission: Rp ${Number(conversionSum._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
    
    // Check affiliate profiles
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      include: { user: { select: { name: true, email: true } } }
    });
    
    console.log(`\n👥 AFFILIATE PROFILES: ${affiliateProfiles.length}`);
    
    // Sample affiliate profiles
    console.log('\nSample profiles:');
    affiliateProfiles.slice(0, 5).forEach(p => {
      console.log(`  - ${p.user?.name || 'N/A'} (${p.affiliateCode}) - Sejoli ID: ${p.sejoliAffiliateId || 'N/A'}`);
    });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`- SUCCESS transactions: ${successTx.length}`);
    console.log(`- With affiliate conversion: ${withConversion.length}`);
    console.log(`- Has affiliate in metadata but NO conversion: ${hasAffiliateInMeta}`);
    console.log(`- No affiliate at all: ${missingAffiliate}`);
    
    if (hasAffiliateInMeta > 0) {
      console.log(`\n⚠️  NEED TO CREATE ${hasAffiliateInMeta} AFFILIATE CONVERSIONS!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingAffiliate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
