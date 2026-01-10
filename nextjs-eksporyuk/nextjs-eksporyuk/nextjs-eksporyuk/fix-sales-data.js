/**
 * Fix Admin Sales Data
 * 1. Standardize invoice numbers to INV format
 * 2. Fill affiliate data from AffiliateConversion
 * 3. Fill commission data correctly
 * 4. Verify membership assignment
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSalesData() {
  console.log('🔧 Fixing Admin Sales Data...\n')

  // 1. Check current invoice format issues
  console.log('📋 Checking invoice number formats...')
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      externalId: true,
      type: true,
      amount: true,
      createdAt: true,
      affiliateConversion: {
        include: {
          affiliate: {
            include: {
              user: true
            }
          }
        }
      },
      metadata: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  })

  console.log(`Found ${transactions.length} recent transactions\n`)

  // Count invoice formats
  const invoiceFormats = {
    INV: 0,
    INVSEJOL: 0,
    null: 0,
    other: 0
  }

  const issuesFound = {
    wrongInvoiceFormat: [],
    missingAffiliate: [],
    missingCommission: []
  }

  transactions.forEach(tx => {
    // Check invoice format
    if (!tx.invoiceNumber) {
      invoiceFormats.null++
    } else if (tx.invoiceNumber.startsWith('INVSEJOL')) {
      invoiceFormats.INVSEJOL++
      issuesFound.wrongInvoiceFormat.push(tx.id)
    } else if (tx.invoiceNumber.startsWith('INV')) {
      invoiceFormats.INV++
    } else {
      invoiceFormats.other++
    }

    // Check affiliate data
    const sejoliOrderId = tx.metadata?.sejoli_order_id
    const hasAffiliateId = tx.metadata?.affiliate_id || tx.metadata?.affiliateId
    
    if (hasAffiliateId && !tx.affiliateConversion) {
      issuesFound.missingAffiliate.push({
        id: tx.id,
        sejoliOrderId,
        affiliateId: hasAffiliateId
      })
    }

    // Check commission
    if (tx.affiliateConversion && !tx.affiliateConversion.commissionAmount) {
      issuesFound.missingCommission.push({
        id: tx.id,
        conversionId: tx.affiliateConversion.id
      })
    }
  })

  console.log('📊 Invoice Format Analysis:')
  console.log(`   INV format (correct): ${invoiceFormats.INV}`)
  console.log(`   INVSEJOL format (wrong): ${invoiceFormats.INVSEJOL}`)
  console.log(`   No invoice: ${invoiceFormats.null}`)
  console.log(`   Other format: ${invoiceFormats.other}\n`)

  console.log('⚠️  Issues Found:')
  console.log(`   Wrong invoice format: ${issuesFound.wrongInvoiceFormat.length}`)
  console.log(`   Missing affiliate link: ${issuesFound.missingAffiliate.length}`)
  console.log(`   Missing commission: ${issuesFound.missingCommission.length}\n`)

  // Sample issues
  if (issuesFound.wrongInvoiceFormat.length > 0) {
    console.log('📋 Sample wrong invoice formats:')
    const samples = await prisma.transaction.findMany({
      where: { id: { in: issuesFound.wrongInvoiceFormat.slice(0, 5) } },
      select: { id: true, invoiceNumber: true, createdAt: true }
    })
    samples.forEach(s => {
      console.log(`   ${s.invoiceNumber} → Need to fix to INV format`)
    })
    console.log('')
  }

  if (issuesFound.missingAffiliate.length > 0) {
    console.log('📋 Sample missing affiliate links:')
    issuesFound.missingAffiliate.slice(0, 5).forEach(issue => {
      console.log(`   TX ${issue.id}: Sejoli Order #${issue.sejoliOrderId}, Affiliate ${issue.affiliateId}`)
    })
    console.log('')
  }

  // Save issues for fixing
  const fs = require('fs')
  fs.writeFileSync('sales-data-issues.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      wrongInvoiceFormat: issuesFound.wrongInvoiceFormat.length,
      missingAffiliate: issuesFound.missingAffiliate.length,
      missingCommission: issuesFound.missingCommission.length
    },
    issues: issuesFound
  }, null, 2))

  console.log('💾 Issues saved to: sales-data-issues.json')
  console.log('\n✅ Analysis complete!')
  console.log('\nNext: Run fix-sales-data-execute.js to apply fixes')
}

fixSalesData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
