/**
 * Fix Affiliate Links and Commission Amounts
 * Create missing AffiliateConversion records with proper commission calculation
 */

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

const affiliateFixData = require('./affiliate-fix-data.json')
const affiliateMapping = require('./affiliate-sejoli-mapping.json')

// Commission rates based on transaction amount
const commissionRates = {
  under50k: 10000,
  under200k: 50000,
  under450k: 125000,
  under750k: 225000,
  under900k: 305000,
  under1100k: 355000,
  over1100k: 500000
}

async function fixAffiliateCommissions() {
  console.log('🔧 Starting Affiliate & Commission Fix...\n')

  const { matchableAffiliates } = affiliateFixData
  const { found: affiliateMappings } = affiliateMapping

  console.log(`📊 Data loaded:`)
  console.log(`   Transactions to fix: ${matchableAffiliates.length}`)
  console.log(`   Affiliate mappings: ${affiliateMappings.length}\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  // Process in batches
  const batchSize = 50
  for (let i = 0; i < matchableAffiliates.length; i += batchSize) {
    const batch = matchableAffiliates.slice(i, i + batchSize)
    
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(matchableAffiliates.length/batchSize)}...`)

    for (const item of batch) {
      try {
        // Skip zero amount transactions
        if (!item.amount || Number(item.amount) === 0) {
          skipped++
          continue
        }

        // Find affiliate mapping
        const mapping = affiliateMappings.find(m => m.sejoliId === item.affiliateSejoliId)
        if (!mapping) {
          console.log(`   ⚠️  No mapping for Sejoli affiliate #${item.affiliateSejoliId}`)
          skipped++
          continue
        }

        // Check if conversion already exists
        const existing = await prisma.affiliateConversion.findFirst({
          where: {
            transactionId: item.txId
          }
        })

        if (existing) {
          // Update commission if needed
          const commissionAmount = getCommissionAmount(item.productId, item.amount)
          
          if (!existing.commissionAmount || Number(existing.commissionAmount) !== commissionAmount) {
            await prisma.affiliateConversion.update({
              where: { id: existing.id },
              data: { commissionAmount }
            })
            console.log(`   ✏️  Updated commission for TX ${item.txId.substring(0, 12)}...`)
          }
          
          skipped++
          continue
        }

        // Get affiliate profile
        const affiliateProfile = await prisma.affiliateProfile.findUnique({
          where: { userId: mapping.userId }
        })

        if (!affiliateProfile) {
          console.log(`   ⚠️  No affiliate profile for user ${mapping.userName}`)
          skipped++
          continue
        }

        // Calculate commission
        const commissionAmount = getCommissionAmount(item.productId, item.amount)
        const commissionRate = (commissionAmount / Number(item.amount)) * 100 // Calculate percentage

        // Create AffiliateConversion with Prisma.Decimal
        await prisma.affiliateConversion.create({
          data: {
            affiliate: {
              connect: { id: affiliateProfile.id }
            },
            transaction: {
              connect: { id: item.txId }
            },
            commissionAmount: new Prisma.Decimal(commissionAmount),
            commissionRate: new Prisma.Decimal(commissionRate.toFixed(2))
          }
        })

        created++
        
        if (created % 10 === 0) {
          console.log(`   ✅ Created ${created} conversions...`)
        }

      } catch (error) {
        console.error(`   ❌ Error processing TX ${item.txId}: ${error.message}`)
        errors++
      }
    }
  }

  console.log(`\n✅ Fix Complete!`)
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
}

function getCommissionAmount(productId, transactionAmount) {
  const amount = Number(transactionAmount)
  
  // Use amount-based commission tiers
  if (amount < 50000) {
    return commissionRates.under50k
  } else if (amount < 200000) {
    return commissionRates.under200k
  } else if (amount < 450000) {
    return commissionRates.under450k
  } else if (amount < 750000) {
    return commissionRates.under750k
  } else if (amount < 900000) {
    return commissionRates.under900k
  } else if (amount < 1100000) {
    return commissionRates.under1100k
  } else {
    return commissionRates.over1100k
  }
}

// Run with confirmation
const args = process.argv.slice(2)
if (args.includes('--execute')) {
  fixAffiliateCommissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
} else {
  console.log('🔍 DRY RUN MODE')
  console.log('To execute the fix, run: node fix-affiliate-commissions.js --execute')
  
  // Show what would be done
  fixAffiliateCommissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
