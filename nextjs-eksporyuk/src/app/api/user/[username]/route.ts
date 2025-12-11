import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/user/[username] - Get public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const session = await getServerSession(authOptions)

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        role: true,
        province: true,
        city: true,
        locationVerified: true,
        createdAt: true,
        isOnline: true,
        lastSeenAt: true,
        isFounder: true,
        isCoFounder: true,
        // Stats
        _count: {
          select: {
            posts: true,
            following: true,
            followers: true,
            groupMemberships: true,
            courseEnrollments: true,
          }
        },
        // Group memberships
        groupMemberships: {
          select: {
            role: true,
            joinedAt: true,
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
                type: true,
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        },
        // Role-specific profiles
        supplierProfile: {
          select: {
            companyName: true,
            logo: true,
            banner: true,
            businessCategory: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        },
        affiliateProfile: {
          select: {
            affiliateCode: true,
            tier: true,
            totalEarnings: true,
            totalConversions: true,
          }
        },
        mentorProfile: {
          select: {
            expertise: true,
            bio: true,
            rating: true,
            totalStudents: true,
            totalCourses: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if viewing own profile
    const isOwnProfile = session?.user?.email ? 
      (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id === user.id 
      : false

    // Check if following
    const isFollowing = session?.user?.email ? await prisma.follow.findFirst({
      where: {
        follower: { email: session.user.email },
        followingId: user.id
      }
    }) !== null : false

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        OR: [
          { group: null }, // Global posts
          { group: { type: 'PUBLIC' } }, // Public group posts
        ]
      },
      take: 10,
      orderBy: [
        { isPinned: 'desc' }, // Pinned posts first
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        content: true,
        images: true,
        isPinned: true,
        commentsEnabled: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          }
        },
        group: {
          select: {
            name: true,
            slug: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      }
    })

    // Role-specific data
    let roleData: any = {}
    
    // Note: SUPPLIER role doesn't exist in current schema, skip product loading
    // Products are linked to users directly via creatorId
    
    if (user.role === 'AFFILIATE' && user.affiliateProfile) {
      // Only show to profile owner
      if (isOwnProfile) {
        const topLinks = await prisma.affiliateLink.findMany({
          where: { userId: user.id },
          take: 5,
          orderBy: { conversions: 'desc' },
          select: {
            id: true,
            fullUrl: true,
            shortCode: true,
            clicks: true,
            conversions: true,
            createdAt: true,
          }
        })
        roleData = { topLinks }
      }
    }

    if (user.role === 'MENTOR' && user.mentorProfile) {
      const courses = await prisma.course.findMany({
        where: {
          mentorId: user.mentorProfile.id,
          isPublished: true,
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
          monetizationType: true,
          enrollmentCount: true,
        }
      })
      roleData = { courses }
    }

    return NextResponse.json({
      user: {
        ...user,
        isOwnProfile,
        isFollowing,
      },
      posts: recentPosts,
      roleData,
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
