import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/courses/[slug]/comments - Get comments for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
    }

    // Get course by slug or checkoutSlug
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { checkoutSlug: slug }
        ]
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get top-level comments (discussions) for this lesson
    const comments = await prisma.courseDiscussion.findMany({
      where: {
        courseId: course.id,
        lessonId: lessonId,
        parentId: null // Only top-level comments
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get replies for these comments
    const commentIds = comments.map(c => c.id)
    const replies = await prisma.courseDiscussion.findMany({
      where: {
        parentId: { in: commentIds }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get all user IDs
    const allUserIds = [...new Set([...comments.map(c => c.userId), ...replies.map(r => r.userId)])]
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, name: true, avatar: true }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Group replies by parentId
    const repliesByParentId = replies.reduce((acc, reply) => {
      if (!acc[reply.parentId!]) acc[reply.parentId!] = []
      acc[reply.parentId!].push(reply)
      return acc
    }, {} as Record<string, typeof replies>)

    // Transform to match frontend type
    const transformedComments = comments.map(comment => {
      const user = userMap.get(comment.userId)
      const commentReplies = repliesByParentId[comment.id] || []
      return {
        id: comment.id,
        lessonId: comment.lessonId,
        content: comment.content,
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || undefined
        },
        createdAt: comment.createdAt.toISOString(),
        replies: commentReplies.map(reply => {
          const replyUser = userMap.get(reply.userId)
          return {
            id: reply.id,
            content: reply.content,
            user: {
              name: replyUser?.name || 'Anonymous',
              avatar: replyUser?.avatar || undefined
            },
            createdAt: reply.createdAt.toISOString()
          }
        })
      }
    })

    return NextResponse.json({ comments: transformedComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/courses/[slug]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { lessonId, content, parentId } = body

    if (!lessonId || !content) {
      return NextResponse.json(
        { error: 'Lesson ID and content required' },
        { status: 400 }
      )
    }

    // Get course by slug or checkoutSlug
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { checkoutSlug: slug }
        ]
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify lesson exists
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Create comment (as CourseDiscussion)
    const comment = await prisma.courseDiscussion.create({
      data: {
        courseId: course.id,
        lessonId: lessonId,
        content: content,
        userId: session.user.id,
        parentId: parentId || null
      }
    })

    // Fetch user info separately (no relation in schema)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, avatar: true }
    })

    // Transform to match frontend type
    const transformedComment = {
      id: comment.id,
      lessonId: comment.lessonId,
      content: comment.content,
      user: {
        name: user?.name || 'Anonymous',
        avatar: user?.avatar || undefined
      },
      createdAt: comment.createdAt.toISOString()
    }

    return NextResponse.json({ comment: transformedComment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
