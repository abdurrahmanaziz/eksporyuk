const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableXendit() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        id: true,
        paymentEnableXendit: true,
        withdrawalAdminFee: true,
        withdrawalMinAmount: true
      }
    });
    
    console.log('Current Xendit Settings:');
    console.log('paymentEnableXendit:', settings?.paymentEnableXendit || false);
    console.log('withdrawalAdminFee:', settings?.withdrawalAdminFee || 5000);
    console.log('withdrawalMinAmount:', settings?.withdrawalMinAmount || 50000);
    
    if (!settings?.paymentEnableXendit) {
      console.log('\nEnabling Xendit...');
      await prisma.settings.upsert({
        where: { id: settings?.id || 1 },
        create: {
          id: 1,
          paymentEnableXendit: true,
          withdrawalAdminFee: 5000,
          withdrawalMinAmount: 50000,
          withdrawalPinRequired: true,
          withdrawalPinLength: 6
        },
        update: {
          paymentEnableXendit: true
        }
      });
      console.log('✅ Xendit enabled successfully!');
    } else {
      console.log('✅ Xendit is already enabled');
    }
    
    // Verify the change
    const updatedSettings = await prisma.settings.findFirst({
      select: { paymentEnableXendit: true }
    });
    console.log('\nFinal status: paymentEnableXendit =', updatedSettings?.paymentEnableXendit);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableXendit();