const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  // Cari user azizbiasa@gmail.com (affiliate)
  const user = await prisma.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' },
    include: {
      wallet: true,
      affiliateProfile: true
    }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log('=== USER INFO ===')
  console.log('User ID:', user.id)
  console.log('Name:', user.name)
  console.log('Email:', user.email)
  console.log('')
  
  console.log('=== WALLET INFO ===')
  if (user.wallet) {
    console.log('Wallet ID:', user.wallet.id)
    console.log('Balance:', Number(user.wallet.balance))
    console.log('Balance Pending:', Number(user.wallet.balancePending))
    console.log('Total Earnings:', Number(user.wallet.totalEarnings))
    console.log('Total Payout:', Number(user.wallet.totalPayout))
  } else {
    console.log('NO WALLET FOUND!')
  }
  
  console.log('')
  console.log('=== AFFILIATE PROFILE ===')
  if (user.affiliateProfile) {
    console.log('Affiliate Profile ID:', user.affiliateProfile.id)
    console.log('Total Earnings (profile):', Number(user.affiliateProfile.totalEarnings))
    console.log('Total Conversions:', user.affiliateProfile.totalConversions)
    console.log('Total Clicks:', user.affiliateProfile.totalClicks)
  } else {
    console.log('NO AFFILIATE PROFILE!')
  }
  
  // Check AffiliateConversion
  if (user.affiliateProfile) {
    const conversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log('')
    console.log('=== RECENT CONVERSIONS (last 10) ===')
    console.log('Total conversions found:', conversions.length)
    conversions.forEach(c => {
      console.log('- Commission:', Number(c.commissionAmount), '| paidOut:', c.paidOut ? 'PAID' : 'PENDING', '| Date:', c.createdAt)
    })
    
    // Sum all conversions
    const allConversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id }
    })
    const totalConvAmount = allConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    console.log('')
    console.log('Total ALL conversions count:', allConversions.length)
    console.log('Sum of ALL conversion amounts:', totalConvAmount)
  }
  
  // Check WalletTransaction
  if (user.wallet) {
    const walletTx = await prisma.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log('')
    console.log('=== WALLET TRANSACTIONS (last 10) ===')
    console.log('Total wallet transactions found:', walletTx.length)
    walletTx.forEach(tx => {
      console.log('- Type:', tx.type, '| Amount:', Number(tx.amount), '| Desc:', (tx.description || '').substring(0, 50))
    })
    
    // Sum wallet transactions
    const allWalletTx = await prisma.walletTransaction.findMany({
      where: { walletId: user.wallet.id }
    })
    const totalWalletTxAmount = allWalletTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
    console.log('')
    console.log('Total ALL wallet transactions:', allWalletTx.length)
    console.log('Sum of ALL wallet transaction amounts:', totalWalletTxAmount)
  }
  
  await prisma.$disconnect()
}

check().catch(console.error)
