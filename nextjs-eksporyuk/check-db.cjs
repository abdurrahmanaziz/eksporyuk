const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking Production Database...\n')
    
    const users = await prisma.user.count()
    const transactions = await prisma.transaction.count()
    const affiliates = await prisma.affiliateProfile.count()
    const commissions = await prisma.affiliateCommission.count()
    const wallets = await prisma.wallet.count()
    
    console.log('📊 DATABASE STATUS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👥 Users:', users)
    console.log('💳 Transactions:', transactions)
    console.log('🤝 Affiliate Profiles:', affiliates)
    console.log('�� Affiliate Commissions:', commissions)
    console.log('👛 Wallets:', wallets)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    if (users === 0) console.log('❌ CRITICAL: No users found!')
    if (transactions === 0) console.log('❌ CRITICAL: No transactions found!')
    if (affiliates === 0) console.log('⚠️  WARNING: No affiliate profiles!')
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ ERROR:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkDatabase()
