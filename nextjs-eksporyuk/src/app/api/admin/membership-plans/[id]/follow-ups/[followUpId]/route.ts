import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { AVAILABLE_SHORTCODES } from '../route'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch single follow-up
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const { followUpId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const followUp = await (prisma as any).membershipFollowUp.findUnique({
      where: { id: followUpId },
    })

    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }
    
    // Get membership name separately (manual lookup)
    const membership = followUp.membershipId
      ? await prisma.membership.findUnique({ where: { id: followUp.membershipId }, select: { name: true } })
      : null

    return NextResponse.json({ ...followUp, membership })
  } catch (error) {
    console.error('Error fetching follow-up:', error)
    return NextResponse.json({ error: 'Failed to fetch follow-up' }, { status: 500 })
  }
}

// PUT - Update follow-up
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const { followUpId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields - Fokus WhatsApp, email optional
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Judul follow-up wajib diisi' }, { status: 400 })
    }
    if (!body.whatsappMessage?.trim()) {
      return NextResponse.json({ error: 'Pesan WhatsApp wajib diisi' }, { status: 400 })
    }

    const followUp = await (prisma as any).membershipFollowUp.update({
      where: { id: followUpId },
      data: {
        title: body.title.trim(),
        description: body.description || null,
        // Email fields - use title/whatsapp as fallback for DB requirements
        emailSubject: body.emailSubject?.trim() || body.title.trim(),
        emailBody: body.emailBody?.trim() || body.whatsappMessage.trim(),
        emailCTA: body.emailCTA || null,
        emailCTALink: body.emailCTALink || null,
        whatsappMessage: body.whatsappMessage.trim(),
        shortcodes: AVAILABLE_SHORTCODES,
        sequenceOrder: body.sequenceOrder,
        isActive: body.isActive ?? true,
      }
    })

    return NextResponse.json(followUp)
  } catch (error: any) {
    console.error('Error updating follow-up:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Judul follow-up sudah ada untuk membership ini' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 })
  }
}

// DELETE - Delete follow-up
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const { followUpId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await (prisma as any).membershipFollowUp.delete({
      where: { id: followUpId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting follow-up:', error)
    return NextResponse.json({ error: 'Failed to delete follow-up' }, { status: 500 })
  }
}
