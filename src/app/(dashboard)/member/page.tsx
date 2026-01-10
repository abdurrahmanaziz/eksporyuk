import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MemberDashboard from '@/components/dashboard/MemberDashboard';

async function getDashboardData(userId: string) {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Get active membership separately (no nested relation)
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: userId,
        isActive: true,
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'desc' },
      take: 1
    });
    
    // Get membership details if exists
    let activeMembership = null;
    if (userMemberships.length > 0) {
      const membership = await prisma.membership.findUnique({
        where: { id: userMemberships[0].membershipId }
      });
      activeMembership = { ...userMemberships[0], membership };
    }

    // Get course enrollments with progress (limit to 2 for "In Progress")
    const courseEnrollments = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.title,
        c.thumbnail,
        c.description,
        COUNT(DISTINCT l.id) as totalLessons,
        COUNT(DISTINCT lp.id) as completedLessons,
        MAX(lp."updatedAt") as lastActivity
      FROM "Course" c
      LEFT JOIN "Lesson" l ON l."courseId" = c.id
      LEFT JOIN "LessonProgress" lp ON lp."lessonId" = l.id AND lp."userId" = ${userId} AND lp.completed = true
      WHERE EXISTS (
        SELECT 1 FROM "CourseEnrollment" ce 
        WHERE ce."courseId" = c.id AND ce."userId" = ${userId} AND ce."isActive" = true
      )
      GROUP BY c.id, c.title, c.thumbnail, c.description
      HAVING COUNT(DISTINCT lp.id) > 0 AND COUNT(DISTINCT lp.id) < COUNT(DISTINCT l.id)
      ORDER BY MAX(lp."updatedAt") DESC
      LIMIT 2
    ` as any[];

    // Get groups user is member of (limit to 3)
    const groups = await prisma.$queryRaw`
      SELECT 
        g.id,
        g.name,
        g."coverImage",
        COUNT(DISTINCT gm.id) as memberCount,
        COUNT(DISTINCT p.id) FILTER (WHERE p."createdAt" > NOW() - INTERVAL '7 days') as newPostsCount
      FROM "Group" g
      INNER JOIN "GroupMember" gm ON gm."groupId" = g.id
      LEFT JOIN "Post" p ON p."groupId" = g.id
      WHERE gm."userId" = ${userId}
      GROUP BY g.id, g.name, g."coverImage"
      ORDER BY COUNT(DISTINCT p.id) FILTER (WHERE p."createdAt" > NOW() - INTERVAL '7 days') DESC
      LIMIT 3
    ` as any[];

    // Get recent posts from groups user is in (limit to 2)
    const recentPosts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.content,
        p."createdAt",
        p."likesCount",
        p."commentsCount",
        u.name as authorName,
        u.avatar as authorAvatar,
        g.name as groupName
      FROM "Post" p
      INNER JOIN "User" u ON u.id = p."authorId"
      LEFT JOIN "Group" g ON g.id = p."groupId"
      WHERE p."groupId" IN (
        SELECT "groupId" FROM "GroupMember" WHERE "userId" = ${userId}
      )
      AND p."approvalStatus" = 'APPROVED'
      ORDER BY p."createdAt" DESC
      LIMIT 2
    ` as any[];

    // Get upcoming events (limit to 3)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        isPublished: true
      },
      orderBy: { startDate: 'asc' },
      take: 3,
      select: {
        id: true,
        title: true,
        startDate: true,
        type: true,
        location: true,
        meetingUrl: true
      }
    });

    // Get recommended products (limit to 2)
    const recommendedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        productStatus: 'PUBLISHED',
        isFeatured: true
      },
      orderBy: { soldCount: 'desc' },
      take: 2,
      select: {
        id: true,
        name: true,
        price: true,
        thumbnail: true,
        category: true,
        slug: true
      }
    });

    // Get active banners (if Banner model exists)
    let banners: any[] = [];
    try {
      if (prisma.banner) {
        banners = await prisma.banner.findMany({
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          },
          orderBy: { priority: 'desc' },
          take: 3
        });
      }
    } catch (error) {
      // Banner model doesn't exist, that's ok
      console.log('Banner model not found');
    }

    return {
      user,
      activeMembership,
      courses: courseEnrollments.map(c => ({
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail,
        category: c.description ? 'Pelatihan' : 'Kursus',
        currentLesson: Number(c.completedLessons) + 1,
        totalLessons: Number(c.totalLessons),
        progress: Math.round((Number(c.completedLessons) / Number(c.totalLessons)) * 100)
      })),
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        coverImage: g.coverImage,
        memberCount: Number(g.membercount),
        newPostsCount: Number(g.newpostscount)
      })),
      posts: recentPosts.map(p => ({
        id: p.id,
        content: p.content,
        authorName: p.authorname,
        authorAvatar: p.authoravatar,
        groupName: p.groupname,
        createdAt: p.createdAt,
        likesCount: Number(p.likescount),
        commentsCount: Number(p.commentscount)
      })),
      events: upcomingEvents,
      products: recommendedProducts,
      banners
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      user: null,
      activeMembership: null,
      courses: [],
      groups: [],
      posts: [],
      events: [],
      products: [],
      banners: []
    };
  }
}

export default async function MemberPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getDashboardData(session.user.id);

  return <MemberDashboard data={data} user={session.user} />;
}
