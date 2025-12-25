import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/sales/follow-ups
 * Get all pending leads that need follow up with their follow-up templates
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const membershipId = searchParams.get('membershipId')
    const affiliateId = searchParams.get('affiliateId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      status: status,
      affiliateId: { not: null }, // Only leads from affiliates
    }

    if (membershipId) {
      where.membership = { membershipId }
    }

    if (affiliateId) {
      where.affiliateId = affiliateId
    }

    // Get pending transactions (leads)
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          membership: {
            include: {
              membership: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])

    // Get affiliate info for each transaction
    const affiliateIds = [...new Set(transactions.map(t => t.affiliateId).filter(Boolean))]
    const affiliates = affiliateIds.length > 0 
      ? await prisma.affiliateProfile.findMany({
          where: { id: { in: affiliateIds as string[] } },
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        })
      : []

    const affiliateMap = new Map(affiliates.map(a => [a.id, a]))

    // Get follow-up templates for each membership
    const membershipIds = [...new Set(
      transactions
        .map(t => t.membership?.membershipId)
        .filter(Boolean)
    )]

    let followUpTemplates: any[] = []
    try {
      followUpTemplates = await (prisma as any).membershipFollowUp.findMany({
        where: {
          membershipId: { in: membershipIds as string[] },
          isActive: true
        },
        orderBy: { sequenceOrder: 'asc' }
      })
    } catch (e) {
      // Model doesn't exist yet
    }

    const templatesByMembership = followUpTemplates.reduce((acc, t) => {
      if (!acc[t.membershipId]) acc[t.membershipId] = []
      acc[t.membershipId].push(t)
      return acc
    }, {} as Record<string, any[]>)

    // Format response
    const leads = transactions.map(t => {
      const membershipId = t.membership?.membershipId
      const daysSinceOrder = Math.floor(
        (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: t.id,
        customer: {
          name: t.customerName || t.user?.name || 'Unknown',
          email: t.customerEmail || t.user?.email || '',
          phone: t.customerPhone || t.user?.phone || '',
          whatsapp: t.customerWhatsapp || t.customerPhone || '',
        },
        membership: t.membership?.membership ? {
          id: t.membership.membership.id,
          name: t.membership.membership.name,
          price: Number(t.membership.membership.price),
        } : null,
        affiliate: t.affiliateId ? {
          id: t.affiliateId,
          name: affiliateMap.get(t.affiliateId)?.user?.name || 'Unknown',
          email: affiliateMap.get(t.affiliateId)?.user?.email || '',
        } : null,
        amount: Number(t.amount),
        status: t.status,
        paymentUrl: t.paymentUrl,
        orderDate: t.createdAt,
        daysSinceOrder,
        followUpTemplates: membershipId ? (templatesByMembership[membershipId] || []) : [],
      }
    })

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching follow-up leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
