import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // For admin users, return empty access (they don't need membership)
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        hasMembership: false,
        isAdmin: true,
        membership: null,
        access: {
          courses: [],
          groups: [],
          products: [],
          features: [],
        },
        locked: {},
        membershipComparison: [],
        upgradeUrl: null,
      })
    }

    // Get user's active membership with all relations
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      }
    })

    // Fetch membership separately
    let membership = null
    if (userMembership) {
      membership = await prisma.membership.findUnique({
        where: { id: userMembership.membershipId },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          features: true,
        }
      })
    }

    // If user has membership, fetch junction table data separately
    let membershipWithRelations = null
    if (userMembership && membership) {
      const membershipId = membership.id
      
      // Fetch courses
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId }
      })
      
      // Fetch course details
      const courseIds = membershipCourses.map(mc => mc.courseId)
      const courses = courseIds.length > 0 ? await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          level: true,
        }
      }) : []
      const courseMap = new Map(courses.map(c => [c.id, c]))
      const membershipCoursesWithData = membershipCourses.map(mc => ({
        ...mc,
        course: courseMap.get(mc.courseId)
      }))

      // Fetch groups
      const membershipGroups = await prisma.membershipGroup.findMany({
        where: { membershipId }
      })
      
      // Fetch group details
      const groupIds = membershipGroups.map(mg => mg.groupId)
      const groups = groupIds.length > 0 ? await prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          type: true,
          description: true,
        }
      }) : []
      const groupMap = new Map(groups.map(g => [g.id, g]))
      const membershipGroupsWithData = membershipGroups.map(mg => ({
        ...mg,
        group: groupMap.get(mg.groupId)
      }))

      // Fetch products
      const membershipProducts = await prisma.membershipProduct.findMany({
        where: { membershipId }
      })
      
      // Fetch product details
      const productIds = membershipProducts.map(mp => mp.productId)
      const products = productIds.length > 0 ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          thumbnail: true,
          price: true,
        }
      }) : []
      const productMap = new Map(products.map(p => [p.id, p]))
      const membershipProductsWithData = membershipProducts.map(mp => ({
        ...mp,
        product: productMap.get(mp.productId)
      }))

      membershipWithRelations = {
        ...membership,
        membershipCourses: membershipCoursesWithData,
        membershipGroups: membershipGroupsWithData,
        membershipProducts: membershipProductsWithData
      }
    }

    // Get all available memberships for comparison (raw to avoid enum decode issues)
    const allMembershipsRaw: any[] = await prisma.$queryRaw`SELECT id, name, slug, duration, price, features, isActive FROM Membership ORDER BY price ASC`
    const allMemberships = allMembershipsRaw.filter((m: any) => m.isActive)

    // Parse features for all memberships
    const membershipComparison = allMemberships.map((m: any) => {
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
        coursesCount: 0,
        groupsCount: 0,
        productsCount: 0,
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

    // Parse features from membership (flat array format)
    let membershipFeatures: string[] = []
    try {
      let featuresData = membershipWithRelations?.features
      
      if (typeof featuresData === 'string') {
        featuresData = JSON.parse(featuresData)
      }
      
      if (Array.isArray(featuresData)) {
        membershipFeatures = featuresData as string[]
      }
    } catch (e) {
      membershipFeatures = []
    }

    // Extract accessible content
    const accessibleCourses = membershipWithRelations?.membershipCourses?.map((mc: any) => mc.course) || []
    const accessibleGroups = membershipWithRelations?.membershipGroups?.map((mg: any) => mg.group) || []
    const accessibleProducts = membershipWithRelations?.membershipProducts?.map((mp: any) => mp.product) || []

    // Determine locked features based on membership tier
    // Safely fetch membership duration via raw SQL to avoid enum decode issues
    let duration: string | null = null
    try {
      const durationRow: any[] = await prisma.$queryRaw`SELECT duration FROM Membership WHERE id = ${membershipWithRelations?.id} LIMIT 1`
      duration = (durationRow?.[0]?.duration as string) || null
    } catch (_) {
      duration = null
    }
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
    const currentPrice = membershipWithRelations ? Number(membershipWithRelations.price) : 0
    const upgradeOptions = membershipComparison.filter(m => 
      Number(m.price) > currentPrice
    )

    return NextResponse.json({
      success: true,
      hasMembership: true,
      membership: {
        id: userMembership!.id,
        name: membershipWithRelations?.name,
        slug: membershipWithRelations?.slug,
        duration: duration,
        startDate: userMembership!.startDate,
        endDate: userMembership!.endDate,
        isLifetime,
        daysRemaining: isLifetime ? null : Math.ceil(
          (new Date(userMembership!.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
