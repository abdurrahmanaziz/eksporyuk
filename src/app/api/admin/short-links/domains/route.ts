import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/short-links/domains
 * Get all domains (admin only)
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/short-links/domains
 * Create new domain
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

    const { domain, displayName, isDefault, isActive } = await req.json()

    // Validate required fields
    if (!domain || !displayName) {
      return NextResponse.json(
        { error: 'Domain and display name are required' },
        { status: 400 }
      )
    }

    // Check if domain already exists
    const existingDomain = await prisma.shortLinkDomain.findUnique({
      where: { domain }
    })

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults
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
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ domain: newDomain })
  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    )
  }
}
