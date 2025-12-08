import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/broadcast
 * Get all broadcast campaigns with filtering and pagination
 * ADMIN ONLY
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    
    // Get single campaign by ID
    if (id) {
      const campaign = await prisma.broadcastCampaign.findUnique({
        where: { id },
        include: {
          _count: {
            select: { logs: true }
          }
        }
      })
      
      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        campaigns: [campaign]
      })
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (type && type !== 'ALL') {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { emailSubject: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [campaigns, total] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          _count: {
            select: { logs: true }
          }
        }
      }),
      prisma.broadcastCampaign.count({ where })
    ])

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[BROADCAST_GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/broadcast
 * Create new broadcast campaign
 * ADMIN ONLY
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    const {
      name,
      type,
      status = 'DRAFT',
      templateId,
      templateType,
      targetType,
      targetRoles,
      targetMembershipIds,
      targetGroupIds,
      targetCourseIds,
      targetTransactionStatus,
      targetTransactionType,
      targetEventIds,
      customUserIds,
      emailSubject,
      emailBody,
      emailCtaText,
      emailCtaLink,
      whatsappMessage,
      whatsappCtaText,
      whatsappCtaLink,
      scheduledAt
    } = data

    // Validate required fields
    if (!name || !type || !targetType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type === 'EMAIL' && !emailSubject) {
      return NextResponse.json(
        { success: false, error: 'Email subject is required for email campaigns' },
        { status: 400 }
      )
    }

    if ((type === 'WHATSAPP' || type === 'BOTH') && !whatsappMessage) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp message is required for WhatsApp campaigns' },
        { status: 400 }
      )
    }

    const campaign = await prisma.broadcastCampaign.create({
      data: {
        name,
        type,
        status,
        templateId,
        templateType,
        targetType,
        targetRoles: targetRoles || null,
        targetMembershipIds: targetMembershipIds || null,
        targetGroupIds: targetGroupIds || null,
        targetCourseIds: targetCourseIds || null,
        targetTransactionStatus: targetTransactionStatus || null,
        targetTransactionType: targetTransactionType || null,
        targetEventIds: targetEventIds || null,
        customUserIds: customUserIds || null,
        emailSubject,
        emailBody,
        emailCtaText,
        emailCtaLink,
        whatsappMessage,
        whatsappCtaText,
        whatsappCtaLink,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      campaign
    })
  } catch (error: any) {
    console.error('[BROADCAST_POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/broadcast
 * Update existing broadcast campaign
 * ADMIN ONLY
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

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

/**
 * DELETE /api/admin/broadcast
 * Delete broadcast campaign
 * ADMIN ONLY
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

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
