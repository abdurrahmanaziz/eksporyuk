import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { csvData, membershipId, affiliateId, affiliateCommission } = body

    // Validate required fields
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }
    
    if (!membershipId) {
      return NextResponse.json({ error: 'Membership selection is required' }, { status: 400 })
    }
    
    if (!affiliateId) {
      return NextResponse.json({ error: 'Affiliate selection is required' }, { status: 400 })
    }

    // Verify membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, name: true, duration: true, price: true }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Verify affiliate exists
    const affiliate = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { id: true, name: true, email: true }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Get affiliate profile ID for AffiliateConversion
    const affiliateProfile = await prisma.affiliateProfile.findFirst({
      where: { userId: affiliateId },
      select: { id: true }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    console.log(`🔄 Starting Sejoli sync: ${csvData.length} transactions`)
    console.log(`📦 Membership: ${membership.name}, 💰 Commission: Rp${affiliateCommission}`)
    
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

    // Process each transaction
    for (const row of csvData) {
      try {
        results.processed++

        // Extract CSV fields
        const email = row.email?.trim()
        const name = row.name?.trim()
        const price = parseFloat(row.price) || 0
        const status = row.status?.trim().toLowerCase()
        
        // Validate required fields
        if (!email) {
          results.errors.push(`Row ${results.processed}: Email is required`)
          results.skipped++
          continue
        }

        // Skip if not completed/successful
        if (status !== 'completed' && status !== 'success' && status !== 'selesai') {
          results.skipped++
          continue
        }

        // Find or create user (the CUSTOMER, not the affiliate)
        let user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              role: 'MEMBER_FREE',
              password: 'temp_password_needs_reset' // Placeholder
            }
          })
          console.log(`✨ Created new user: ${email}`)
        }

        // Check for duplicate transaction (same user + email + date combo)
        const invoiceNum = row.INV?.trim() || ''
        const existingTxn = await prisma.transaction.findFirst({
          where: {
            OR: [
              { invoiceNumber: invoiceNum },
              {
                AND: [
                  { userId: user.id },
                  { customerEmail: email },
                  { description: membership.name },
                  { amount: price }
                ]
              }
            ]
          }
        })

        if (existingTxn) {
          results.skipped++
          console.log(`⏭️  Skipped duplicate: ${email}`)
          continue
        }

        // Create transaction - this is the customer's purchase transaction
        const invoiceNumber = invoiceNum || `INV${nextInvoiceNumber++}`

        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,  // CUSTOMER ID
            customerEmail: email,  // CUSTOMER EMAIL
            customerName: name || email,  // CUSTOMER NAME
            invoiceNumber,
            description: membership.name,
            amount: price,
            status: 'SUCCESS',
            type: 'MEMBERSHIP',
            affiliateId: affiliateId,  // SELECTED AFFILIATE (from form, not from CSV)
            paymentMethod: 'SEJOLI_SYNC',
            metadata: {
              syncedAt: new Date().toISOString(),
              originalPrice: price,
              commission: affiliateCommission,
              membershipId: membershipId,
              originalAffiliate: row.affiliate_id || 'unknown'  // Track original affiliate from CSV
            }
          }
        })

        console.log(`✅ Created transaction: ${invoiceNumber} - ${email}`)
        results.created++

        // Create affiliate conversion record
        try {
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliateProfile.id,  // Use AffiliateProfile.id, not User.id
              transactionId: transaction.id,
              commissionAmount: affiliateCommission,
              commissionRate: membership.affiliateCommissionRate || 0,
              paidOut: false
            }
          })
          console.log(`📊 Created affiliate conversion: ${affiliateProfile.id}`)
        } catch (err) {
          console.error(`Failed to create affiliate conversion:`, err.message)
          // Don't fail the whole process if affiliate conversion fails
        }

        // Create user membership record
        try {
          const endDate = new Date()
          switch (membership.duration) {
            case 'ONE_MONTH':
              endDate.setMonth(endDate.getMonth() + 1)
              break
            case 'THREE_MONTHS':
              endDate.setMonth(endDate.getMonth() + 3)
              break
            case 'SIX_MONTHS':
              endDate.setMonth(endDate.getMonth() + 6)
              break
            case 'TWELVE_MONTHS':
              endDate.setFullYear(endDate.getFullYear() + 1)
              break
            case 'LIFETIME':
              endDate.setFullYear(2099, 11, 31)
              break
          }

          await prisma.userMembership.upsert({
            where: {
              userId_membershipId: {
                userId: user.id,
                membershipId: membershipId
              }
            },
            create: {
              userId: user.id,
              membershipId: membershipId,
              transactionId: transaction.id,
              startDate: new Date(),
              endDate,
              isActive: true,
              status: 'ACTIVE',
              activatedAt: new Date(),
              price
            },
            update: {
              isActive: true,
              status: 'ACTIVE',
              endDate,
              transactionId: transaction.id
            }
          })

          results.membershipsAssigned++
          console.log(`🎁 Assigned membership: ${membership.name} to ${email}`)
        } catch (err) {
          console.error(`Failed to assign membership for ${email}:`, err.message)
        }

        // Add commission to affiliate wallet
        try {
          // Upsert wallet for affiliate if not exists
          await prisma.wallet.upsert({
            where: { userId: affiliateId },
            create: {
              userId: affiliateId,
              balance: affiliateCommission,
              balancePending: 0,
              totalEarnings: affiliateCommission
            },
            update: {
              balance: {
                increment: affiliateCommission
              },
              totalEarnings: {
                increment: affiliateCommission
              }
            }
          })

          // Record commission transaction
          await prisma.transaction.create({
            data: {
              userId: affiliateId,
              customerEmail: affiliate.email,
              customerName: affiliate.name,
              invoiceNumber: `COM-${invoiceNumber}`,
              description: `Commission from ${email} - ${membership.name}`,
              amount: affiliateCommission,
              status: 'SUCCESS',
              type: 'COMMISSION',
              paymentMethod: 'SYNC_COMMISSION',
              metadata: {
                sourceTransaction: transaction.id,
                reason: 'affiliate_commission',
                fromUser: email
              }
            }
          })

          results.commissionsProcessed++
          console.log(`💰 Added commission: Rp${affiliateCommission} to ${affiliate.email}`)
        } catch (err) {
          console.error(`Failed to process commission for affiliate:`, err.message)
          results.errors.push(`Commission processing failed for ${affiliate.email}: ${err.message}`)
        }
      } catch (err) {
        results.errors.push(`Row ${results.processed}: ${err.message}`)
        console.error(`Error processing row ${results.processed}:`, err)
      }
    }

    console.log(`✅ Sync completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`)

    return NextResponse.json({
      success: true,
      message: `Sync completed successfully`,
      results
    })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual trigger via admin panel
export async function GET() {
  return NextResponse.json({
    message: 'Sejoli Sync API Ready',
    usage: 'POST with csvData array, membershipId, affiliateId, and affiliateCommission',
    example: {
      csvData: [
        {
          email: 'user@example.com',
          name: 'John Doe',
          price: '399000',
          status: 'completed',
          INV: 'INV12001'
        }
      ],
      membershipId: 'mem-123',
      affiliateId: 'user-456',
      affiliateCommission: 79800
    }
  })
}