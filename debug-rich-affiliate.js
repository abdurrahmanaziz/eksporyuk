#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUser() {
  try {
    console.log('\n=== DEBUG USER richaffiliateapp@gmail.com ===\n');

    // Find user - simple query
    const user = await prisma.user.findUnique({
      where: { email: 'richaffiliateapp@gmail.com' }
    });

    if (!user) {
      console.log('❌ User NOT FOUND');
      return;
    }

    console.log('✅ USER FOUND:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    });

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    console.log('\n=== WALLET ===');
    if (wallet) {
      console.log({
        id: wallet.id,
        balance: wallet.balance,
        balancePending: wallet.balancePending,
        totalWithdrawn: wallet.totalWithdrawn,
        totalEarned: wallet.totalEarned,
      });
    } else {
      console.log('❌ NO WALLET');
    }

    // Get memberships - no include, simple query
    const memberships = await prisma.userMembership.findMany({
      where: { userId: user.id }
    });

    console.log('\n=== USER MEMBERSHIPS ===');
    if (memberships.length === 0) {
      console.log('❌ NO MEMBERSHIPS');
    } else {
      for (const um of memberships) {
        const membership = await prisma.membership.findUnique({
          where: { id: um.membershipId }
        });
        console.log({
          id: um.id,
          membershipId: um.membershipId,
          membershipName: membership?.name,
          status: um.status,
          isActive: um.isActive,
          activatedAt: um.activatedAt,
          startDate: um.startDate,
          endDate: um.endDate,
          transactionId: um.transactionId,
        });
      }
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('\n=== RECENT TRANSACTIONS (Last 10) ===');
    if (transactions.length === 0) {
      console.log('❌ NO TRANSACTIONS');
    } else {
      for (const txn of transactions) {
        console.log({
          id: txn.id,
          type: txn.type,
          status: txn.status,
          amount: txn.amount,
          paidAt: txn.paidAt,
          createdAt: txn.createdAt,
          invoiceNumber: txn.invoiceNumber,
          externalId: txn.externalId,
          reference: txn.reference,
        });
      }
    }

    console.log('\n=== TRANSACTION DETAILS (FIRST 3) ===');
    for (const txn of transactions.slice(0, 3)) {
      console.log(`\n[${txn.id}] ${txn.type} - ${txn.status}`);
      console.log('Amount:', txn.amount);
      console.log('Invoice:', txn.invoiceNumber);
      console.log('External ID:', txn.externalId);
      console.log('Reference:', txn.reference);
      console.log('Paid At:', txn.paidAt);
      console.log('MembershipId:', txn.membershipId);
      console.log('Full metadata:', JSON.stringify(txn.metadata, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser();
