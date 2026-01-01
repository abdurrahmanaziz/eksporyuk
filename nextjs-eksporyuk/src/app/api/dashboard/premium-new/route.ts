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

    // Get user's groups
    const groupMembers = await prisma.groupMember.findMany({
      where: { userId },
      take: 5
    })

    const groupIds = groupMembers.map(gm => gm.groupId)

    // Get recommended groups (groups user hasn't joined)
    const recommendedGroups = await prisma.group.findMany({
      where: {
        id: { notIn: groupIds.length > 0 ? groupIds : ['no-groups'] },
        isActive: true
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })

    // Get member counts for groups
    const groupMemberCounts = await Promise.all(
      recommendedGroups.map(g => 
        prisma.groupMember.count({ where: { groupId: g.id } })
      )
    )

    const groupsData = recommendedGroups.map((g, i) => ({
      id: g.id,
      slug: g.slug || g.id,
      name: g.name,
      thumbnail: g.avatar || null,
      memberCount: groupMemberCounts[i] || 0
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

    // Get recent community posts using proper feed system
    console.log('[DASHBOARD] Fetching community feed posts...')
    
    // Get user's active memberships for community access
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: { membershipId: true }
    })
    const userMembershipIds = userMemberships.map(m => m.membershipId)

    // Get user's direct group memberships  
    const userGroupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    })
    const userGroupIds = userGroupMemberships.map(gm => gm.groupId)

    // Get groups accessible via membership
    const membershipGroupAccess = userMembershipIds.length > 0 ? await prisma.membershipGroup.findMany({
      where: { membershipId: { in: userMembershipIds } },
      select: { groupId: true }
    }) : []
    const membershipGroupIds = membershipGroupAccess.map(mg => mg.groupId)
    
    // Combined accessible groups
    const accessibleGroupIds = [...new Set([...userGroupIds, ...membershipGroupIds])]

    // Get community posts (public + user's groups + user's own posts)
    const communityPosts = await prisma.post.findMany({
      where: {
        approvalStatus: 'APPROVED',
        OR: [
          { groupId: null }, // Public posts
          { groupId: { in: accessibleGroupIds } }, // Group posts user has access to  
          { authorId: userId } // User's own posts
        ]
      },
      take: 5,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get post details (authors, groups, interaction counts)
    const postAuthorIds = communityPosts.map(p => p.authorId)
    const postGroupIds = communityPosts.filter(p => p.groupId).map(p => p.groupId!)
    
    const [postAuthors, postGroups, postLikes, postComments] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: postAuthorIds } },
        select: { id: true, name: true, avatar: true, role: true, province: true, city: true }
      }),
      postGroupIds.length > 0 ? prisma.group.findMany({
        where: { id: { in: postGroupIds } },
        select: { id: true, name: true, slug: true, avatar: true, type: true }
      }) : [],
      prisma.postLike.groupBy({
        by: ['postId'],
        where: { postId: { in: communityPosts.map(p => p.id) } },
        _count: { id: true }
      }),
      prisma.postComment.groupBy({
        by: ['postId'], 
        where: { postId: { in: communityPosts.map(p => p.id) } },
        _count: { id: true }
      })
    ])

    // Create lookup maps
    const authorMap = new Map(postAuthors.map(a => [a.id, a]))
    const groupMap = new Map(postGroups.map(g => [g.id, g]))
    const likesMap = new Map(postLikes.map(l => [l.postId, l._count.id]))
    const commentsMap = new Map(postComments.map(c => [c.postId, c._count.id]))

    const postsData = communityPosts.map(post => {
      const author = authorMap.get(post.authorId)
      const group = post.groupId ? groupMap.get(post.groupId) : null
      const hashtags = (post.content || '').match(/#\w+/g)?.map(tag => tag.slice(1)) || []
      
      return {
        id: post.id,
        content: post.content || '',
        author: {
          id: post.authorId,
          name: author?.name || 'Unknown',
          avatar: author?.avatar || null,
          role: author?.role || 'MEMBER_FREE',
          location: author ? `${author.city || ''}, ${author.province || ''}`.replace(/^, |, $/, '') : ''
        },
        group: group ? {
          id: group.id,
          name: group.name,
          slug: group.slug,
          avatar: group.avatar,
          type: group.type
        } : null,
        createdAt: post.createdAt.toISOString(),
        likesCount: likesMap.get(post.id) || 0,
        commentsCount: commentsMap.get(post.id) || 0,
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
