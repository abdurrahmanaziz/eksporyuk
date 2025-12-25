import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/affiliate/leads/[id]
 * Get single lead
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    const lead = await prisma.affiliateLead.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Manually fetch related data
    const [optinForm, tags] = await Promise.all([
      lead.optinFormId ? prisma.affiliateOptinForm.findUnique({ where: { id: lead.optinFormId } }) : null,
      prisma.affiliateLeadTag.findMany({ where: { leadId: lead.id } })
    ])

    return NextResponse.json({ lead: { ...lead, optinForm, tags } })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/affiliate/leads/[id]
 * Update lead
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

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
    const existing = await prisma.affiliateLead.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update lead
    const lead = await prisma.affiliateLead.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        status: body.status,
        notes: body.notes,
        lastContactedAt: body.status !== existing.status ? new Date() : existing.lastContactedAt
      }
    })

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate/leads/[id]
 * Delete lead
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
    const existing = await prisma.affiliateLead.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Delete lead
    await prisma.affiliateLead.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Lead deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
