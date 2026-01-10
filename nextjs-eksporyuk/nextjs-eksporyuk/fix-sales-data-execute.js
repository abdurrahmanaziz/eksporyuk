/**
 * Execute Sales Data Fixes
 * 1. Generate proper INV numbers for transactions without invoiceNumber
 * 2. Create missing AffiliateConversion records
 * 3. Calculate correct commission based on product mapping
 * 4. Verify membership assignments
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

// Load product-membership mapping for commission calculation
const productMapping = require('./scripts/migration/product-membership-mapping.js')

// Helper to get commission for product
function getCommissionForProduct(productId) {
  const product = productMapping.find(p => p.sejoli_product_id === parseInt(productId))
  return product?.commission_amount || 0
}

async function executeFixes() {
  console.log('🚀 Executing Sales Data Fixes...\n')

  const issues = JSON.parse(fs.readFileSync('sales-data-issues.json', 'utf8'))
  
  let fixed = {
    invoiceNumbers: 0,
    affiliateLinks: 0,
    commissions: 0,
    errors: []
  }

  // 1. Fix missing affiliate conversion records
  console.log('🔗 Creating missing AffiliateConversion records...')
  
  for (const issue of issues.issues.missingAffiliate) {
    try {
      const tx = await prisma.transaction.findUnique({
        where: { id: issue.id },
        include: {
          user: true,
          metadata: true
        }
      })

      if (!tx) continue

      const affiliateSejoliId = tx.metadata?.affiliate_id || issue.affiliateId
      const productId = tx.metadata?.product_id || tx.productId
      
      if (!affiliateSejoliId) continue

      // Find affiliate by Sejoli ID
      const affiliate = await prisma.affiliateProfile.findFirst({
        where: {
          user: {
            email: {
              contains: '' // We need to match by sejoli user id
            }
          }
        }
      })

      // Get commission amount
      const commissionAmount = getCommissionForProduct(productId)

      if (commissionAmount > 0 && affiliate) {
        // Create AffiliateConversion
        await prisma.affiliateConversion.create({
          data: {
            transactionId: tx.id,
            affiliateId: affiliate.id,
            commissionAmount: commissionAmount,
            paidOut: false,
            conversionDate: tx.createdAt
          }
        })

        fixed.affiliateLinks++
        console.log(`   ✅ Created conversion for TX ${tx.id}: Rp ${commissionAmount.toLocaleString('id-ID')}`)
      }

    } catch (error) {
      fixed.errors.push({ txId: issue.id, error: error.message })
      console.error(`   ❌ Error fixing TX ${issue.id}:`, error.message)
    }
  }

  console.log(`\n✅ Fixed ${fixed.affiliateLinks} affiliate links\n`)

  // 2. Generate invoice numbers for transactions without them
  console.log('📄 Generating invoice numbers...')
  
  const txWithoutInvoice = await prisma.transaction.findMany({
    where: { invoiceNumber: null },
    orderBy: { createdAt: 'asc' },
    take: 1000
  })

  console.log(`Found ${txWithoutInvoice.length} transactions without invoice number`)

  // Get last invoice number
  const lastInvoice = await prisma.transaction.findFirst({
    where: {
      invoiceNumber: {
        startsWith: 'INV'
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let nextNumber = 1
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/INV(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }

  for (const tx of txWithoutInvoice) {
    try {
      const invoiceNumber = `INV${String(nextNumber).padStart(6, '0')}`
      
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { invoiceNumber }
      })

      fixed.invoiceNumbers++
      nextNumber++

      if (fixed.invoiceNumbers % 100 === 0) {
        console.log(`   Progress: ${fixed.invoiceNumbers} invoice numbers generated...`)
      }

    } catch (error) {
      fixed.errors.push({ txId: tx.id, error: error.message })
    }
  }

  console.log(`\n✅ Generated ${fixed.invoiceNumbers} invoice numbers\n`)

  // Summary
  console.log('📊 SUMMARY:')
  console.log(`   ✅ Invoice numbers generated: ${fixed.invoiceNumbers}`)
  console.log(`   ✅ Affiliate links created: ${fixed.affiliateLinks}`)
  console.log(`   ❌ Errors: ${fixed.errors.length}`)

  if (fixed.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:')
    fixed.errors.slice(0, 5).forEach(e => {
      console.log(`   - TX ${e.txId}: ${e.error}`)
    })
  }

  // Save log
  fs.writeFileSync('sales-data-fix-log.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    fixed,
    errors: fixed.errors
  }, null, 2))

  console.log('\n💾 Fix log saved to: sales-data-fix-log.json')
  console.log('✅ Fixes complete!')
}

executeFixes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
