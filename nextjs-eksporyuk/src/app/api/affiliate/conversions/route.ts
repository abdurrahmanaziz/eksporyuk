import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({
        conversions: [],
        total: 0,
        totalEarnings: 0,
        paidOut: 0,
        pending: 0,
      })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      affiliateId: affiliateProfile.id,
    }

    // Filter by status
    if (status === 'paid') {
      whereClause.paidOut = true
    } else if (status === 'pending') {
      whereClause.paidOut = false
    }

    // Search filter
    let transactionIds: string[] | undefined
    if (search) {
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { customerName: { contains: search } },
            { customerEmail: { contains: search } },
          ],
        },
        select: { id: true },
      })
      transactionIds = transactions.map(t => t.id)
      
      if (transactionIds.length > 0) {
        whereClause.transactionId = { in: transactionIds }
      } else {
        // No matching transactions, return empty
        return NextResponse.json({
          conversions: [],
          total: 0,
          totalEarnings: 0,
          paidOut: 0,
          pending: 0,
        })
      }
    }

    // Get total count
    const total = await prisma.affiliateConversion.count({
      where: whereClause,
    })

    // Get conversions with pagination (no relations in schema, use manual lookup)
    const rawConversions = await prisma.affiliateConversion.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })
    
    // Get transaction IDs and fetch transactions separately
    const txIds = rawConversions.map(c => c.transactionId).filter(Boolean)
    const transactions = await prisma.transaction.findMany({
      where: { id: { in: txIds } },
      select: {
        id: true,
        amount: true,
        customerName: true,
        customerEmail: true,
        status: true,
        productId: true,
        createdAt: true
      }
    })
    const txMap = new Map(transactions.map(t => [t.id, t]))
    
    // Get product IDs and fetch products separately
    const productIds = transactions.map(t => t.productId).filter(Boolean) as string[]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true
      }
    })
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Map conversions with transaction and product data
    const conversions = rawConversions.map(conv => {
      const tx = txMap.get(conv.transactionId)
      const product = tx?.productId ? productMap.get(tx.productId) : null
      return {
        ...conv,
        transaction: tx ? {
          ...tx,
          product: product ? { name: product.name } : null
        } : null
      }
    })

    // Calculate summary stats
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
      select: {
        commissionAmount: true,
        paidOut: true,
      },
    })

    const totalEarnings = allConversions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0
    )

    const paidOut = allConversions
      .filter(c => c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    const pending = allConversions
      .filter(c => !c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    return NextResponse.json({
      conversions,
      total,
      totalEarnings,
      paidOut,
      pending,
    })
  } catch (error) {
    console.error('Error fetching conversions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversions' },
      { status: 500 }
    )
  }
}
