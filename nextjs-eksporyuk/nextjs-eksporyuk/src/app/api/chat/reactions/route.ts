import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, emoji } = await req.json()

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Missing messageId or emoji' }, { status: 400 })
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    })

    if (existingReaction) {
      return NextResponse.json({ error: 'Reaction already exists' }, { status: 400 })
    }

    // Create reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji
      }
    })

    return NextResponse.json({ success: true, reaction })

  } catch (error) {
    console.error('Reaction creation error:', error)
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, emoji } = await req.json()

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Missing messageId or emoji' }, { status: 400 })
    }

    // Delete reaction
    await prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Reaction deletion error:', error)
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
  }
}