const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

const prisma = new PrismaClient();

async function fixAffiliateCommissions() {
  console.log('🔧 FIXING AFFILIATE COMMISSIONS BERDASARKAN PRODUK SEJOLI\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Load Sejoli data untuk dapat product_id per order
    const sejoli = JSON.parse(
      fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8')
    );

    // Get all AffiliateConversion records
    const conversions = await prisma.affiliateConversion.findMany({
      include: {
        transaction: {
          select: {
            externalId: true,
            amount: true
          }
        },
        affiliate: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 Total AffiliateConversion records: ${conversions.length}\n`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let notFound = 0;
    let errors = [];

    for (const conv of conversions) {
      try {
        // Find order di Sejoli berdasarkan externalId
        const sejOrder = sejoli.orders.find(o => o.id == conv.transaction.externalId);
        
        if (!sejOrder) {
          notFound++;
          errors.push({
            convId: conv.id,
            externalId: conv.transaction.externalId,
            reason: 'Order not found in Sejoli'
          });
          continue;
        }

        // Get correct commission based on product
        const correctCommission = getCommissionForProduct(sejOrder.product_id);
        
        // Check if commission is correct
        if (conv.commissionAmount === correctCommission) {
          alreadyCorrect++;
        } else {
          // Update commission
          await prisma.affiliateConversion.update({
            where: { id: conv.id },
            data: { commissionAmount: correctCommission }
          });
          
          fixed++;
          
          if (fixed <= 5) {
            console.log(`✅ Fixed conversion ${conv.id}`);
            console.log(`   Order: ${conv.transaction.externalId} | Product: ${sejOrder.product_id}`);
            console.log(`   Old: Rp ${conv.commissionAmount.toLocaleString('id-ID')} → New: Rp ${correctCommission.toLocaleString('id-ID')}`);
            console.log('');
          }
        }
      } catch (err) {
        errors.push({
          convId: conv.id,
          externalId: conv.transaction.externalId,
          reason: err.message
        });
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Already Correct: ${alreadyCorrect}`);
    console.log(`🔧 Fixed: ${fixed}`);
    console.log(`❌ Not Found: ${notFound}`);
    console.log(`⚠️  Errors: ${errors.length}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n❌ ERRORS:');
      errors.forEach(e => {
        console.log(`  - Conv ${e.convId} (Order ${e.externalId}): ${e.reason}`);
      });
    }

    console.log('\n✅ DONE! Commission data diperbaiki berdasarkan produk Sejoli.');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAffiliateCommissions();
