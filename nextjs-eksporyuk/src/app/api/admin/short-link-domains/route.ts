import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/short-link-domains
 * Get all short link domains
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const domains = await prisma.shortLinkDomain.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get short link counts manually since no relation exists
    const domainIds = domains.map(d => d.id)
    const shortLinkCounts = await prisma.affiliateShortLink.groupBy({
      by: ['domainId'],
      where: { domainId: { in: domainIds } },
      _count: true
    })
    
    const countMap = new Map(shortLinkCounts.map(s => [s.domainId, s._count]))
    
    const domainsWithCounts = domains.map(d => ({
      ...d,
      _count: { shortLinks: countMap.get(d.id) || 0 }
    }))
    
    return NextResponse.json({ domains: domainsWithCounts })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/short-link-domains
 * Create new short link domain
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const {
      domain,
      displayName,
      isActive = true,
      isDefault = false,
      dnsType,
      dnsTarget,
      dnsInstructions
    } = body
    
    // Validate required fields
    if (!domain || !displayName) {
      return NextResponse.json(
        { error: 'Domain and display name are required' },
        { status: 400 }
      )
    }
    
    // Check if domain already exists
    const existing = await prisma.shortLinkDomain.findUnique({
      where: { domain }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      )
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.shortLinkDomain.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }
    
    const newDomain = await prisma.shortLinkDomain.create({
      data: {
        domain,
        displayName,
        isActive,
        isDefault,
        dnsType,
        dnsTarget,
        dnsInstructions
      }
    })
    
    return NextResponse.json({ domain: newDomain }, { status: 201 })
  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    )
  }
}
