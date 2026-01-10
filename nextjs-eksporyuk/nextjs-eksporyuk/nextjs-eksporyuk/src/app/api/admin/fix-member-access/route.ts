import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/fix-member-access
 * Check how many members need fixing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count active memberships
    const activeMemberships = await prisma.userMembership.count({
      where: { status: 'ACTIVE', isActive: true }
    })

    // Count users without group access
    const usersWithGroups = await prisma.groupMember.groupBy({
      by: ['userId'],
      _count: true
    })
    const usersWithGroupAccess = usersWithGroups.length

    // Count users without course access
    const usersWithCourses = await prisma.courseEnrollment.groupBy({
      by: ['userId'],
      _count: true
    })
    const usersWithCourseAccess = usersWithCourses.length

    // Count total premium members
    const totalPremium = await prisma.user.count({
      where: { role: 'MEMBER_PREMIUM' }
    })

    return NextResponse.json({
      success: true,
      stats: {
        activeMemberships,
        totalPremiumMembers: totalPremium,
        usersWithGroupAccess,
        usersWithCourseAccess,
        estimatedMissingGroupAccess: totalPremium - usersWithGroupAccess,
        estimatedMissingCourseAccess: totalPremium - usersWithCourseAccess
      }
    })

  } catch (error) {
    console.error('Error checking member access:', error)
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 })
  }
}

/**
 * POST /api/admin/fix-member-access
 * Fix missing group and course access for all active members
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active memberships
    const activeMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE', isActive: true },
      select: { userId: true, membershipId: true }
    })

    let groupsAdded = 0
    let coursesAdded = 0
    let usersFixed = 0
    let errors = 0

    for (const um of activeMemberships) {
      let userFixed = false

      // Fix groups
      const membershipGroups = await prisma.membershipGroup.findMany({
        where: { membershipId: um.membershipId }
      })

      for (const mg of membershipGroups) {
        try {
          const existing = await prisma.groupMember.findFirst({
            where: { groupId: mg.groupId, userId: um.userId }
          })

          if (!existing) {
            await prisma.groupMember.create({
              data: {
                id: createId(),
                groupId: mg.groupId,
                userId: um.userId,
                role: 'MEMBER'
              }
            })
            groupsAdded++
            userFixed = true
          }
        } catch (err) {
          errors++
        }
      }

      // Fix courses
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId: um.membershipId }
      })

      for (const mc of membershipCourses) {
        try {
          const existing = await prisma.courseEnrollment.findFirst({
            where: { courseId: mc.courseId, userId: um.userId }
          })

          if (!existing) {
            await prisma.courseEnrollment.create({
              data: {
                id: createId(),
                courseId: mc.courseId,
                userId: um.userId,
                updatedAt: new Date()
              }
            })
            coursesAdded++
            userFixed = true
          }
        } catch (err) {
          errors++
        }
      }

      if (userFixed) usersFixed++
    }

    return NextResponse.json({
      success: true,
      results: {
        membershipsProcessed: activeMemberships.length,
        usersFixed,
        groupsAdded,
        coursesAdded,
        errors
      }
    })

  } catch (error) {
    console.error('Error fixing member access:', error)
    return NextResponse.json({ error: 'Failed to fix' }, { status: 500 })
  }
}
