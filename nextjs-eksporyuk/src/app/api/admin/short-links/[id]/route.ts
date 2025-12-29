import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * PATCH /api/admin/short-links/[id]
 * Update short link status
 */
export async function PATCH(
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
    const { isActive } = await req.json()

    const shortLink = await prisma.affiliateShortLink.update({
      where: { id },
      data: { isActive }
    })

    return NextResponse.json({ shortLink })
  } catch (error) {
    console.error('Error updating short link:', error)
    return NextResponse.json(
      { error: 'Failed to update short link' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/short-links/[id]
 * Delete short link
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

    await prisma.affiliateShortLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting short link:', error)
    return NextResponse.json(
      { error: 'Failed to delete short link' },
      { status: 500 }
    )
  }
}
