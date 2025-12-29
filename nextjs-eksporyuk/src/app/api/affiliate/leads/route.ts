import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/leads
 * Get all leads for affiliate with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const exportCsv = searchParams.get('export') === 'csv'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      affiliateId: affiliateProfile.id
    }

    if (status) {
      where.status = status
    }

    if (source) {
      where.source = source
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { whatsapp: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { equals: tag, mode: 'insensitive' }
        }
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.affiliateLead.count({ where })

    // Get leads
    const leadsRaw = await prisma.affiliateLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Manually fetch optinForm names and tags for each lead
    const leads = await Promise.all(
      leadsRaw.map(async (lead: any) => {
        // Get optinForm name if exists
        let optinForm = null
        if (lead.optinFormId) {
          const form = await prisma.affiliateOptinForm.findUnique({
            where: { id: lead.optinFormId },
            select: { formName: true }
          })
          optinForm = form
        }

        // Get tags
        const tags = await (prisma as any).affiliateLeadTag.findMany({
          where: { leadId: lead.id },
          select: { id: true, tag: true }
        })

        return {
          ...lead,
          optinForm,
          tags
        }
      })
    )

    // Get stats
    const stats = await prisma.affiliateLead.groupBy({
      by: ['status'],
      where: { affiliateId: affiliateProfile.id },
      _count: true
    })

    const statusCounts: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      inactive: 0
    }
    stats.forEach((stat) => {
      statusCounts[stat.status] = stat._count
    })

    // Export CSV if requested
    if (exportCsv) {
      const csvHeaders = ['Name', 'Email', 'Phone', 'WhatsApp', 'Status', 'Source', 'Tags', 'Created At']
      const csvRows = leads.map(lead => [
        lead.name,
        lead.email || '',
        lead.phone || '',
        lead.whatsapp || '',
        lead.status,
        lead.source,
        lead.tags.map((t: any) => t.tag).join(', '),
        new Date(lead.createdAt).toLocaleDateString('id-ID')
      ])
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statusCounts
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate/leads
 * Create lead manually
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, whatsapp, status, source, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    const lead = await prisma.affiliateLead.create({
      data: {
        id: createId(),
        affiliateId: affiliateProfile.id,
        name,
        email,
        phone,
        whatsapp: whatsapp || phone,
        status: status || 'new',
        source: source || 'manual',
        notes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Lead created successfully',
      lead
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
