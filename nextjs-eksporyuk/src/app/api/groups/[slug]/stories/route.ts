import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug]/stories - Get active stories (last 24 hours)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    // Get stories from last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    
    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug: slug },
      select: { id: true }
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const stories = await prisma.post.findMany({
      where: {
        groupId: group.id,
        type: 'STORY',
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
