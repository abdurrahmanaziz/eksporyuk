import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get active banners for DASHBOARD placement
    // For testing: also include upcoming banners (start date within next 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        placement: { in: ['DASHBOARD', 'HERO', 'ALL'] },
        OR: [
          // Currently active banners
          {
            startDate: { lte: now },
            endDate: { gte: now }
          },
          // Upcoming banners (within 7 days)
          {
            startDate: { lte: sevenDaysFromNow },
            endDate: { gte: now }
          }
        ]
      },
      orderBy: { priority: 'desc' },
      take: 5
    })

    // Get user enrollments and courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    // Get course details
    const courseIds = enrollments.map(e => e.courseId)
    const courses = await prisma.course.findMany({
      where: { 
        id: { in: courseIds },
        isPublished: true
      }
    })

    // Get modules for courses
    const modules = await prisma.courseModule.findMany({
      where: { courseId: { in: courseIds } }
    })

    // Group modules by course
    const modulesByCourse = modules.reduce((acc, m) => {
      if (!acc[m.courseId]) acc[m.courseId] = []
      acc[m.courseId].push(m)
      return acc
    }, {} as Record<string, typeof modules>)

    // Build course data
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const coursesWithProgress = enrollments
      .filter(e => courseMap.has(e.courseId))
      .map(enrollment => {
        const course = courseMap.get(enrollment.courseId)!
        const courseModules = modulesByCourse[enrollment.courseId] || []
        const totalModules = courseModules.length
        
        // Calculate current module based on progress
        const currentModule = Math.max(1, Math.ceil((enrollment.progress / 100) * totalModules))
        
        return {
          id: course.id,
          title: course.title,
          slug: course.slug || course.id,
          thumbnail: course.thumbnail,
          progress: enrollment.progress || 0,
          totalLessons: totalModules * 5, // Estimate
          completedLessons: Math.round((enrollment.progress / 100) * totalModules * 5),
          currentModule,
          totalModules: totalModules || 1
        }
      })

    // Get user's groups
    const groupMembers = await prisma.groupMember.findMany({
      where: { userId },
      take: 5
    })

    const groupIds = groupMembers.map(gm => gm.groupId)
    const userGroups = await prisma.group.findMany({
      where: { id: { in: groupIds } }
    })

    // Get recommended groups (groups user hasn't joined)
    const recommendedGroups = await prisma.group.findMany({
      where: {
        id: { notIn: groupIds },
        isActive: true
      },
      take: 3,
      orderBy: { memberCount: 'desc' }
    })

    const groupsData = recommendedGroups.map(g => ({
      id: g.id,
      slug: g.slug || g.id,
      name: g.name,
      thumbnail: g.thumbnail,
      memberCount: g.memberCount || 0
    }))

    // Get products
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        productStatus: 'PUBLISHED'
      },
      take: 2,
      orderBy: { createdAt: 'desc' }
    })

    const productsData = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      thumbnail: p.thumbnail,
      price: Number(p.price) || 0,
      rating: 4.5, // Default rating
      reviewCount: 0 // Default review count
    }))

    // Get recent community posts - limit to 5 for dashboard
    const recentPosts = await prisma.post.findMany({
      where: {
        approvalStatus: 'APPROVED'
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    // Get post authors
    const authorIds = recentPosts.map(p => p.authorId)
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, avatar: true, role: true }
    })
    const authorMap = new Map(authors.map(a => [a.id, a]))

    const postsData = recentPosts.map(p => {
      const author = authorMap.get(p.authorId)
      // Extract hashtags from content
      const hashtags = (p.content || '').match(/#\w+/g)?.map(tag => tag.slice(1)) || []
      return {
        id: p.id,
        content: p.content || '',
        author: {
          id: p.authorId,
          name: author?.name || 'Unknown',
          avatar: author?.avatar || null,
          role: author?.role || 'MEMBER_FREE'
        },
        createdAt: p.createdAt.toISOString(),
        likesCount: p.likesCount || 0,
        commentsCount: p.commentsCount || 0,
        tags: hashtags,
        images: p.images ? (Array.isArray(p.images) ? p.images : []) : []
      }
    })

    // Format banners data
    const bannersData = banners.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      linkText: b.linkText,
      backgroundColor: b.backgroundColor,
      textColor: b.textColor,
      buttonColor: b.buttonColor,
      buttonTextColor: b.buttonTextColor
    }))

    // Calculate stats
    const totalLessons = coursesWithProgress.reduce((sum, c) => sum + c.totalLessons, 0)
    const completedLessons = coursesWithProgress.reduce((sum, c) => sum + c.completedLessons, 0)

    return NextResponse.json({
      courses: coursesWithProgress,
      groups: groupsData,
      products: productsData,
      recentPosts: postsData,
      banners: bannersData,
      stats: {
        totalCourses: coursesWithProgress.length,
        completedCourses: coursesWithProgress.filter(c => c.progress === 100).length,
        totalLessons,
        completedLessons
      }
    })

  } catch (error) {
    console.error('Error fetching premium dashboard:', error)
    return NextResponse.json({
      courses: [],
      groups: [],
      products: [],
      recentPosts: [],
      banners: [],
      stats: {
        totalCourses: 0,
        completedCourses: 0,
        totalLessons: 0,
        completedLessons: 0
      }
    })
  }
}
