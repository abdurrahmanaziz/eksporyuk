import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // Get comments (discussions) for this lesson
    const comments = await prisma.courseDiscussion.findMany({
      where: {
        courseId: course.id,
        lessonId: lessonId,
        parentId: null // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match frontend type
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      lessonId: comment.lessonId,
      content: comment.content,
      user: {
        name: comment.user.name || 'Anonymous',
        avatar: comment.user.avatar || undefined
      },
      createdAt: comment.createdAt.toISOString(),
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        user: {
          name: reply.user.name || 'Anonymous',
          avatar: reply.user.avatar || undefined
        },
        createdAt: reply.createdAt.toISOString()
      }))
    }))

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
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Transform to match frontend type
    const transformedComment = {
      id: comment.id,
      lessonId: comment.lessonId,
      content: comment.content,
      user: {
        name: comment.user.name || 'Anonymous',
        avatar: comment.user.avatar || undefined
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
