#!/usr/bin/env node
/**
 * Test script to reprocess Umar's commission manually
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const umarId = 'cmjmtou2e001fitz0pjwgpl60';
  
  // Get Umar's latest success transaction
  const tx = await prisma.transaction.findFirst({
    where: { userId: umarId, status: 'SUCCESS' },
    orderBy: { createdAt: 'desc' }
  });

  if (!tx) {
    console.log('❌ No SUCCESS transaction found for Umar');
    return;
  }

  console.log('=== UMAR\'S TRANSACTION ===');
  console.log('ID:', tx.id);
  console.log('Amount:', tx.amount);
  console.log('Affiliate ID:', tx.affiliateId);
  console.log('Type:', tx.type);
  console.log('Metadata:', JSON.stringify(tx.metadata, null, 2));

  // Get membership commission rate from metadata
  let affiliateCommissionRate = 30;
  let commissionType = 'PERCENTAGE';
  
  if (tx.metadata && typeof tx.metadata === 'object') {
    const meta = tx.metadata;
    if (meta.affiliateCommissionRate) {
      affiliateCommissionRate = meta.affiliateCommissionRate;
      console.log('Commission Rate from metadata:', affiliateCommissionRate);
    }
    if (meta.commissionType) {
      commissionType = meta.commissionType;
      console.log('Commission Type from metadata:', commissionType);
    }
  }

  // Get system users
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const founder = await prisma.user.findFirst({ where: { isFounder: true } });
  const cofounder = await prisma.user.findFirst({ where: { isCoFounder: true } });

  if (!admin || !founder || !cofounder) {
    console.log('❌ ERROR: Missing system users');
    console.log('Admin:', !!admin, 'Founder:', !!founder, 'Co-Founder:', !!cofounder);
    return;
  }

  console.log('\n=== SYSTEM USERS ===');
  console.log('Admin:', admin.id);
  console.log('Founder:', founder.id);
  console.log('Co-Founder:', cofounder.id);

  // Check if wallet already has commission
  const walletBefore = await prisma.wallet.findUnique({
    where: { userId: tx.affiliateId }
  });

  console.log('\n=== AFFILIATE WALLET BEFORE ===');
  console.log('Balance:', walletBefore?.balance || 0);
  console.log('Pending:', walletBefore?.balancePending || 0);
  console.log('Total Earnings:', walletBefore?.totalEarnings || 0);

  // Check if commission already processed
  const existingTx = await prisma.walletTransaction.findFirst({
    where: {
      reference: tx.id,
      type: 'COMMISSION'
    }
  });

  if (existingTx) {
    console.log('\n⚠️  Commission already processed!');
    console.log('Wallet Transaction:', existingTx.id);
    console.log('Amount:', existingTx.amount);
    return;
  }

  console.log('\n=== PROCESSING COMMISSION ===');
  try {
    // Calculate commission manually
    const calculated = (() => {
      let commission = 0;
      if (commissionType === 'FLAT') {
        commission = Math.min(affiliateCommissionRate, Number(tx.amount));
      } else {
        commission = (Number(tx.amount) * affiliateCommissionRate) / 100;
      }
      return commission;
    })();

    console.log('Calculated Commission:', calculated);

    // Create wallet entry if doesn't exist
    const wallet = await prisma.wallet.upsert({
      where: { userId: tx.affiliateId },
      create: {
        userId: tx.affiliateId,
        balance: calculated,
        balancePending: 0,
        totalEarnings: calculated,
      },
      update: {
        balance: { increment: calculated },
        totalEarnings: { increment: calculated },
      },
    });

    // Create wallet transaction
    const crypto = require('crypto');
    const createId = () => crypto.randomBytes(16).toString('hex');

    await prisma.walletTransaction.create({
      data: {
        id: createId(),
        walletId: wallet.id,
        amount: calculated,
        type: 'COMMISSION',
        description: `Affiliate commission (${affiliateCommissionRate}%)`,
        reference: tx.id,
      },
    });

    console.log('✅ Commission processed successfully!');

    // Check wallet after
    const walletAfter = await prisma.wallet.findUnique({
      where: { userId: tx.affiliateId }
    });

    console.log('\n=== AFFILIATE WALLET AFTER ===');
    console.log('Balance:', walletAfter?.balance);
    console.log('Pending:', walletAfter?.balancePending);
    console.log('Total Earnings:', walletAfter?.totalEarnings);

  } catch (error) {
    console.error('❌ ERROR processing commission:', error.message);
    console.error('Stack:', error.stack);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
