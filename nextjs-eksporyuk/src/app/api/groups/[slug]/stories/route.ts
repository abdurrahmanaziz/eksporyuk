import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
    const group = await prisma.group.findFirst({
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get author info manually for each story (no relations in schema)
    const storiesWithAuthors = await Promise.all(stories.map(async (story) => {
      const author = await prisma.user.findUnique({
        where: { id: story.authorId },
        select: { id: true, name: true, email: true, avatar: true, role: true }
      })
      return { ...story, author }
    }))

    return NextResponse.json({ stories: storiesWithAuthors })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
