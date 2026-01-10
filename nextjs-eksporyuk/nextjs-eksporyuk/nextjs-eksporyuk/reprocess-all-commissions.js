#!/usr/bin/env node
/**
 * Reprocess all manual payment commissions that were missed
 * 
 * Bug: Commission processing was not being called for manual payment confirmations
 * Fix: This script retroactively processes commissions for all SUCCESS transactions 
 *      that don't have corresponding wallet commission entries
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const createId = () => crypto.randomBytes(16).toString('hex');

async function reprocessAllCommissions() {
  console.log('🔄 Starting affiliate commission reprocessing...\n');

  // Get system users
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const founder = await prisma.user.findFirst({ where: { isFounder: true } });
  const cofounder = await prisma.user.findFirst({ where: { isCoFounder: true } });

  if (!admin || !founder || !cofounder) {
    console.log('❌ ERROR: Missing system users');
    console.log('Admin:', !!admin, 'Founder:', !!founder, 'Co-Founder:', !!cofounder);
    process.exit(1);
  }

  console.log('✅ Found system users:');
  console.log(`  - Admin: ${admin.id}`);
  console.log(`  - Founder: ${founder.id}`);
  console.log(`  - Co-Founder: ${cofounder.id}\n`);

  // Get all SUCCESS transactions with affiliates that need commission processing
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      affiliateId: { not: null },
      type: { in: ['MEMBERSHIP', 'PRODUCT', 'COURSE'] }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📋 Found ${transactions.length} affiliate transactions\n`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const tx of transactions) {
    try {
      // Check if commission already processed
      const existingWalletTx = await prisma.walletTransaction.findFirst({
        where: {
          reference: tx.id,
          type: 'COMMISSION'
        }
      });

      if (existingWalletTx) {
        console.log(`⏭️  Skipped (already processed): ${tx.id}`);
        skippedCount++;
        continue;
      }

      // Get commission configuration
      let affiliateCommissionRate = 30;
      let commissionType = 'PERCENTAGE';

      if (tx.type === 'MEMBERSHIP' && tx.membershipId) {
        const membership = await prisma.membership.findUnique({
          where: { id: tx.membershipId },
          select: { affiliateCommissionRate: true, commissionType: true }
        });
        if (membership) {
          affiliateCommissionRate = Number(membership.affiliateCommissionRate || 30);
          commissionType = membership.commissionType || 'PERCENTAGE';
        }
      } else if (tx.type === 'PRODUCT' && tx.productId) {
        const product = await prisma.product.findUnique({
          where: { id: tx.productId },
          select: { affiliateCommissionRate: true, commissionType: true }
        });
        if (product) {
          affiliateCommissionRate = Number(product.affiliateCommissionRate || 30);
          commissionType = product.commissionType || 'PERCENTAGE';
        }
      }

      // Calculate commission
      let affiliateCommission = 0;
      if (commissionType === 'FLAT') {
        affiliateCommission = Math.min(affiliateCommissionRate, Number(tx.amount));
      } else {
        affiliateCommission = (Number(tx.amount) * affiliateCommissionRate) / 100;
      }

      // Update affiliate wallet
      const affiliateWallet = await prisma.wallet.upsert({
        where: { userId: tx.affiliateId },
        create: {
          userId: tx.affiliateId,
          balance: affiliateCommission,
          balancePending: 0,
          totalEarnings: affiliateCommission,
        },
        update: {
          balance: { increment: affiliateCommission },
          totalEarnings: { increment: affiliateCommission },
        },
      });

      // Create wallet transaction record
      const commissionDesc = commissionType === 'FLAT'
        ? `Affiliate commission (Rp ${affiliateCommissionRate.toLocaleString('id-ID')} flat)`
        : `Affiliate commission (${affiliateCommissionRate}%)`;

      await prisma.walletTransaction.create({
        data: {
          id: createId(),
          walletId: affiliateWallet.id,
          amount: affiliateCommission,
          type: 'COMMISSION',
          description: commissionDesc,
          reference: tx.id,
        },
      });

      // Update affiliate profile statistics
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: tx.affiliateId },
      });

      if (affiliateProfile) {
        await prisma.affiliateProfile.update({
          where: { userId: tx.affiliateId },
          data: {
            totalEarnings: { increment: affiliateCommission },
            totalConversions: { increment: 1 },
          },
        });
      }

      console.log(`✅ Processed: ${tx.id} (Commission: ${affiliateCommission})`);
      processedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${tx.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`  - Processed: ${processedCount}`);
  console.log(`  - Skipped: ${skippedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`  - Total: ${transactions.length}`);

  await prisma.$disconnect();
}

reprocessAllCommissions().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
