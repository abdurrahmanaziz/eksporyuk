/**
 * Migration Script: Fix Transaction Data
 * 
 * This script:
 * 1. Updates existing transactions to have proper originalAmount
 * 2. Creates sample transactions with affiliates and commissions
 * 3. Ensures all commission records are properly created
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateTransactions() {
  console.log('🚀 Starting transaction migration...\n')
  
  // Step 1: Update existing transactions - set originalAmount if not set
  console.log('📝 Step 1: Updating existing transactions...')
  const existingTx = await prisma.transaction.findMany({
    where: { originalAmount: null }
  })
  
  for (const tx of existingTx) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        originalAmount: tx.amount, // If no discount, original = final
        discountAmount: 0
      }
    })
    console.log(`  ✅ Updated TX ${tx.id}: originalAmount = ${tx.amount}`)
  }
  
  // Step 2: Get affiliates for sample transactions
  console.log('\n📝 Step 2: Getting affiliate profiles...')
  const affiliates = await prisma.affiliateProfile.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, memberCode: true } } },
    take: 3
  })
  
  if (affiliates.length === 0) {
    console.log('  ⚠️ No active affiliates found. Creating sample affiliate...')
    // Find user with AFFILIATE role
    const affiliateUser = await prisma.user.findFirst({
      where: { role: 'AFFILIATE' }
    })
    
    if (affiliateUser) {
      const newAffiliate = await prisma.affiliateProfile.upsert({
        where: { userId: affiliateUser.id },
        update: { isActive: true },
        create: {
          userId: affiliateUser.id,
          affiliateCode: `AFF${affiliateUser.memberCode?.replace('EY', '') || '001'}`,
          tier: 1,
          commissionRate: 30,
          isActive: true,
          applicationStatus: 'APPROVED'
        }
      })
      affiliates.push({ ...newAffiliate, user: affiliateUser })
      console.log(`  ✅ Created affiliate profile for ${affiliateUser.name}`)
    }
  }
  
  console.log(`  Found ${affiliates.length} active affiliates`)
  
  // Step 3: Get memberships for transactions
  console.log('\n📝 Step 3: Getting membership plans...')
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    take: 3
  })
  console.log(`  Found ${memberships.length} active memberships`)
  
  // Step 4: Get some free members to create transactions for
  console.log('\n📝 Step 4: Getting free members for sample transactions...')
  const freeMembers = await prisma.user.findMany({
    where: { 
      role: 'MEMBER_FREE',
      NOT: {
        transactions: { some: {} } // Members without transactions
      }
    },
    take: 5
  })
  console.log(`  Found ${freeMembers.length} free members without transactions`)
  
  // Step 5: Create sample transactions with various scenarios
  console.log('\n📝 Step 5: Creating sample transactions...')
  
  const scenarios = [
    // Scenario 1: Successful transaction WITH affiliate, no discount
    {
      name: 'Success + Affiliate (No Discount)',
      status: 'SUCCESS',
      useAffiliate: true,
      useDiscount: false
    },
    // Scenario 2: Successful transaction WITH affiliate + discount
    {
      name: 'Success + Affiliate + Discount',
      status: 'SUCCESS',
      useAffiliate: true,
      useDiscount: true,
      discountPercent: 20
    },
    // Scenario 3: Successful transaction WITHOUT affiliate
    {
      name: 'Success (No Affiliate)',
      status: 'SUCCESS',
      useAffiliate: false,
      useDiscount: false
    },
    // Scenario 4: Failed transaction
    {
      name: 'Failed Transaction',
      status: 'FAILED',
      useAffiliate: true,
      useDiscount: false
    },
    // Scenario 5: Pending transaction
    {
      name: 'Pending Transaction',
      status: 'PENDING',
      useAffiliate: true,
      useDiscount: true,
      discountPercent: 10
    }
  ]
  
  let txCreated = 0
  let commissionCreated = 0
  
  for (let i = 0; i < Math.min(freeMembers.length, scenarios.length); i++) {
    const member = freeMembers[i]
    const scenario = scenarios[i]
    const membership = memberships[i % memberships.length]
    const affiliate = affiliates[i % affiliates.length]
    
    if (!membership) continue
    
    const originalPrice = parseFloat(membership.price)
    const discountAmount = scenario.useDiscount 
      ? Math.round(originalPrice * (scenario.discountPercent / 100))
      : 0
    const finalAmount = originalPrice - discountAmount
    
    // Calculate affiliate commission (30% of final amount)
    const commissionRate = 30
    const affiliateCommission = scenario.useAffiliate 
      ? Math.round(finalAmount * (commissionRate / 100))
      : 0
    
    // Create transaction
    const invoiceNumber = `INV-${Date.now()}-${i}`
    const externalId = `EXT-${Date.now()}-${i}`
    
    try {
      const tx = await prisma.transaction.create({
        data: {
          userId: member.id,
          type: 'MEMBERSHIP',
          status: scenario.status,
          amount: finalAmount,
          originalAmount: originalPrice,
          discountAmount: discountAmount,
          affiliateId: scenario.useAffiliate ? affiliate?.id : null,
          affiliateShare: affiliateCommission,
          description: `${scenario.name} - ${membership.name}`,
          invoiceNumber: invoiceNumber,
          externalId: externalId,
          paymentMethod: 'BANK_TRANSFER',
          paymentProvider: 'XENDIT',
          customerName: member.name,
          customerEmail: member.email,
          paidAt: scenario.status === 'SUCCESS' ? new Date() : null
        }
      })
      
      console.log(`\n  ✅ Created TX: ${scenario.name}`)
      console.log(`     User: ${member.name} (${member.memberCode})`)
      console.log(`     Original: Rp ${originalPrice.toLocaleString()}`)
      console.log(`     Discount: Rp ${discountAmount.toLocaleString()} (${scenario.discountPercent || 0}%)`)
      console.log(`     Final: Rp ${finalAmount.toLocaleString()}`)
      console.log(`     Status: ${scenario.status}`)
      
      txCreated++
      
      // Create affiliate conversion record for successful transactions with affiliate
      if (scenario.useAffiliate && scenario.status === 'SUCCESS' && affiliate) {
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliate.id,
            transactionId: tx.id,
            commissionAmount: affiliateCommission,
            commissionRate: commissionRate,
            paidOut: false
          }
        })
        
        // Update affiliate's total earnings
        await prisma.affiliateProfile.update({
          where: { id: affiliate.id },
          data: {
            totalEarnings: { increment: affiliateCommission },
            totalConversions: { increment: 1 }
          }
        })
        
        // Add to affiliate's wallet
        await prisma.wallet.upsert({
          where: { userId: affiliate.userId },
          create: {
            userId: affiliate.userId,
            balance: affiliateCommission,
            totalEarnings: affiliateCommission
          },
          update: {
            balance: { increment: affiliateCommission },
            totalEarnings: { increment: affiliateCommission }
          }
        })
        
        console.log(`     Affiliate: ${affiliate.user?.name || 'Unknown'}`)
        console.log(`     Commission: Rp ${affiliateCommission.toLocaleString()} (${commissionRate}%)`)
        commissionCreated++
      }
      
      // Create UserMembership for successful transactions
      if (scenario.status === 'SUCCESS') {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + (membership.durationDays || 30))
        
        await prisma.userMembership.create({
          data: {
            userId: member.id,
            membershipId: membership.id,
            transactionId: tx.id,
            startDate: startDate,
            endDate: endDate,
            isActive: true,
            status: 'ACTIVE'
          }
        })
        
        // Upgrade user to MEMBER_PREMIUM
        await prisma.user.update({
          where: { id: member.id },
          data: { role: 'MEMBER_PREMIUM' }
        })
        
        console.log(`     Membership: ${membership.name} (${membership.durationDays} days)`)
      }
      
    } catch (error) {
      console.error(`  ❌ Error creating transaction: ${error.message}`)
    }
  }
  
  // Step 6: Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(50))
  console.log(`Updated existing transactions: ${existingTx.length}`)
  console.log(`New transactions created: ${txCreated}`)
  console.log(`Affiliate commissions recorded: ${commissionCreated}`)
  
  // Final stats
  const finalStats = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true }
  })
  
  console.log('\n📈 TRANSACTION STATS BY STATUS:')
  finalStats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count} transactions, Total: Rp ${parseFloat(stat._sum.amount || 0).toLocaleString()}`)
  })
  
  const totalCommissions = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: true
  })
  
  console.log(`\n💰 AFFILIATE COMMISSIONS:`)
  console.log(`  Total records: ${totalCommissions._count}`)
  console.log(`  Total amount: Rp ${parseFloat(totalCommissions._sum.commissionAmount || 0).toLocaleString()}`)
  
  await prisma.$disconnect()
  console.log('\n✅ Migration completed!')
}

migrateTransactions().catch(console.error)
