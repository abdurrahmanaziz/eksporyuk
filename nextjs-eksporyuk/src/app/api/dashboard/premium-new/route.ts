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
    const now = new Date()
    
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        placement: 'DASHBOARD',
        startDate: { lte: now },
        endDate: { gte: now }
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

    // Get user's groups (groups they're a member of)
    const userGroupMembers = await prisma.groupMember.findMany({
      where: { userId },
      include: { group: true }
    })

    // Get public groups (not private or hidden)
    const publicGroups = await prisma.group.findMany({
      where: {
        isActive: true,
        type: 'PUBLIC' // Only show public groups
      },
      orderBy: { createdAt: 'desc' }
    })

    // Combine: user's own groups + public groups
    const userGroupIds = userGroupMembers.map(gm => gm.groupId)
    const userGroups = userGroupMembers.map(gm => gm.group).filter(g => g.isActive)
    
    // Public groups that user isn't already in
    const newPublicGroups = publicGroups.filter(g => !userGroupIds.includes(g.id))
    
    // Combine both lists: user's groups first, then new public groups (up to 5 total)
    const allGroupsToShow = [...userGroups, ...newPublicGroups].slice(0, 5)

    // Get member counts for groups
    const groupMemberCounts = await Promise.all(
      allGroupsToShow.map(g => 
        prisma.groupMember.count({ where: { groupId: g.id } })
      )
    )

    const groupsData = allGroupsToShow.map((g, i) => ({
      id: g.id,
      slug: g.slug || g.id,
      name: g.name,
      description: g.description || '',
      thumbnail: g.avatar || null,
      memberCount: groupMemberCounts[i] || 0,
      isUserMember: userGroupIds.includes(g.id) // Indicate if user is already a member
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

    // Get community posts using existing feed system
    console.log('[DASHBOARD] Fetching community posts...')
    
    let postsData: any[] = []
    
    // Use direct fetch to community feed endpoint to ensure consistency
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const feedResponse = await fetch(`${baseUrl}/api/community/feed?limit=5`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      })
      
      if (!feedResponse.ok) {
        throw new Error(`Feed API failed: ${feedResponse.status}`)
      }
      
      const feedData = await feedResponse.json()
      postsData = feedData.posts?.slice(0, 5).map((post: any) => ({
        id: post.id,
        content: post.content || '',
        author: {
          id: post.author?.id || post.authorId,
          name: post.author?.name || 'Unknown',
          avatar: post.author?.avatar || null,
          role: post.author?.role || 'MEMBER_FREE',
          location: post.author ? `${post.author.city || ''}, ${post.author.province || ''}`.replace(/^, |, $/, '') : ''
        },
        group: post.group || null,
        createdAt: post.createdAt,
        likesCount: post._count?.likes || 0,
        commentsCount: post._count?.comments || 0,
        hashtags: (post.content || '').match(/#\w+/g)?.map((tag: string) => tag.slice(1)) || []
      })) || []
      
      console.log('[DASHBOARD] Community posts loaded:', postsData.length)
      
    } catch (feedError) {
      console.error('[DASHBOARD] Feed fetch error:', feedError)
      // Fallback: Get recent approved posts directly
      const fallbackPosts = await prisma.post.findMany({
        where: { approvalStatus: 'APPROVED' },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      
      const postAuthorIds = fallbackPosts.map(p => p.authorId)
      const postAuthors = await prisma.user.findMany({
        where: { id: { in: postAuthorIds } },
        select: { id: true, name: true, avatar: true, role: true }
      })
      const authorMap = new Map(postAuthors.map(a => [a.id, a]))
      
      postsData = fallbackPosts.map(p => {
        const author = authorMap.get(p.authorId)
        return {
          id: p.id,
          content: p.content || '',
          author: {
            id: p.authorId,
            name: author?.name || 'Unknown',
            avatar: author?.avatar || null,
            role: author?.role || 'MEMBER_FREE',
            location: ''
          },
          group: null,
          createdAt: p.createdAt.toISOString(),
          likesCount: 0,
          commentsCount: 0,
          hashtags: (p.content || '').match(/#\w+/g)?.map(tag => tag.slice(1)) || []
        }
      })
    }

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
