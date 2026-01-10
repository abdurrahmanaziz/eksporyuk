const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkINV19285() {
  console.log('\n🔍 Checking INV19285 - Complete Analysis');
  console.log('=====================================\n');

  try {
    // Get transaction
    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNumber: 'INV19285' }
    });

    if (!transaction) {
      console.log('❌ Transaction not found!');
      return;
    }

    console.log('📋 TRANSACTION DATA:');
    console.log('ID:', transaction.id);
    console.log('Invoice:', transaction.invoiceNumber);
    console.log('Amount:', 'Rp', transaction.amount.toLocaleString('id-ID'));
    console.log('Status:', transaction.status);
    console.log('Created:', transaction.createdAt);
    console.log('Reference:', transaction.reference);
    console.log('Type:', transaction.type);
    console.log('');

    // Get user (buyer)
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId }
    });

    if (user) {
      console.log('👤 BUYER:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('');
    }

    // Check if there's metadata
    console.log('📦 METADATA:');
    if (transaction.metadata && typeof transaction.metadata === 'object') {
      console.log(JSON.stringify(transaction.metadata, null, 2));
    } else {
      console.log('No metadata found');
    }
    console.log('');

    // Check if conversion exists
    const conversion = await prisma.affiliateConversion.findUnique({
      where: { transactionId: transaction.id }
    });

    console.log('🔗 AFFILIATE CONVERSION:');
    if (conversion) {
      console.log('✅ Conversion exists');
      console.log('Conversion ID:', conversion.id);
      console.log('Affiliate ID:', conversion.affiliateId);
      console.log('Commission Amount:', 'Rp', conversion.commissionAmount.toLocaleString('id-ID'));
      console.log('Commission Rate:', conversion.commissionRate);
      console.log('Paid Out:', conversion.paidOut);
      console.log('');

      // Get affiliate profile
      const profile = await prisma.affiliateProfile.findUnique({
        where: { id: conversion.affiliateId }
      });

      if (profile) {
        console.log('💼 AFFILIATE PROFILE:');
        console.log('Profile ID:', profile.id);
        console.log('Username:', profile.username);
        console.log('Short Link:', profile.shortLink);
        console.log('Sejoli Affiliate ID:', profile.sejoliAffiliateId);
        console.log('User ID:', profile.userId);
        console.log('');

        // Get affiliate user
        const affUser = await prisma.user.findUnique({
          where: { id: profile.userId }
        });

        if (affUser) {
          console.log('👤 AFFILIATE USER:');
          console.log('Name:', affUser.name);
          console.log('Email:', affUser.email);
          console.log('Role:', affUser.role);
          console.log('');
        }
      }
    } else {
      console.log('❌ No conversion found');
      console.log('');
    }

    // Check if this is from Sejoli or new transaction
    console.log('🔍 TRANSACTION SOURCE:');
    if (transaction.reference && transaction.reference.startsWith('SEJOLI-')) {
      console.log('Source: SEJOLI IMPORT');
      console.log('Sejoli Order ID:', transaction.reference);
    } else {
      console.log('Source: NEW TRANSACTION (created after Sejoli import)');
      console.log('This is a transaction created directly in Next.js platform');
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('Expected Data (from user):');
    console.log('  Buyer: Mohd Juanda');
    console.log('  Affiliate: Yoga Andrian');
    console.log('  Amount: Rp 999.000');
    console.log('  Commission: Rp 325.000');
    console.log('');
    console.log('Actual Data (in database):');
    console.log('  Buyer:', user?.name || 'N/A');
    console.log('  Affiliate:', conversion ? 'Has conversion' : 'No conversion');
    console.log('  Amount: Rp', transaction.amount.toLocaleString('id-ID'));
    console.log('  Commission: Rp', conversion ? conversion.commissionAmount.toLocaleString('id-ID') : '0');
    console.log('');
    console.log('Match Status:');
    console.log('  Buyer:', user?.name === 'Mohd Juanda' ? '✅' : '❌');
    console.log('  Amount:', transaction.amount == 999000 ? '✅' : '❌');
    console.log('  Has Conversion:', conversion ? '✅' : '❌');
    console.log('  Commission:', conversion && conversion.commissionAmount == 325000 ? '✅' : '❌');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkINV19285();
