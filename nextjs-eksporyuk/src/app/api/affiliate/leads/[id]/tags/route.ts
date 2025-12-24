import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/affiliate/leads/[id]/tags
 * Add tag to lead
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { tag } = body

    if (!tag || tag.trim().length === 0) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Check ownership
    const lead = await prisma.affiliateLead.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Add tag (ignore if already exists)
    try {
      const leadTag = await prisma.affiliateLeadTag.create({
        data: {
          leadId: id,
          tag: tag.trim().toLowerCase()
        }
      })

      return NextResponse.json({
        message: 'Tag added successfully',
        tag: leadTag
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Tag already exists' }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error adding tag:', error)
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate/leads/[id]/tags
 * Remove tag from lead
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params
    const body = await req.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Check ownership
    const lead = await prisma.affiliateLead.findFirst({
      where: {
        id: leadId,
        affiliateId: affiliateProfile.id
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Delete tag
    await prisma.affiliateLeadTag.delete({
      where: { id: tagId }
    })

    return NextResponse.json({
      message: 'Tag removed successfully'
    })
  } catch (error) {
    console.error('Error removing tag:', error)
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    )
  }
}
