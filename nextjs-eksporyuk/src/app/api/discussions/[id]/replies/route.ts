import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/discussions/[id]/replies
 * Create a reply to a discussion thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body

    // Validation
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      )
    }

    // Get parent discussion
    const parentDiscussion = await prisma.courseDiscussion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            mentorId: true
          }
        }
      }
    })

    if (!parentDiscussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled (or is admin/mentor)
    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = parentDiscussion.course.mentorId === session.user.id
    
    if (!isAdmin && !isMentor) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: parentDiscussion.courseId
          }
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled to reply' },
          { status: 403 }
        )
      }
    }

    // Create reply
    const reply = await prisma.courseDiscussion.create({
      data: {
        courseId: parentDiscussion.courseId,
        userId: session.user.id,
        content: content.trim(),
        parentId: id,
        lessonId: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Notify parent discussion author (if not replying to self)
    if (parentDiscussion.userId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: parentDiscussion.userId,
            type: 'COMMENT_REPLY',
            title: 'New Reply to Your Discussion',
            message: `${session.user.name} replied to: "${parentDiscussion.title?.substring(0, 50)}..."`,
            link: `/learn/${parentDiscussion.course.slug}?tab=discussions&thread=${parentDiscussion.id}`
          }
        })
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
      }
    }

    // Notify mentor if not the one replying
    if (parentDiscussion.course.mentorId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: parentDiscussion.course.mentorId,
            type: 'COMMENT_REPLY',
            title: 'New Discussion Reply',
            message: `${session.user.name} replied in: "${parentDiscussion.title?.substring(0, 50)}..."`,
            link: `/learn/${parentDiscussion.course.slug}?tab=discussions&thread=${parentDiscussion.id}`
          }
        })
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
      }
    }

    return NextResponse.json(
      { 
        message: 'Reply posted successfully',
        reply 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
