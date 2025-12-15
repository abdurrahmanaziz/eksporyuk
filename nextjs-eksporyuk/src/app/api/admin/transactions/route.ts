import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { getCommissionBySejolProductId } from '@/lib/sejoli-commission'
import fs from 'fs'
import path from 'path'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Cache Sejoli data
let sejolisaData: any = null
function loadSejolisaData() {
  if (!sejolisaData) {
    const dataPath = path.join(process.cwd(), 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json')
    sejolisaData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  }
  return sejolisaData
}


// GET - Fetch all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: any = {}

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: end }
    }
    if (status) {
      where.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            memberCode: true,
          },
        },
        membership: {
          include: {
            membership: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
        coupon: {
          select: {
            code: true,
          },
        },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    name: true,
                    memberCode: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Load Sejoli data for affiliate & commission info
    const sejoli = loadSejolisaData()
    
    // Enrich transactions with real-time affiliate & commission data
    const enrichedTransactions = transactions.map(tx => {
      // Find corresponding Sejoli order
      const sejOrder = sejoli.orders.find((o: any) => o.id == tx.externalId)
      
      let affiliateInfo = null
      let commissionAmount = 0
      
      if (sejOrder && sejOrder.affiliate_id && sejOrder.status === 'completed') {
        // Find affiliate in Sejoli
        const sejAffiliate = sejoli.affiliates.find((a: any) => a.user_id == sejOrder.affiliate_id)
        
        if (sejAffiliate) {
          // Get commission based on product
          commissionAmount = getCommissionBySejolProductId(sejOrder.product_id)
          
          // Find affiliate user in DB to get wallet balance
          affiliateInfo = {
            email: sejAffiliate.user_email,
            name: sejAffiliate.display_name,
            commissionAmount: commissionAmount,
            productId: sejOrder.product_id
          }
        }
      }
      
      return {
        ...tx,
        affiliateInfo // Add real-time affiliate data
      }
    })

    return NextResponse.json({ transactions: enrichedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
