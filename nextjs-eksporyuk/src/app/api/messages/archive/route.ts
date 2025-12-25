import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/messages/archive - Archive a conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { partnerId } = await request.json()
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 })
    }

    // Check if already archived
    const existing = await prisma.archivedConversation.findUnique({
      where: {
        userId_partnerId: {
          userId: session.user.id,
          partnerId: partnerId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already archived' 
      })
    }

    // Archive the conversation
    const archived = await prisma.archivedConversation.create({
      data: {
        userId: session.user.id,
        partnerId: partnerId,
      },
    })

    return NextResponse.json({
      success: true,
      archived,
    })
  } catch (error) {
    console.error('Error archiving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/messages/archive - Unarchive a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 })
    }

    // Delete the archived conversation record
    await prisma.archivedConversation.deleteMany({
      where: {
        userId: session.user.id,
        partnerId: partnerId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation unarchived',
    })
  } catch (error) {
    console.error('Error unarchiving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to unarchive conversation' },
      { status: 500 }
    )
  }
}
