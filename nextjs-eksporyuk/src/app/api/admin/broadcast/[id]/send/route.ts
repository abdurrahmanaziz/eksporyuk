import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/broadcast/[id]/send
 * Send broadcast campaign
 * ADMIN ONLY
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get campaign
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { id }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if campaign can be sent
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { success: false, error: 'Campaign already sent or is currently sending' },
        { status: 400 }
      )
    }

    // Update status to SENDING
    await prisma.broadcastCampaign.update({
      where: { id },
      data: { 
        status: 'SENDING',
        sentAt: new Date()
      }
    })

    // Trigger background processing (in production, use queue like Bull/BullMQ)
    // For now, we'll call the send API endpoint
    const sendUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/broadcast/send`
    
    // Fire and forget (don't wait for response)
    fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId: id })
    }).catch(err => {
      console.error('[BROADCAST_SEND] Background send error:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign is being sent in the background',
      campaign: {
        ...campaign,
        status: 'SENDING',
        sentAt: new Date()
      }
    })
  } catch (error: any) {
    console.error('[BROADCAST_SEND] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send campaign' },
      { status: 500 }
    )
  }
}
