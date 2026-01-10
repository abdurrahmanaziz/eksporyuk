const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initSettings() {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        paymentExpiryHours: 72, // 3 days default
        revenueEnabled: true,
        affiliateCommissionEnabled: true,
        mentorCommissionEnabled: true,
        followUpEnabled: true,
        followUp1HourEnabled: true,
        followUp24HourEnabled: true,
        followUp48HourEnabled: true,
      }
    });
    
    console.log('✓ Settings initialized:', settings);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initSettings();
