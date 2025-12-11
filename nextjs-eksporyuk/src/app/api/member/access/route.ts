import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/member/access
 * Check what features/content the current user has access to based on their membership
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's active membership with all relations
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      },
      include: {
        membership: {
          include: {
            membershipCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    level: true,
                  }
                }
              }
            },
              membershipGroups: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    avatar: true,
                    type: true,
                    description: true,
                  }
                }
              }
            },
            membershipProducts: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    thumbnail: true,
                    price: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    // Get all available memberships for comparison
    const allMemberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        duration: true,
        price: true,
        features: true,
        _count: {
          select: {
            membershipCourses: true,
            membershipGroups: true,
            membershipProducts: true,
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    // Parse features for all memberships
    const membershipComparison = allMemberships.map(m => {
      let features: string[] = []
      try {
        if (typeof m.features === 'string') {
          features = JSON.parse(m.features)
        } else if (Array.isArray(m.features)) {
          features = m.features as string[]
        }
      } catch (e) {
        features = []
      }
      
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        duration: m.duration,
        price: Number(m.price),
        features: features,
        coursesCount: m._count.membershipCourses,
        groupsCount: m._count.membershipGroups,
        productsCount: m._count.membershipProducts,
      }
    })

    // If no active membership
    if (!userMembership) {
      return NextResponse.json({
        success: true,
        hasMembership: false,
        membership: null,
        access: {
          courses: [],
          groups: [],
          products: [],
          features: [],
        },
        locked: {
          courses: true,
          groups: true,
          products: true,
          documents: true,
          certificates: true,
          mentoring: true,
        },
        membershipComparison,
        upgradeUrl: '/checkout/pro',
      })
    }

    // Parse features from membership
    let membershipFeatures: string[] = []
    try {
      if (typeof userMembership.membership.features === 'string') {
        membershipFeatures = JSON.parse(userMembership.membership.features)
      } else if (Array.isArray(userMembership.membership.features)) {
        membershipFeatures = userMembership.membership.features as string[]
      }
    } catch (e) {
      membershipFeatures = []
    }

    // Extract accessible content
    const accessibleCourses = userMembership.membership.membershipCourses.map(mc => mc.course)
    const accessibleGroups = userMembership.membership.membershipGroups.map(mg => mg.group)
    const accessibleProducts = userMembership.membership.membershipProducts.map(mp => mp.product)

    // Determine locked features based on membership tier
    const duration = userMembership.membership.duration
    const isLifetime = duration === 'LIFETIME'
    const isYearly = duration === 'TWELVE_MONTHS' || duration === 'SIX_MONTHS'
    
    // Define feature access based on tier
    const locked = {
      courses: accessibleCourses.length === 0,
      groups: accessibleGroups.length === 0,
      products: accessibleProducts.length === 0,
      documents: !isLifetime && !isYearly,
      certificates: false, // All members can get certificates
      mentoring: !isLifetime,
      advancedAnalytics: !isLifetime && !isYearly,
      prioritySupport: !isLifetime,
      whatsappGroup: accessibleGroups.length === 0,
    }

    // Find next upgrade option
    const currentPrice = Number(userMembership.membership.price)
    const upgradeOptions = membershipComparison.filter(m => 
      Number(m.price) > currentPrice
    )

    return NextResponse.json({
      success: true,
      hasMembership: true,
      membership: {
        id: userMembership.id,
        name: userMembership.membership.name,
        slug: userMembership.membership.slug,
        duration: userMembership.membership.duration,
        startDate: userMembership.startDate,
        endDate: userMembership.endDate,
        isLifetime,
        daysRemaining: isLifetime ? null : Math.ceil(
          (new Date(userMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
      access: {
        courses: accessibleCourses,
        groups: accessibleGroups,
        products: accessibleProducts,
        features: membershipFeatures,
      },
      locked,
      membershipComparison,
      upgradeOptions,
      upgradeUrl: upgradeOptions.length > 0 
        ? `/checkout/${upgradeOptions[0].slug}` 
        : '/checkout/pro',
    })

  } catch (error) {
    console.error('Error checking member access:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
