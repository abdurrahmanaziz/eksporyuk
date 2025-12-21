const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function testCsvImport() {
  console.log('🧪 Testing CSV Import with Rahmat Al Fianto Data')
  console.log('=' .repeat(50))

  try {
    // Sample CSV data from attachment (first 5 records)
    const csvData = [
      {
        INV: "19333",
        product: "Paket Ekspor Yuk Lifetime",
        created_at: "2025-12-19 23:53:49",
        name: "DERRY RIVAL DOEAN KING",
        email: "derryking914@gmail.com",
        phone: "085832599336",
        quantity: "1",
        price: "999000",
        status: "Selesai",
        affiliate: "Rahmat Al Fianto",
        affiliate_id: "1637"
      },
      {
        INV: "19329",
        product: "Paket Ekspor Yuk Lifetime", 
        created_at: "2025-12-19 22:15:44",
        name: "Achmad Noer Maulidi",
        email: "machmadnoer@gmail.com",
        phone: "085161171754",
        quantity: "1",
        price: "999000",
        status: "Selesai",
        affiliate: "Rahmat Al Fianto",
        affiliate_id: "1637"
      },
      {
        INV: "19324",
        product: "Paket Ekspor Yuk 12 Bulan",
        created_at: "2025-12-19 22:09:48", 
        name: "Tejo aprilianto dwi aspodo putro",
        email: "solotejo4@gmail.com",
        phone: "081336321209",
        quantity: "1",
        price: "899000",
        status: "Selesai",
        affiliate: "Rahmat Al Fianto",
        affiliate_id: "1637"
      },
      {
        INV: "19305",
        product: "Paket Ekspor Yuk 6 Bulan",
        created_at: "2025-12-19 21:56:14",
        name: "Andy Jim Sompotan", 
        email: "andy.jim2@gmail.com",
        phone: "081340316428",
        quantity: "1",
        price: "699000",
        status: "Selesai",
        affiliate: "Rahmat Al Fianto",
        affiliate_id: "1637"
      }
    ]

    console.log('\n1. Testing commission calculation...')
    
    // Commission rates (flat)
    const commissionRates = {
      'Paket Ekspor Yuk Lifetime': 325000,    // Rp 325k
      'Paket Ekspor Yuk 12 Bulan': 275000,    // Rp 275k  
      'Paket Ekspor Yuk 6 Bulan': 225000      // Rp 225k
    }

    let totalSales = 0
    let totalCommission = 0

    csvData.forEach(order => {
      const price = parseInt(order.price)
      const commission = commissionRates[order.product] || 0
      
      totalSales += price
      totalCommission += commission
      
      console.log(`   ${order.product}: Rp ${price.toLocaleString()} → Commission: Rp ${commission.toLocaleString()}`)
    })

    console.log(`\n   Total Sales: Rp ${totalSales.toLocaleString()}`)
    console.log(`   Total Commission: Rp ${totalCommission.toLocaleString()}`)
    console.log(`   Commission Rate: ${((totalCommission/totalSales)*100).toFixed(1)}% (average)`)

    console.log('\n2. Testing membership mapping...')
    
    const productMembershipMapping = {
      'Paket Ekspor Yuk Lifetime': 'LIFETIME',
      'Paket Ekspor Yuk 12 Bulan': 'TWELVE_MONTHS',
      'Paket Ekspor Yuk 6 Bulan': 'SIX_MONTHS'
    }

    // Check if memberships exist in database
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, duration: true }
    })

    console.log('Available memberships in database:')
    memberships.forEach(m => {
      console.log(`   ${m.name} (${m.duration})`)
    })

    console.log('\nProduct mapping test:')
    Object.entries(productMembershipMapping).forEach(([product, duration]) => {
      const found = memberships.find(m => m.duration === duration)
      console.log(`   "${product}" → ${duration} ${found ? '✅' : '❌'}`)
    })

    console.log('\n3. Testing affiliate lookup...')
    
    // Look for Rahmat Al Fianto affiliate
    const rahmatAffiliate = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Rahmat Al Fianto', mode: 'insensitive' } },
          { username: '1637' },
          { memberCode: '1637' }
        ]
      },
      include: {
        affiliateProfile: true
      }
    })

    if (rahmatAffiliate) {
      console.log(`   ✅ Found Rahmat Al Fianto: ${rahmatAffiliate.email}`)
      console.log(`   Member Code: ${rahmatAffiliate.memberCode || 'Not set'}`)
      console.log(`   Has Profile: ${rahmatAffiliate.affiliateProfile ? 'Yes' : 'No'}`)
    } else {
      console.log('   ❌ Rahmat Al Fianto not found in database')
      console.log('   📝 Will need to create affiliate profile first')
    }

    console.log('\n4. Testing duplicate detection...')
    
    // Check if any of these transactions already exist
    for (const order of csvData.slice(0, 2)) { // Test first 2
      const existing = await prisma.transaction.findFirst({
        where: {
          OR: [
            { externalId: order.INV },
            {
              AND: [
                { customerEmail: order.email },
                { amount: parseInt(order.price) },
                { description: order.product }
              ]
            }
          ]
        }
      })

      if (existing) {
        console.log(`   🔄 Transaction ${order.INV} already exists (will skip)`)
      } else {
        console.log(`   ✅ Transaction ${order.INV} is new (will create)`)
      }
    }

    console.log('\n5. Testing invoice numbering...')
    
    const lastInvoice = await prisma.transaction.findFirst({
      where: { invoiceNumber: { startsWith: 'INV' } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true }
    })

    let nextInvoiceNumber = 12001
    if (lastInvoice?.invoiceNumber) {
      const num = parseInt(lastInvoice.invoiceNumber.replace('INV', ''))
      if (!isNaN(num)) {
        nextInvoiceNumber = Math.max(num + 1, 12001)
      }
    }

    console.log(`   Last invoice: ${lastInvoice?.invoiceNumber || 'None'}`)
    console.log(`   Next invoice: INV${nextInvoiceNumber}`)

    console.log('\n6. Simulating CSV import process...')
    
    let processed = 0
    let created = 0
    let skipped = 0
    let commissionsProcessed = 0

    for (const order of csvData) {
      processed++
      
      // Check user exists
      const user = await prisma.user.findUnique({
        where: { email: order.email }
      })
      
      if (!user) {
        console.log(`   👤 Would create user: ${order.email}`)
      }
      
      // Check duplicate
      const existing = await prisma.transaction.findFirst({
        where: {
          OR: [
            { externalId: order.INV },
            {
              AND: [
                { customerEmail: order.email },
                { amount: parseInt(order.price) },
                { description: order.product }
              ]
            }
          ]
        }
      })
      
      if (existing) {
        skipped++
        console.log(`   ⏭️  Would skip: ${order.INV} (duplicate)`)
      } else {
        created++
        const commission = commissionRates[order.product] || 0
        if (commission > 0) {
          commissionsProcessed++
        }
        console.log(`   ✅ Would create: ${order.INV} - Rp ${commission.toLocaleString()} commission`)
      }
    }

    console.log('\n📊 Simulation Results:')
    console.log(`   Processed: ${processed}`)
    console.log(`   Would Create: ${created}`)
    console.log(`   Would Skip: ${skipped}`)
    console.log(`   Commissions: ${commissionsProcessed}`)

    console.log('\n✅ CSV import test completed!')
    console.log('\n🔗 Ready to use: http://localhost:3000/admin/sync/csv')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCsvImport()