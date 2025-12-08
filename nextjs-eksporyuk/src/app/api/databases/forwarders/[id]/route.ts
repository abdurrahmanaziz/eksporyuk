import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forwarder = await prisma.forwarder.findUnique({
      where: { id: params.id },
      include: {
        addedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!forwarder) {
      return NextResponse.json(
        { error: 'Forwarder not found' },
        { status: 404 }
      )
    }

    // Track view
    if (session.user.role !== 'ADMIN') {
      const existingView = await prisma.forwarderView.findFirst({
        where: {
          userId: session.user.id,
          forwarderId: params.id,
          viewedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      if (!existingView) {
        await prisma.$transaction([
          prisma.forwarderView.create({
            data: {
              userId: session.user.id,
              forwarderId: params.id
            }
          }),
          prisma.forwarder.update({
            where: { id: params.id },
            data: { viewCount: { increment: 1 } }
          })
        ])
      }
    }

    return NextResponse.json(forwarder)
  } catch (error) {
    console.error('Error fetching forwarder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forwarder' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const forwarder = await prisma.forwarder.update({
      where: { id: params.id },
      data: body
    })

    return NextResponse.json(forwarder)
  } catch (error) {
    console.error('Error updating forwarder:', error)
    return NextResponse.json(
      { error: 'Failed to update forwarder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.forwarder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting forwarder:', error)
    return NextResponse.json(
      { error: 'Failed to delete forwarder' },
      { status: 500 }
    )
  }
}
