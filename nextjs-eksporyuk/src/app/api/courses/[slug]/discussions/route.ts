import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/courses/[slug]/discussions
 * Get all discussion threads for a course (course-level, not lesson-specific)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const showSolved = searchParams.get('solved') // 'true', 'false', or null (all)
    
    const skip = (page - 1) * limit

    // Get course
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      courseId: course.id,
      lessonId: null, // Course-level discussions only (no lesson-specific)
      parentId: null, // Top-level threads only
    }

    if (showSolved === 'true') {
      where.isMarkedSolved = true
    } else if (showSolved === 'false') {
      where.isMarkedSolved = false
    }

    // Get discussions with pagination
    const [discussions, total] = await Promise.all([
      prisma.courseDiscussion.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true
            }
          },
          replies: {
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
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: [
          { isMarkedSolved: 'asc' }, // Unsolved first
          { createdAt: 'desc' }
        ]
      }),
      prisma.courseDiscussion.count({ where })
    ])

    return NextResponse.json({
      discussions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      courseInfo: {
        id: course.id,
        title: course.title,
        mentorId: course.mentorId,
        mentorName: course.mentor.user.name
      }
    })
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses/[slug]/discussions
 * Create a new discussion thread (course-level)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { title, content } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user is enrolled (or is admin/mentor)
    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = course.mentorId === session.user.id
    
    if (!isAdmin && !isMentor) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id
          }
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled to create discussions' },
          { status: 403 }
        )
      }
    }

    // Create discussion thread
    const discussion = await prisma.courseDiscussion.create({
      data: {
        courseId: course.id,
        userId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        lessonId: null // Course-level discussion
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

    // Send notification to mentor
    try {
      await prisma.notification.create({
        data: {
          userId: course.mentorId,
          type: 'COURSE_DISCUSSION',
          title: 'New Discussion Thread',
          message: `${session.user.name} started a discussion: "${title.substring(0, 50)}..."`,
          link: `/learn/${course.slug}?tab=discussions&thread=${discussion.id}`
        }
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
      // Continue even if notification fails
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'DISCUSSION_CREATED',
          entity: 'DISCUSSION',
          entityId: discussion.id,
          metadata: {
            courseId: course.id,
            courseTitle: course.title,
            discussionTitle: title
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json(
      { 
        message: 'Discussion created successfully',
        discussion 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    )
  }
}
