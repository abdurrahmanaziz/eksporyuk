import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Type for CSV record
type SejoliRecord = {
  INV?: string
  inv?: string
  product?: string
  created_at?: string
  name?: string
  email?: string
  phone?: string
  price?: string
  status?: string
  affiliate?: string
  affiliate_id?: string
  [key: string]: any
}

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/import/sejoli-csv
 * 
 * Import transactions from Sejoli CSV export
 * Automatically creates affiliates and links transactions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const membershipId = formData.get('membershipId') as string
    const dryRun = formData.get('dryRun') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read CSV content
    const csvContent = await file.text()
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as SejoliRecord[]

    // Get membership if specified
    let membership = null
    if (membershipId && membershipId !== 'none') {
      membership = await prisma.membership.findUnique({
        where: { id: membershipId }
      })
    }

    // Process results
    const results = {
      total: records.length,
      processed: 0,
      skipped: 0,
      errors: [] as string[],
      affiliatesCreated: 0,
      transactionsCreated: 0,
      conversionsCreated: 0,
      preview: [] as any[],
    }

    // Pre-fetch existing data for efficiency
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    const userByEmail = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]))
    
    const existingAffiliates = await prisma.affiliateProfile.findMany()
    
    // Fetch users for affiliates
    const affiliateUserIds = existingAffiliates.map(a => a.userId)
    const affiliateUsersData = affiliateUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: affiliateUserIds } }
    }) : []
    const affiliateUserMap = new Map(affiliateUsersData.map(u => [u.id, u]))
    
    // Add user data to affiliates for lookup
    const existingAffiliatesWithUser = existingAffiliates.map(aff => ({
      ...aff,
      user: affiliateUserMap.get(aff.userId) || null
    }))
    
    const affiliateByWpId = new Map<number, typeof existingAffiliatesWithUser[0]>()
    const affiliateByName = new Map<string, typeof existingAffiliatesWithUser[0]>()
    
    // Build affiliate lookup maps
    existingAffiliatesWithUser.forEach(aff => {
      if (aff.user?.name) {
        affiliateByName.set(aff.user.name.toLowerCase(), aff)
      }
    })

    // Process each record
    for (const record of records as SejoliRecord[]) {
      try {
        const inv = record.INV || record.inv
        const product = record.product
        const createdAt = record.created_at
        const customerName = record.name
        const customerEmail = record.email?.toLowerCase()
        const phone = record.phone
        const price = parseFloat(record.price) || 0
        const status = record.status
        // Note: In Sejoli CSV export, 'affiliate' column has the WP user ID, 'affiliate_id' has the name
        const wpAffiliateId = parseInt(record.affiliate) || 0
        const affiliateName = record.affiliate_id?.trim()

        // Skip if not completed
        if (status !== 'Selesai') {
          results.skipped++
          continue
        }

        // Skip self-referral (customer = affiliate)
        if (customerName?.toLowerCase() === affiliateName?.toLowerCase()) {
          results.skipped++
          results.errors.push(`Skipped INV ${inv}: Self-referral (${customerName})`)
          continue
        }

        // Find or create customer user
        let customer = userByEmail.get(customerEmail)
        
        // Find affiliate by name
        let affiliate = affiliateName ? affiliateByName.get(affiliateName.toLowerCase()) : null

        // For preview/dry run
        if (dryRun) {
          results.preview.push({
            inv,
            product,
            customer: customerName,
            email: customerEmail,
            price,
            affiliate: affiliateName || '-',
            affiliateFound: !!affiliate,
            customerFound: !!customer,
            wpAffiliateId,
          })
          results.processed++
          continue
        }

        // Create customer if not exists
        if (!customer && customerEmail) {
          customer = await prisma.user.create({
            data: {
              email: customerEmail,
              name: customerName || customerEmail.split('@')[0],
              password: '', // No password, they need to reset
              whatsapp: phone,
              role: 'MEMBER_FREE',
              emailVerified: true,
            }
          })
          userByEmail.set(customerEmail, customer)
        }

        if (!customer) {
          results.errors.push(`INV ${inv}: Customer email not found`)
          results.skipped++
          continue
        }

        // Create affiliate if not exists but has affiliate name
        if (!affiliate && affiliateName && wpAffiliateId > 0) {
          // Find user with similar name for affiliate
          let affiliateUser = existingUsers.find(u => 
            u.name?.toLowerCase() === affiliateName.toLowerCase()
          )

          if (!affiliateUser) {
            // Create affiliate user
            const affEmail = `aff${wpAffiliateId}@eksporyuk.temp`
            affiliateUser = await prisma.user.create({
              data: {
                email: affEmail,
                name: affiliateName,
                password: '',
                role: 'AFFILIATE',
                emailVerified: true,
              }
            })
          }

          // Create affiliate profile
          const affCode = `AFF${wpAffiliateId}`
          const shortLinkUsername = affiliateName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
          
          const newAffProfile = await prisma.affiliateProfile.create({
            data: {
              id: createId(),
              userId: affiliateUser.id,
              affiliateCode: affCode,
              shortLink: `https://eksy.id/${shortLinkUsername}`,
              shortLinkUsername,
              tier: 1,
              commissionRate: 30,
              totalEarnings: 0,
              totalConversions: 0,
              totalClicks: 0,
              isActive: true,
              approvedAt: new Date(),
              updatedAt: new Date()
            }
          })

          affiliate = { ...newAffProfile, user: affiliateUser } as any
          affiliateByName.set(affiliateName.toLowerCase(), affiliate)
          affiliateByWpId.set(wpAffiliateId, affiliate)
          results.affiliatesCreated++
        }

        // Check if transaction already exists
        const existingTx = await prisma.transaction.findFirst({
          where: {
            OR: [
              { invoiceNumber: inv },
              {
                userId: customer.id,
                amount: price,
                createdAt: {
                  gte: new Date(new Date(createdAt).getTime() - 60000),
                  lte: new Date(new Date(createdAt).getTime() + 60000),
                }
              }
            ]
          }
        })

        if (existingTx) {
          // Update affiliate if different
          if (affiliate && existingTx.affiliateId !== affiliate.id) {
            await prisma.transaction.update({
              where: { id: existingTx.id },
              data: { affiliateId: affiliate.id }
            })

            // Create conversion if not exists
            const existingConversion = await prisma.affiliateConversion.findFirst({
              where: { transactionId: existingTx.id }
            })

            if (!existingConversion && affiliate) {
              const commission = Math.round(price * 0.30)
              await prisma.affiliateConversion.create({
                data: {
                  id: createId(),
                  affiliateId: affiliate.id,
                  transactionId: existingTx.id,
                  commissionAmount: commission,
                  commissionRate: 30,
                  paidOut: false,
                }
              })
              results.conversionsCreated++
            }
          }
          results.processed++
          continue
        }

        // Create new transaction
        const tx = await prisma.transaction.create({
          data: {
            id: createId(),
            invoiceNumber: inv,
            userId: customer.id,
            type: 'MEMBERSHIP', // Since these are membership imports
            amount: price,
            status: 'SUCCESS',
            paymentMethod: 'MANUAL',
            affiliateId: affiliate?.id || null,
            createdAt: new Date(createdAt),
            paidAt: new Date(createdAt),
            updatedAt: new Date(),
          }
        })
        results.transactionsCreated++

        // Create conversion for affiliate
        if (affiliate && price > 0) {
          const commission = Math.round(price * 0.30)
          await prisma.affiliateConversion.create({
            data: {
              id: createId(),
              affiliateId: affiliate.id,
              transactionId: tx.id,
              commissionAmount: commission,
              commissionRate: 30,
              paidOut: false,
            }
          })
          results.conversionsCreated++

          // Update affiliate earnings
          await prisma.affiliateProfile.update({
            where: { id: affiliate.id },
            data: {
              totalEarnings: { increment: commission },
              totalConversions: { increment: 1 },
            }
          })
        }

        // Create membership for customer if applicable
        if (membership) {
          const existingMembership = await prisma.userMembership.findFirst({
            where: {
              userId: customer.id,
              membershipId: membership.id,
            }
          })

          if (!existingMembership) {
            await prisma.userMembership.create({
              data: {
                id: createId(),
                userId: customer.id,
                membershipId: membership.id,
                status: 'ACTIVE',
                startDate: new Date(createdAt),
                endDate: membership.durationDays 
                  ? new Date(new Date(createdAt).getTime() + membership.durationDays * 24 * 60 * 60 * 1000)
                  : new Date(new Date(createdAt).getTime() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
                updatedAt: new Date(),
              }
            })
          }
        }

        results.processed++

      } catch (err: any) {
        results.errors.push(`Error processing row: ${err.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
