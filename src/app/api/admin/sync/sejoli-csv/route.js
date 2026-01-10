import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const prisma = new PrismaClient()

// API untuk sync CSV data dari Sejoli
export async function POST(request) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { csvData, commissionRates = {} } = body

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'CSV data array is required' }, 
        { status: 400 }
      )
    }

    console.log(`🔄 Starting Sejoli CSV sync: ${csvData.length} orders`)
    
    // Default commission rates (flat amount in IDR)
    const defaultCommissionRates = {
      'Paket Ekspor Yuk Lifetime': 325000,    // Rp 325k
      'Paket Ekspor Yuk 12 Bulan': 275000,    // Rp 275k  
      'Paket Ekspor Yuk 6 Bulan': 225000,     // Rp 225k
      ...commissionRates // Override dengan input user
    }

    // Product to membership mapping
    const productMembershipMapping = {
      'Paket Ekspor Yuk Lifetime': 'LIFETIME',
      'Paket Ekspor Yuk 12 Bulan': 'TWELVE_MONTHS', 
      'Paket Ekspor Yuk 6 Bulan': 'SIX_MONTHS'
    }

    // Get current max invoice number
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

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      commissionsProcessed: 0,
      membershipsAssigned: 0
    }

    for (const order of csvData) {
      try {
        results.processed++

        // Skip jika data tidak lengkap
        if (!order.email || !order.status || !order.product) {
          results.skipped++
          continue
        }

        // Skip jika status bukan "Selesai"
        if (order.status !== 'Selesai') {
          results.skipped++
          continue
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: order.email }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: order.email,
              name: order.name || order.email.split('@')[0],
              whatsapp: order.phone || '',
              role: 'MEMBER_FREE',
              password: '$2b$10$defaultpasswordhash' // Will need to reset
            }
          })
          console.log(`👤 Created user: ${order.email}`)
        }

        // Enhanced duplicate detection
        const existingTxn = await prisma.transaction.findFirst({
          where: {
            OR: [
              // By invoice number from Sejoli
              { externalId: order.INV?.toString() },
              // By unique combination
              {
                AND: [
                  { userId: user.id },
                  { description: order.product },
                  { amount: parseFloat(order.price) || 0 },
                  { customerEmail: order.email },
                  {
                    createdAt: {
                      gte: new Date(new Date(order.created_at).setHours(0, 0, 0, 0)),
                      lt: new Date(new Date(order.created_at).setHours(23, 59, 59, 999))
                    }
                  }
                ]
              }
            ]
          }
        })

        if (existingTxn) {
          results.skipped++
          console.log(`⏭️  Skipped duplicate: ${order.email} - ${order.product}`)
          continue
        }

        // Create invoice number
        let invoiceNumber = `INV${nextInvoiceNumber}`
        
        // Double check uniqueness
        const existingInvoice = await prisma.transaction.findFirst({
          where: { invoiceNumber }
        })
        
        if (existingInvoice) {
          const maxInvoice = await prisma.transaction.findFirst({
            where: { invoiceNumber: { startsWith: 'INV' } },
            orderBy: { invoiceNumber: 'desc' }
          })
          
          if (maxInvoice) {
            const maxNum = parseInt(maxInvoice.invoiceNumber.replace('INV', ''))
            if (!isNaN(maxNum)) {
              invoiceNumber = `INV${maxNum + 1}`
              nextInvoiceNumber = maxNum + 2
            }
          }
        } else {
          nextInvoiceNumber++
        }

        // Find affiliate
        let affiliateProfile = null
        if (order.affiliate_id) {
          const affiliateUser = await prisma.user.findFirst({
            where: {
              OR: [
                { memberCode: order.affiliate_id?.toString() },
                { username: order.affiliate_id?.toString() },
                { name: { contains: order.affiliate?.toString() || '', mode: 'insensitive' } }
              ]
            },
            include: { affiliateProfile: true }
          })
          affiliateProfile = affiliateUser?.affiliateProfile
        }

        // Determine transaction type based on product
        let transactionType = 'MEMBERSHIP' // Default
        if (order.product && typeof order.product === 'string') {
          const productLower = order.product.toLowerCase()
          if (productLower.includes('lifetime') || productLower.includes('bulanan') || productLower.includes('tahunan')) {
            transactionType = 'MEMBERSHIP'
          } else if (productLower.includes('course') || productLower.includes('kelas')) {
            transactionType = 'COURSE'
          } else if (productLower.includes('event') || productLower.includes('webinar')) {
            transactionType = 'EVENT'
          } else {
            transactionType = 'PRODUCT'
          }
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            affiliateId: affiliateProfile?.id || null,
            invoiceNumber,
            amount: parseFloat(order.price) || 0,
            status: 'SUCCESS',
            type: transactionType,
            description: order.product,
            customerName: order.name,
            customerEmail: order.email,
            customerPhone: order.phone || '',
            customerWhatsapp: order.phone || '',
            paymentMethod: order.payment || 'BANK_TRANSFER',
            externalId: order.INV?.toString(),
            createdAt: new Date(order.created_at),
            metadata: {
              source: 'sejoli_csv_sync',
              syncedAt: new Date().toISOString(),
              originalCsvData: order,
              quantity: parseInt(order.quantity) || 1
            }
          }
        })

        results.created++
        console.log(`📄 Created transaction: ${invoiceNumber} - ${order.email}`)

        // Process affiliate commission (flat rate)
        if (affiliateProfile && defaultCommissionRates[order.product]) {
          const commissionAmount = defaultCommissionRates[order.product]
          
          try {
            // Check existing commission
            const existingCommission = await prisma.affiliateConversion.findFirst({
              where: {
                affiliateId: affiliateProfile.id,
                transactionId: transaction.id
              }
            })

            if (!existingCommission) {
              await prisma.affiliateConversion.create({
                data: {
                  affiliateId: affiliateProfile.id,
                  transactionId: transaction.id,
                  commissionAmount: commissionAmount,
                  commissionRate: 0, // Not used for flat rate
                  paidOut: false,
                  createdAt: new Date(order.created_at)
                }
              })

              // Update wallet
              await prisma.wallet.upsert({
                where: { userId: affiliateProfile.userId },
                create: {
                  userId: affiliateProfile.userId,
                  balance: commissionAmount,
                  balancePending: 0
                },
                update: {
                  balance: { increment: commissionAmount }
                }
              })

              results.commissionsProcessed++
              console.log(`💰 Processed commission: ${order.affiliate} - Rp ${commissionAmount.toLocaleString()}`)
            }
          } catch (commissionError) {
            console.error('❌ Commission processing error:', commissionError)
            results.errors.push(`Commission error for ${order.email}: ${commissionError.message}`)
          }
        }

        // Auto-assign membership
        const membershipType = productMembershipMapping[order.product]
        if (membershipType) {
          try {
            // Find membership plan
            const membership = await prisma.membership.findFirst({
              where: { 
                duration: membershipType
              }
            })

            if (membership) {
              // Check existing membership
              const existingMembership = await prisma.userMembership.findFirst({
                where: {
                  userId: user.id,
                  membershipId: membership.id,
                  status: { in: ['ACTIVE', 'PENDING'] }
                }
              })

              if (!existingMembership) {
                // Calculate expiry date
                let expiryDate = null
                if (membershipType !== 'LIFETIME') {
                  const months = membershipType === 'TWELVE_MONTHS' ? 12 : 6
                  expiryDate = new Date()
                  expiryDate.setMonth(expiryDate.getMonth() + months)
                } else {
                  // For LIFETIME, set a far future date instead of null
                  expiryDate = new Date('2099-12-31T23:59:59Z')
                }

                await prisma.userMembership.create({
                  data: {
                    userId: user.id,
                    membershipId: membership.id,
                    transactionId: transaction.id,
                    status: 'ACTIVE',
                    startDate: new Date(order.created_at),
                    endDate: expiryDate
                  }
                })

                results.membershipsAssigned++
                console.log(`🎯 Assigned membership: ${membershipType} to ${order.email}`)
              }
            }
          } catch (membershipError) {
            console.error('❌ Membership assignment error:', membershipError)
            results.errors.push(`Membership error for ${order.email}: ${membershipError.message}`)
          }
        }

      } catch (error) {
        console.error(`❌ Error processing order for ${order.email}:`, error)
        results.errors.push(`${order.email}: ${error.message}`)
      }
    }

    console.log('✅ Sejoli CSV sync completed:', results)

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} orders from CSV`,
      results,
      nextInvoiceNumber: `INV${nextInvoiceNumber}`,
      commissionRatesUsed: defaultCommissionRates
    })

  } catch (error) {
    console.error('❌ Sejoli CSV sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    )
  }
}

// GET endpoint info
export async function GET() {
  return NextResponse.json({
    message: 'Sejoli CSV Sync API Ready',
    usage: 'POST with csvData array and optional commissionRates',
    supportedProducts: [
      'Paket Ekspor Yuk Lifetime',
      'Paket Ekspor Yuk 12 Bulan', 
      'Paket Ekspor Yuk 6 Bulan'
    ],
    defaultCommissions: {
      'Paket Ekspor Yuk Lifetime': '325.000',
      'Paket Ekspor Yuk 12 Bulan': '275.000',
      'Paket Ekspor Yuk 6 Bulan': '225.000'
    },
    csvFormat: {
      required: ['INV', 'product', 'email', 'name', 'price', 'status', 'created_at'],
      optional: ['affiliate', 'affiliate_id', 'phone', 'payment']
    }
  })
}