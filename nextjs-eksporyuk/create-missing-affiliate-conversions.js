const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

const prisma = new PrismaClient();

async function createMissingAffiliateConversions() {
  console.log('🔧 CREATING MISSING AFFILIATE CONVERSIONS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Load Sejoli data
    const sejoli = JSON.parse(
      fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8')
    );

    // Get completed orders with affiliate
    const ordersWithAffiliate = sejoli.orders.filter(
      o => o.status === 'completed' && o.affiliate_id
    );

    console.log(`📦 Sejoli orders with affiliate: ${ordersWithAffiliate.length}\n`);

    // Get existing AffiliateConversions to avoid duplicates
    const existingConversions = await prisma.affiliateConversion.findMany({
      select: {
        transactionId: true
      }
    });
    const existingTxIds = new Set(existingConversions.map(c => c.transactionId));

    let created = 0;
    let skipped = 0;
    let errors = [];

    for (const order of ordersWithAffiliate) {
      try {
        // Find transaction in DB
        const transaction = await prisma.transaction.findFirst({
          where: {
            externalId: String(order.id),
            status: 'SUCCESS'
          }
        });

        if (!transaction) {
          skipped++;
          continue;
        }

        // Skip if already has conversion
        if (existingTxIds.has(transaction.id)) {
          skipped++;
          continue;
        }

        // Find affiliate by Sejoli user_id (NOT id!)
        const sejAffiliate = sejoli.affiliates.find(a => a.user_id == order.affiliate_id);
        if (!sejAffiliate) {
          errors.push({ orderId: order.id, reason: 'Affiliate not found in Sejoli' });
          continue;
        }

        // Find affiliate profile in DB
        const affiliateProfile = await prisma.affiliateProfile.findFirst({
          where: {
            user: {
              email: sejAffiliate.user_email
            }
          }
        });

        if (!affiliateProfile) {
          errors.push({ orderId: order.id, email: sejAffiliate.user_email, reason: 'Affiliate profile not found in DB' });
          continue;
        }

        // Get commission
        const commission = getCommissionForProduct(order.product_id);

        // Create AffiliateConversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateProfile.id,
            transactionId: transaction.id,
            commissionAmount: commission,
            commissionRate: 0, // Flat commission
            paidOut: false,
            commissionStatus: 'PENDING',
            clickedAt: new Date(order.created_at),
            convertedAt: new Date(order.created_at)
          }
        });

        created++;

        if (created <= 5) {
          console.log(`✅ Created conversion for order ${order.id}`);
          console.log(`   Affiliate: ${sejAffiliate.user_email}`);
          console.log(`   Commission: Rp ${commission.toLocaleString('id-ID')}`);
          console.log('');
        }

        if (created % 1000 === 0) {
          console.log(`⏳ Progress: ${created} conversions created...`);
        }

      } catch (err) {
        errors.push({ orderId: order.id, reason: err.message });
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS:');
      errors.slice(0, 20).forEach(e => {
        console.log(`  - Order ${e.orderId}: ${e.reason}`);
        if (e.email) console.log(`    Email: ${e.email}`);
      });
    }

    console.log('\n✅ DONE! Missing AffiliateConversion records created.');

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMissingAffiliateConversions();
