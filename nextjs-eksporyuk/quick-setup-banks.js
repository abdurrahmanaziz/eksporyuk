const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setup() {
  try {
    const defaultBanks = [
      { id: 'manual-bca-1', bankName: 'Bank Central Asia (BCA)', bankCode: 'BCA', accountNumber: '1234567890', accountName: 'PT Eksporyuk Indonesia', branch: 'Jakarta Pusat', isActive: true, customLogoUrl: null, order: 1 },
      { id: 'manual-mandiri-1', bankName: 'Bank Mandiri', bankCode: 'MANDIRI', accountNumber: '1350012345678', accountName: 'PT Eksporyuk Indonesia', branch: 'Jakarta Pusat', isActive: true, customLogoUrl: null, order: 2 },
      { id: 'manual-bni-1', bankName: 'Bank Negara Indonesia (BNI)', bankCode: 'BNI', accountNumber: '0123456789', accountName: 'PT Eksporyuk Indonesia', branch: 'Jakarta Pusat', isActive: true, customLogoUrl: null, order: 3 }
    ]

    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: { 
          siteName: 'Eksporyuk', 
          siteDescription: 'Platform Membership & Affiliate', 
          paymentBankAccounts: defaultBanks, 
          paymentEnableManual: true, 
          paymentEnableXendit: true 
        }
      })
      console.log('✅ Created settings with manual banks')
    } else {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { 
          paymentBankAccounts: defaultBanks, 
          paymentEnableManual: true 
        }
      })
      console.log('✅ Updated settings with manual banks')
    }

    console.log('\n✅ Setup Complete!')
    console.log('📊 Manual Banks:', defaultBanks.length)
    console.log('🔓 Manual Transfer: ENABLED')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setup()
