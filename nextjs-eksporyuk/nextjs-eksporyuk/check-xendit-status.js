const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkXenditConfig() {
  try {
    console.log('Checking Xendit Configuration...');
    
    const config = await prisma.integrationConfig.findFirst({
      where: { service: 'xendit' }
    });

    if (!config) {
      console.log('❌ No IntegrationConfig found for service: xendit (lowercase)');
    } else {
      console.log('✅ IntegrationConfig found for xendit');
      console.log('   Is Active:', config.isActive);
      // console.log('   Environment:', config.environment); // Might not exist
      const credentials = config.config || {};
      console.log('   Has Secret Key:', !!credentials.XENDIT_SECRET_KEY || !!process.env.XENDIT_SECRET_KEY);
      console.log('   Has Webhook Token:', !!credentials.XENDIT_WEBHOOK_TOKEN || !!process.env.XENDIT_WEBHOOK_TOKEN);
    }

    // Check Settings table for payment expiry
    const settings = await prisma.settings.findFirst();
    console.log('\nChecking Global Settings...');
    if (settings) {
      console.log('   Payment Expiry Hours:', settings.paymentExpiryHours);
    } else {
      console.log('   No Settings record found.');
    }

  } catch (error) {
    console.error('Error checking config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkXenditConfig();
