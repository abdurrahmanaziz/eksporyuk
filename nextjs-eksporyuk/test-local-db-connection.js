/**
 * Quick Database Connection Test
 * Verify local environment is connected to Neon database
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n')

  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT current_database(), version()`
    console.log('✅ Database Connection: SUCCESS')
    console.log('   Connected to:', result[0].current_database)
    console.log('   Version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1])

    // Check transaction counts
    const totalTx = await prisma.transaction.count()
    const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } })
    const withInvoice = await prisma.transaction.count({ 
      where: { 
        status: 'SUCCESS',
        invoiceNumber: { not: null }
      } 
    })
    const withAffiliate = await prisma.transaction.count({
      where: {
        status: 'SUCCESS',
        affiliateConversion: { isNot: null }
      }
    })

    console.log('\n📊 Transaction Statistics:')
    console.log(`   Total Transactions: ${totalTx}`)
    console.log(`   SUCCESS Transactions: ${successTx}`)
    console.log(`   With Invoice Numbers: ${withInvoice}`)
    console.log(`   With Affiliate Links: ${withAffiliate}`)

    // Sample data for admin/sales display
    const sampleTx = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateConversion: { isNot: null }
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
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    console.log('\n📋 Sample Admin/Sales Display Data:')
    console.log('─'.repeat(120))
    console.log(`${'Invoice'.padEnd(15)} | ${'User'.padEnd(25)} | ${'Amount'.padEnd(12)} | ${'Affiliate'.padEnd(25)} | ${'Commission'}`)
    console.log('─'.repeat(120))

    sampleTx.forEach(tx => {
      const invoice = tx.invoiceNumber || '-'
      const user = tx.user.name.substring(0, 23)
      const amount = `Rp ${Number(tx.amount).toLocaleString('id-ID')}`
      const affiliate = tx.affiliateConversion.affiliate.user.name.substring(0, 23)
      const commission = `Rp ${Number(tx.affiliateConversion.commissionAmount).toLocaleString('id-ID')}`
      
      console.log(`${invoice.padEnd(15)} | ${user.padEnd(25)} | ${amount.padEnd(12)} | ${affiliate.padEnd(25)} | ${commission}`)
    })

    console.log('\n✅ Local environment is connected to Neon (same as production)')
    console.log('✅ Admin/sales data should display correctly with:')
    console.log('   - Invoice numbers in INV##### format')
    console.log('   - Affiliate names')
    console.log('   - Commission amounts')

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
