const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupManualBanks() {
  try {
    console.log('🔧 Setting up manual bank accounts...\n')

    // Default manual bank accounts
    const defaultBankAccounts = [
      {
        id: 'manual-bca-1',
        bankName: 'Bank Central Asia (BCA)',
        bankCode: 'BCA',
        accountNumber: '1234567890',
        accountName: 'PT Eksporyuk Indonesia',
        branch: 'Jakarta Pusat',
        isActive: true,
        customLogoUrl: null,
        order: 1
      },
      {
        id: 'manual-mandiri-1',
        bankName: 'Bank Mandiri',
        bankCode: 'MANDIRI',
        accountNumber: '1350012345678',
        accountName: 'PT Eksporyuk Indonesia',
        branch: 'Jakarta Pusat',
        isActive: true,
        customLogoUrl: null,
        order: 2
      },
      {
        id: 'manual-bni-1',
        bankName: 'Bank Negara Indonesia (BNI)',
        bankCode: 'BNI',
        accountNumber: '0123456789',
        accountName: 'PT Eksporyuk Indonesia',
        branch: 'Jakarta Pusat',
        isActive: true,
        customLogoUrl: null,
        order: 3
      }
    ]

    // Get or create settings
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('📝 Creating new settings record...')
      settings = await prisma.settings.create({
        data: {
          siteName: 'Eksporyuk',
          siteDescription: 'Platform Membership & Affiliate',
          paymentBankAccounts: defaultBankAccounts,
          paymentEnableManual: true,
          paymentEnableXendit: true
        }
      })
      console.log('✅ Settings created with manual bank accounts')
    } else {
      console.log('📝 Updating existing settings...')
      
      // Get existing bank accounts
      let existingBanks = []
      try {
        existingBanks = settings.paymentBankAccounts 
          ? (Array.isArray(settings.paymentBankAccounts) 
              ? settings.paymentBankAccounts 
              : JSON.parse(settings.paymentBankAccounts))
          : []
      } catch (e) {
        console.log('⚠️  Error parsing existing banks, using defaults')
        existingBanks = []
      }

      // Merge with defaults (only add if not exists)
      const mergedBanks = [...defaultBankAccounts]
      existingBanks.forEach(bank => {
        if (!mergedBanks.find(b => b.bankCode === bank.bankCode)) {
          mergedBanks.push(bank)
        }
      })

      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          paymentBankAccounts: mergedBanks,
          paymentEnableManual: true
        }
      })
      console.log('✅ Settings updated with manual bank accounts')
    }

    console.log('\n📊 Manual Bank Accounts:')
    const banks = Array.isArray(settings.paymentBankAccounts) 
      ? settings.paymentBankAccounts 
      : JSON.parse(settings.paymentBankAccounts)
    
    banks.forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.bankName}`)
      console.log(`   Code: ${bank.bankCode}`)
      console.log(`   Account: ${bank.accountNumber}`)
      console.log(`   Name: ${bank.accountName}`)
      console.log(`   Active: ${bank.isActive ? '✅' : '❌'}`)
      console.log('')
    })

    console.log('✅ Setup complete!')
    console.log('\n💡 Note: Update rekening bank di Admin > Settings > Payment Settings')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupManualBanks()
