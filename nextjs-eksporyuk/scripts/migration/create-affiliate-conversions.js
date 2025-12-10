/**
 * CREATE AFFILIATE CONVERSIONS
 * =============================
 * Create AffiliateConversion records for transactions with affiliateId
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🔗 CREATING AFFILIATE CONVERSIONS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Get transactions with affiliateId but no conversion
  console.log('🔍 Finding transactions without conversion...');
  const transactions = await prisma.transaction.findMany({
    where: {
      affiliateId: { not: null },
      affiliateConversion: null
    },
    select: {
      id: true,
      affiliateId: true,
      amount: true,
      status: true,
      createdAt: true,
      paidAt: true,
      metadata: true
    }
  });

  console.log(`   Found ${transactions.length} transactions\n`);

  let created = 0;
  let failed = 0;

  console.log('📝 Creating affiliate conversions...\n');

  for (const tx of transactions) {
    try {
      // Calculate commission (30% default for membership)
      const commissionRate = 30; // 30%
      const commissionAmount = Math.round(tx.amount * (commissionRate / 100));

      await prisma.affiliateConversion.create({
        data: {
          affiliateId: tx.affiliateId,
          transactionId: tx.id,
          commissionAmount: commissionAmount,
          commissionRate: commissionRate,
          paidOut: false
        }
      });

      created++;

      if (created % 500 === 0) {
        console.log(`   ✅ Created ${created} conversions...`);
      }
    } catch (e) {
      failed++;
      if (failed <= 3) {
        console.error(`\n   ⚠️  Error creating conversion for tx ${tx.id}:`);
        console.error(`       ${e.message}`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('📊 CREATE SUMMARY');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ❌ Failed: ${failed}\n`);

  // Final verification
  const totalConversions = await prisma.affiliateConversion.count();
  const txWithConversion = await prisma.transaction.count({
    where: {
      affiliateId: { not: null },
      affiliateConversion: { isNot: null }
    }
  });

  console.log('📈 Final Status:');
  console.log(`   Total conversions: ${totalConversions}`);
  console.log(`   Transactions with conversion: ${txWithConversion}\n`);

  // Sample with conversion
  const sample = await prisma.transaction.findFirst({
    where: {
      reference: { startsWith: 'SEJOLI-' },
      affiliateConversion: { isNot: null }
    },
    include: {
      affiliateConversion: {
        include: {
          affiliate: {
            select: {
              affiliateCode: true,
              user: { select: { name: true, email: true } }
            }
          }
        }
      }
    }
  });

  if (sample) {
    console.log('📋 Sample transaction with conversion:');
    console.log(`   Reference: ${sample.reference}`);
    console.log(`   Amount: Rp ${sample.amount.toLocaleString()}`);
    console.log(`   Commission: Rp ${sample.affiliateConversion?.commissionAmount.toLocaleString()}`);
    console.log(`   Affiliate: ${sample.affiliateConversion?.affiliate.user.name}`);
    console.log(`   Status: ${sample.affiliateConversion?.status}\n`);
  }

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETED!');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
