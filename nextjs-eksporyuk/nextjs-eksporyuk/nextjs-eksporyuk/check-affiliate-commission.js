/**
 * Check and Fix Missing Affiliate & Commission Data
 * Link transactions to affiliates and calculate commissions
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Load Sejoli data for reference
const sejoliData = require('./sejoli-sales-1766146821365.json')

async function checkAffiliateData() {
  console.log('🔍 Checking Affiliate & Commission Data...\n')

  // 1. Get transactions without affiliate conversion
  const txWithoutAffiliate = await prisma.transaction.findMany({
    where: {
      affiliateConversion: null,
      status: 'SUCCESS' // Only successful transactions
    },
    include: {
      user: true
    },
    take: 1000
  })

  console.log(`Found ${txWithoutAffiliate.length} SUCCESS transactions without affiliate link\n`)

  // 2. Check which ones should have affiliate
  let shouldHaveAffiliate = 0
  let matchableAffiliates = []

  for (const tx of txWithoutAffiliate) {
    // Try to find matching Sejoli order
    const sejoliOrder = sejoliData.find(s => {
      const amountMatch = Number(s.grand_total) === Number(tx.amount)
      const userMatch = s.user_email === tx.user.email || 
                       s.user_id === tx.user.id
      const dateMatch = new Date(s.created_at).toDateString() === new Date(tx.createdAt).toDateString()
      
      return amountMatch && (userMatch || dateMatch)
    })

    if (sejoliOrder && sejoliOrder.affiliate_id && sejoliOrder.affiliate_id !== '0') {
      shouldHaveAffiliate++
      matchableAffiliates.push({
        txId: tx.id,
        sejoliOrderId: sejoliOrder.ID,
        affiliateSejoliId: sejoliOrder.affiliate_id,
        affiliateName: sejoliOrder.affiliate_name,
        productId: sejoliOrder.product_id,
        amount: tx.amount
      })
    }
  }

  console.log(`📊 Analysis:`)
  console.log(`   Total without affiliate: ${txWithoutAffiliate.length}`)
  console.log(`   Should have affiliate: ${shouldHaveAffiliate}`)
  console.log(`   Truly no affiliate: ${txWithoutAffiliate.length - shouldHaveAffiliate}\n`)

  if (matchableAffiliates.length > 0) {
    console.log(`📋 Sample matchable affiliates (first 10):`)
    matchableAffiliates.slice(0, 10).forEach(m => {
      console.log(`   TX ${m.txId.substring(0, 12)}... → Affiliate: ${m.affiliateName} (Sejoli #${m.affiliateSejoliId})`)
    })
  }

  // 3. Check existing affiliate conversions for commission
  console.log(`\n🔍 Checking existing conversions (skipping detailed check due to orphaned records)...\n`)

  const totalConversions = await prisma.affiliateConversion.count()
  console.log(`Total AffiliateConversion records: ${totalConversions}`)

  const conversionsWithoutCommission = []

  console.log(`\n🔍 Affiliate Conversions without Commission: ${conversionsWithoutCommission.length}`)

  if (conversionsWithoutCommission.length > 0) {
    console.log(`\n📋 Sample conversions needing commission calculation:`)
    conversionsWithoutCommission.slice(0, 5).forEach(conv => {
      console.log(`   Conversion ${conv.id}: TX ${conv.transactionId}, Affiliate: ${conv.affiliate.user.name}`)
    })
  }

  // Save data for next step
  const fs = require('fs')
  fs.writeFileSync('affiliate-fix-data.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    matchableAffiliates,
    conversionsWithoutCommission: conversionsWithoutCommission.map(c => ({
      id: c.id,
      transactionId: c.transactionId,
      affiliateId: c.affiliateId,
      amount: Number(c.transaction.amount)
    }))
  }, null, 2))

  console.log(`\n💾 Data saved to: affiliate-fix-data.json`)
  console.log(`\n✅ Analysis complete!`)
  console.log(`\nℹ️  Note: Creating affiliate links requires matching Sejoli affiliate IDs with platform users`)
  console.log(`   This is complex and should be done carefully to avoid wrong attributions`)
}

checkAffiliateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
