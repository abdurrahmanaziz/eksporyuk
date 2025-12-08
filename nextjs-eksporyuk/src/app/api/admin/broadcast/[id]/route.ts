import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/admin/broadcast/[id]
 * Delete broadcast campaign
 * ADMIN ONLY
 */
export async function DELETE(
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

    // Check if campaign exists
    const existingCampaign = await prisma.broadcastCampaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Prevent deleting campaigns that are currently sending
    if (existingCampaign.status === 'SENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete campaign that is currently sending' },
        { status: 400 }
      )
    }

    // Delete all logs first
    await prisma.broadcastLog.deleteMany({
      where: { campaignId: id }
    })

    // Delete campaign
    await prisma.broadcastCampaign.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error: any) {
    console.error('[BROADCAST_DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/broadcast/[id]
 * Update broadcast campaign
 * ADMIN ONLY
 */
export async function PUT(
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
    const updateData = await request.json()

    // Check if campaign exists
    const existingCampaign = await prisma.broadcastCampaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Prevent editing campaigns that are already sending or completed
    if (existingCampaign.status === 'SENDING' || existingCampaign.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit campaign that is already sending or completed' },
        { status: 400 }
      )
    }

    const campaign = await prisma.broadcastCampaign.update({
      where: { id },
      data: {
        ...updateData,
        scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      campaign
    })
  } catch (error: any) {
    console.error('[BROADCAST_PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
