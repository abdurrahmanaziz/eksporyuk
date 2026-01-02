const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailFlows() {
  console.log('🚀 TESTING COMPLETE EMAIL FLOW WITH COMMISSION CALCULATION\n');
  
  try {
    // 1. Get or create test data
    console.log('📝 STEP 1: Setting up test data...\n');
    
    // Create test merchant user
    const merchant = await prisma.user.upsert({
      where: { email: 'test-merchant@eksporyuk.test' },
      update: {},
      create: {
        email: 'test-merchant@eksporyuk.test',
        name: 'Test Merchant',
        password: 'dummy-hash',
        emailVerified: true,
        role: 'MEMBER_PREMIUM'
      }
    });
    
    // Create merchant wallet
    await prisma.wallet.upsert({
      where: { userId: merchant.id },
      update: {},
      create: {
        userId: merchant.id,
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0
      }
    });
    
    console.log(`✅ Merchant User: ${merchant.email} (ID: ${merchant.id})`);
    
    // Create test affiliate
    const affiliate = await prisma.user.upsert({
      where: { email: 'test-affiliate@eksporyuk.test' },
      update: {},
      create: {
        email: 'test-affiliate@eksporyuk.test',
        name: 'Test Affiliate',
        password: 'dummy-hash',
        emailVerified: true,
        role: 'AFFILIATE'
      }
    });
    
    // Create affiliate wallet
    await prisma.wallet.upsert({
      where: { userId: affiliate.id },
      update: {},
      create: {
        userId: affiliate.id,
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0
      }
    });
    
    console.log(`✅ Affiliate User: ${affiliate.email} (ID: ${affiliate.id})\n`);
    
    // 2. Verify email templates exist
    console.log('📋 STEP 2: Verifying email templates exist...\n');
    
    const templates = [
      'affiliate-commission-received',
      'mentor-commission-received',
      'admin-fee-pending',
      'founder-share-pending',
      'pending-revenue-approved',
      'pending-revenue-rejected'
    ];
    
    for (const slug of templates) {
      const template = await prisma.brandedTemplate.findFirst({
        where: { slug }
      });
      
      if (template) {
        console.log(`✅ Template "${slug}" exists (usage: ${template.usageCount})`);
      } else {
        console.log(`❌ Template "${slug}" NOT FOUND`);
      }
    }
    
    // 3. Simulate commission processing
    console.log('\n💰 STEP 3: Simulating commission processing...\n');
    
    // Create membership for commission test
    const membership = await prisma.membership.upsert({
      where: { id: 'test-membership-1' },
      update: {},
      create: {
        id: 'test-membership-1',
        name: 'Test Commission Membership',
        price: 100000,
        currency: 'IDR',
        type: 'SUBSCRIPTION',
        duration: 30,
        affiliateCommissionRate: 30,
        affiliateCommissionType: 'PERCENTAGE',
        isActive: true
      }
    });
    
    console.log(`✅ Test Membership created: ${membership.name}`);
    console.log(`   Commission Type: ${membership.affiliateCommissionType}`);
    console.log(`   Commission Rate: ${membership.affiliateCommissionRate}%\n`);
    
    // Create affiliate application to verify role
    const affApp = await prisma.affiliateApplication.findFirst({
      where: { userId: affiliate.id }
    });
    
    if (affApp) {
      console.log(`✅ Affiliate Application exists (status: ${affApp.status})`);
    } else {
      console.log(`⚠️  No affiliate application found for test user`);
    }
    
    // 4. Calculate expected commission
    console.log('\n📊 STEP 4: Commission calculation breakdown:\n');
    
    const transactionAmount = 100000;
    const affiliateCommissionRate = 30;
    const affiliateCommission = (transactionAmount * affiliateCommissionRate) / 100;
    const remaining = transactionAmount - affiliateCommission;
    
    const adminFee = (remaining * 15) / 100; // 15% for admin
    const founderShare = ((remaining - adminFee) * 60) / 100; // 60% of remainder
    const coFounderShare = remaining - adminFee - founderShare; // 40% of remainder
    
    console.log(`Transaction Amount:     Rp ${transactionAmount.toLocaleString('id-ID')}`);
    console.log(`Affiliate Commission:   Rp ${Math.round(affiliateCommission).toLocaleString('id-ID')} → balance`);
    console.log(`\nRemaining:              Rp ${Math.round(remaining).toLocaleString('id-ID')}`);
    console.log(`Admin Fee (15%):        Rp ${Math.round(adminFee).toLocaleString('id-ID')} → balancePending`);
    console.log(`Founder Share (60%):    Rp ${Math.round(founderShare).toLocaleString('id-ID')} → balancePending`);
    console.log(`Co-Founder Share (40%): Rp ${Math.round(coFounderShare).toLocaleString('id-ID')} → balancePending`);
    
    // 5. Summary
    console.log('\n✅ TEST DATA READY FOR EMAIL INTEGRATION TESTING\n');
    console.log('🎯 NEXT STEPS TO VERIFY EMAIL DELIVERY:\n');
    console.log('1. Monitor email service logs for template rendering');
    console.log('2. Check BrandedTemplate.usageCount increases after transactions');
    console.log('3. Verify emails sent to:');
    console.log(`   - ${affiliate.email} (affiliate commission)`);
    console.log(`   - ${merchant.email} (admin notifications)`);
    console.log('4. In production, test actual payment processing');
    console.log('5. Watch Mailketing dashboard for delivery status\n');
    
    // 6. Database state check
    console.log('📊 DATABASE STATE:\n');
    
    const userCount = await prisma.user.count();
    const walletCount = await prisma.wallet.count();
    const templateCount = await prisma.brandedTemplate.count();
    
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Wallets: ${walletCount}`);
    console.log(`Total Templates: ${templateCount}`);
    console.log(`Test Users Created: 2 (merchant + affiliate)\n`);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailFlows();
