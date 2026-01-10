const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSampleInvoice() {
  console.log('\n🔍 Checking Sample Invoice: INV19285');
  console.log('Expected: Customer "Mohd Juanda", Affiliate "Yoga Andrian", Commission Rp 325,000\n');

  try {
    // 1. Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        invoiceNumber: 'INV19285'
      }
    });

    if (!transaction) {
      console.log('❌ Transaction INV19285 not found in database!');
      return;
    }

    // 2. Get user separately
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId }
    });

    // 3. Get conversion separately
    const conversion = await prisma.affiliateConversion.findUnique({
      where: { transactionId: transaction.id }
    });

    // 4. Get affiliate profile if conversion exists
    let affiliateProfile = null;
    let affiliateUser = null;
    if (conversion) {
      affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { id: conversion.affiliateId }
      });
      
      if (affiliateProfile) {
        affiliateUser = await prisma.user.findUnique({
          where: { id: affiliateProfile.userId }
        });
      }
    }

    console.log('✅ TRANSACTION FOUND:');
    console.log('=====================================');
    console.log('Invoice Number:', transaction.invoiceNumber);
    console.log('Customer Name:', user?.name || transaction.customerName || 'N/A');
    console.log('Customer Email:', user?.email || transaction.customerEmail || 'N/A');
    console.log('Amount:', 'Rp', transaction.amount.toLocaleString('id-ID'));
    console.log('Status:', transaction.status);
    console.log('Created:', transaction.createdAt);
    console.log('Sejoli Order ID:', transaction.reference || 'N/A');
    
    // Check metadata
    const metadata = transaction.metadata || {};
    console.log('\n📋 METADATA:');
    console.log('Product ID:', metadata.product_id);
    console.log('Affiliate ID:', metadata.affiliate_id);
    console.log('Grand Total:', metadata.grand_total);

    // 2. Check conversion
    console.log('\n🔗 AFFILIATE CONVERSION:');
    console.log('=====================================');
    
    if (conversion) {
      console.log('✅ Conversion exists!');
      console.log('Conversion ID:', conversion.id);
      console.log('Commission Amount:', 'Rp', conversion.commissionAmount.toLocaleString('id-ID'));
      console.log('Commission Rate:', conversion.commissionRate ? `${conversion.commissionRate}%` : 'N/A');
      console.log('Paid Out:', conversion.paidOut ? 'Yes' : 'No');
      console.log('Created:', conversion.createdAt);
      
      // Check affiliate profile
      if (affiliateProfile) {
        console.log('\n👤 AFFILIATE PROFILE:');
        console.log('=====================================');
        console.log('Affiliate ID:', affiliateProfile.id);
        console.log('Username:', affiliateProfile.username);
        console.log('Short Link:', affiliateProfile.shortLink);
        console.log('Sejoli Affiliate ID:', affiliateProfile.sejoliAffiliateId);
        
        if (affiliateUser) {
          console.log('\n👤 AFFILIATE USER:');
          console.log('User ID:', affiliateUser.id);
          console.log('Name:', affiliateUser.name);
          console.log('Email:', affiliateUser.email);
        } else {
          console.log('\n⚠️ Affiliate profile has no linked user!');
        }
      } else {
        console.log('⚠️ Conversion has no affiliate profile linked!');
      }
    } else {
      console.log('❌ No conversion found for this transaction!');
      console.log('This transaction should have a conversion with commission Rp 325,000');
    }

    // 3. Summary comparison
    console.log('\n📊 COMPARISON WITH EXPECTED DATA:');
    console.log('=====================================');
    console.log('Expected Customer: Mohd Juanda');
    const actualCustomerName = user?.name || transaction.customerName || 'N/A';
    console.log('Actual Customer:', actualCustomerName);
    console.log('Match:', actualCustomerName === 'Mohd Juanda' ? '✅' : '❌');
    
    console.log('\nExpected Affiliate: Yoga Andrian');
    const actualAffiliateName = affiliateUser?.name || 'N/A';
    console.log('Actual Affiliate:', actualAffiliateName);
    console.log('Match:', actualAffiliateName === 'Yoga Andrian' ? '✅' : '❌');
    
    console.log('\nExpected Commission: Rp 325,000');
    const actualCommission = conversion?.commissionAmount || 0;
    console.log('Actual Commission: Rp', actualCommission.toLocaleString('id-ID'));
    console.log('Match:', actualCommission === 325000 ? '✅' : '❌');

    // 4. Check if we need to look up by product_id
    if (metadata.product_id) {
      console.log('\n🔍 CHECKING COMMISSION MAP FOR PRODUCT:', metadata.product_id);
      
      // Import commission map
      const COMMISSION_MAP = {
        179: 250000, 13401: 325000, 3840: 300000, 8683: 300000,
        8684: 250000, 1529: 300000, 6810: 300000, 16956: 300000,
        6068: 280000, 20852: 280000, 15234: 250000, 4684: 250000,
        11207: 250000, 17920: 250000, 19296: 250000, 93: 200000,
        28: 200000, 13399: 250000, 13400: 200000, 8910: 0,
        8914: 0, 8915: 0, 397: 100000, 488: 100000,
        12994: 100000, 13039: 100000, 13045: 100000, 16130: 100000,
        16860: 100000, 16963: 100000, 17227: 100000, 17322: 100000,
        17767: 100000, 18358: 100000, 18528: 20000, 18705: 100000,
        18893: 100000, 19042: 50000, 20130: 50000, 20336: 100000,
        21476: 50000, 5928: 150000, 5932: 150000, 5935: 150000,
        16581: 150000, 16587: 150000, 16592: 150000, 2910: 85000,
        3764: 85000, 4220: 85000, 8686: 85000, 300: 0,
        16826: 0
      };
      
      const expectedCommission = COMMISSION_MAP[metadata.product_id];
      console.log('Expected Commission from Map:', expectedCommission ? `Rp ${expectedCommission.toLocaleString('id-ID')}` : 'Not found in map');
      
      if (expectedCommission) {
        console.log('Database Commission:', actualCommission ? `Rp ${actualCommission.toLocaleString('id-ID')}` : 'Rp 0');
        console.log('Map vs Database Match:', actualCommission === expectedCommission ? '✅' : '❌');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSampleInvoice();
