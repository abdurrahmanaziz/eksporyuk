const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Duration enum to days mapping
const durationDays = {
  'ONE_MONTH': 30,
  'THREE_MONTHS': 90,
  'SIX_MONTHS': 180,
  'ONE_YEAR': 365,
  'TWO_YEARS': 730,
  'LIFETIME': 36500
}

async function fix() {
  const txId = 'txn_1767338644481_azkga3n4sc'
  
  // Get transaction
  const tx = await prisma.transaction.findUnique({
    where: { id: txId }
  })
  
  console.log('Transaction ID:', tx.id)
  console.log('User ID:', tx.userId)
  console.log('Affiliate ID:', tx.affiliateId)
  console.log('Amount:', tx.amount)
  console.log('Metadata:', tx.metadata)
  
  const metadata = tx.metadata || {}
  const membershipId = metadata.membershipId || 'mem_6bulan_ekspor'
  
  // Get membership details
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId }
  })
  console.log('\nMembership:', membership?.name)
  console.log('Duration:', membership?.duration)
  console.log('Affiliate Commission Rate:', membership?.affiliateCommissionRate)
  
  // Calculate days
  const days = durationDays[membership?.duration] || 30
  console.log('Days:', days)
  
  // 1. Create UserMembership if not exists
  const existingUM = await prisma.userMembership.findFirst({
    where: { 
      userId: tx.userId,
      membershipId: membershipId
    }
  })
  
  if (!existingUM) {
    const startDate = new Date(tx.paidAt || tx.createdAt)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)
    
    const newUM = await prisma.userMembership.create({
      data: {
        userId: tx.userId,
        membershipId: membershipId,
        status: 'ACTIVE',
        isActive: true,
        startDate: startDate,
        endDate: endDate,
        transactionId: tx.id,
        affiliateId: tx.affiliateId
      }
    })
    console.log('\n✅ Created UserMembership:', newUM.id)
  } else {
    console.log('\n⚠️ UserMembership already exists:', existingUM.id)
  }
  
  // 2. Create AffiliateConversion if affiliate exists
  if (tx.affiliateId) {
    // Get affiliate profile
    const affProfile = await prisma.affiliateProfile.findFirst({
      where: { 
        OR: [
          { id: tx.affiliateId },
          { userId: tx.affiliateId }
        ]
      }
    })
    
    console.log('\nAffiliate Profile:', affProfile?.id)
    
    if (affProfile) {
      // Check if conversion already exists
      const existingConv = await prisma.affiliateConversion.findFirst({
        where: { transactionId: tx.id }
      })
      
      if (!existingConv) {
        // Calculate commission - use flat rate from metadata or membership
        const commissionRate = Number(metadata.affiliateCommissionRate || membership?.affiliateCommissionRate || 200000)
        const commissionAmount = commissionRate // Flat rate
        
        const newConv = await prisma.affiliateConversion.create({
          data: {
            affiliateId: affProfile.id,
            transactionId: tx.id,
            commissionAmount: commissionAmount,
            commissionRate: commissionRate,
            paidOut: false
          }
        })
        console.log('✅ Created AffiliateConversion:', newConv.id)
        console.log('Commission Amount:', commissionAmount)
        
        // Update affiliate wallet
        const wallet = await prisma.wallet.findUnique({
          where: { userId: affProfile.userId }
        })
        
        if (wallet) {
          await prisma.wallet.update({
            where: { userId: affProfile.userId },
            data: {
              balance: { increment: commissionAmount }
            }
          })
          console.log('✅ Updated wallet balance +', commissionAmount)
        }
      } else {
        console.log('⚠️ AffiliateConversion already exists:', existingConv.id)
      }
    }
  }
  
  // 3. Update user role to MEMBER_PREMIUM
  await prisma.user.update({
    where: { id: tx.userId },
    data: { role: 'MEMBER_PREMIUM' }
  })
  console.log('\n✅ Updated user role to MEMBER_PREMIUM')
  
  await prisma.$disconnect()
  console.log('\n=== DONE ===')
}

fix().catch(console.error)
