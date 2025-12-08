import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/admin/short-links/domains/[id]
 * Update domain
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { displayName, isDefault, isActive } = body

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.shortLinkDomain.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      })
    }

    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (isActive !== undefined) updateData.isActive = isActive

    const domain = await prisma.shortLinkDomain.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ domain })
  } catch (error) {
    console.error('Error updating domain:', error)
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/short-links/domains/[id]
 * Delete domain
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if domain has short links
    const linksCount = await prisma.affiliateShortLink.count({
      where: { domainId: id }
    })

    if (linksCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete domain with ${linksCount} active short links` },
        { status: 400 }
      )
    }

    await prisma.shortLinkDomain.delete({
      where: { id }
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
