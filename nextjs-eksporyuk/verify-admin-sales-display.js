/**
 * Verify Admin Sales Display Data
 * Check if affiliate names and commission amounts are populated
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyAdminSales() {
  console.log('🔍 Verifying Admin/Sales Data...\n')

  // Sample transactions with conversions
  const txWithConversions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      affiliateConversion: {
        isNot: null
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      affiliateConversion: {
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    },
    take: 20,
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`✅ Found ${txWithConversions.length} transactions with affiliate conversions\n`)
  console.log(`📋 Sample admin/sales display data:`)
  console.log(`${'─'.repeat(140)}`)
  console.log(`${'Invoice'.padEnd(15)} | ${'User'.padEnd(25)} | ${'Amount'.padEnd(12)} | ${'Affiliate'.padEnd(25)} | ${'Commission'.padEnd(12)} | Date`)
  console.log(`${'─'.repeat(140)}`)

  txWithConversions.slice(0, 10).forEach(tx => {
    const invoice = tx.invoiceNumber || '-'
    const user = tx.user.name.substring(0, 23)
    const amount = `Rp ${Number(tx.amount).toLocaleString('id-ID')}`
    const affiliate = tx.affiliateConversion.affiliate.user.name.substring(0, 23)
    const commission = `Rp ${Number(tx.affiliateConversion.commissionAmount).toLocaleString('id-ID')}`
    const date = new Date(tx.createdAt).toLocaleDateString('id-ID')
    
    console.log(`${invoice.padEnd(15)} | ${user.padEnd(25)} | ${amount.padEnd(12)} | ${affiliate.padEnd(25)} | ${commission.padEnd(12)} | ${date}`)
  })

  console.log(`${'─'.repeat(140)}\n`)

  // Stats
  const totalTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } })
  const txWithAffiliate = await prisma.transaction.count({
    where: {
      status: 'SUCCESS',
      affiliateConversion: {
        isNot: null
      }
    }
  })

  const totalCommission = await prisma.affiliateConversion.aggregate({
    _sum: {
      commissionAmount: true
    }
  })

  console.log(`📊 Summary:`)
  console.log(`   Total SUCCESS transactions: ${totalTx}`)
  console.log(`   With affiliate link: ${txWithAffiliate} (${((txWithAffiliate/totalTx)*100).toFixed(1)}%)`)
  console.log(`   Without affiliate: ${totalTx - txWithAffiliate}`)
  console.log(`   Total commission distributed: Rp ${Number(totalCommission._sum.commissionAmount || 0).toLocaleString('id-ID')}`)

  console.log(`\n✅ Verification complete!`)
  console.log(`ℹ️  Data is now ready for admin/sales display`)
}

verifyAdminSales()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
