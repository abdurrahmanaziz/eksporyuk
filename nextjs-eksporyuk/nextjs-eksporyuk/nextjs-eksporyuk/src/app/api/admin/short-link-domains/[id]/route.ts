import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/short-link-domains/[id]
 * Get single domain
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { shortLinks: true }
        }
      }
    })
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ domain })
  } catch (error) {
    console.error('Error fetching domain:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/short-link-domains/[id]
 * Update domain
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      displayName,
      isActive,
      isDefault,
      isVerified,
      dnsType,
      dnsTarget,
      dnsInstructions
    } = body
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.shortLinkDomain.updateMany({
        where: {
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      })
    }
    
    const updated = await prisma.shortLinkDomain.update({
      where: { id: params.id },
      data: {
        displayName,
        isActive,
        isDefault,
        isVerified,
        dnsType,
        dnsTarget,
        dnsInstructions
      }
    })
    
    return NextResponse.json({ domain: updated })
  } catch (error) {
    console.error('Error updating domain:', error)
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/short-link-domains/[id]
 * Delete domain
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if domain has active links
    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { shortLinks: true }
        }
      }
    })
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    if (domain._count.shortLinks > 0) {
      return NextResponse.json(
        { error: `Cannot delete domain with ${domain._count.shortLinks} active links` },
        { status: 400 }
      )
    }
    
    await prisma.shortLinkDomain.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    )
  }
}
