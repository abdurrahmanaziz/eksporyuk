import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking Production Database...\n')
    
    const [users, transactions, affiliates, commissions, wallet] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.affiliateProfile.count(),
      prisma.affiliateCommission.count(),
      prisma.wallet.count()
    ])
    
    console.log('📊 DATABASE STATUS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👥 Users:', users)
    console.log('💳 Transactions:', transactions)
    console.log('🤝 Affiliate Profiles:', affiliates)
    console.log('💰 Affiliate Commissions:', commissions)
    console.log('👛 Wallets:', wallet)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    if (users === 0) {
      console.log('❌ CRITICAL: No users found!')
    }
    if (transactions === 0) {
      console.log('❌ CRITICAL: No transactions found!')
    }
    if (affiliates === 0) {
      console.log('⚠️  WARNING: No affiliate profiles found!')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    process.exit(1)
  }
}

checkDatabase()
