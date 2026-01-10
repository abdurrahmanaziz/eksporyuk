import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activateMembership } from '@/lib/membership-helper'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic';
// GET /api/test/auto-activation - Test the auto-activation flow
export async function GET(request: NextRequest) {
  // Block in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'This endpoint is disabled in production' 
    }, { status: 403 })
  }

  try {
    const results: any = {
      status: 'running',
      steps: [],
      summary: {},
    }

    // Step 1: Get or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'testuser@example.com' }
    })

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123', 10)
      testUser = await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'USER',
          emailVerified: true,
        }
      })
      results.steps.push({ step: 'create_user', status: 'success', message: 'Test user created' })
    } else {
      results.steps.push({ step: 'get_user', status: 'success', message: 'Test user found' })
    }

    // Step 2: Get Basic Membership
    const membership = await prisma.membership.findFirst({
      where: { slug: 'basic' }
    })

    if (!membership) {
      return NextResponse.json({
        error: 'Basic membership not found! Run seed-sample-data.js first.'
      }, { status: 404 })
    }

    // Fetch related data separately
    const [membershipGroups, membershipCourses] = await Promise.all([
      prisma.membershipGroup.findMany({
        where: { membershipId: membership.id }
      }),
      prisma.membershipCourse.findMany({
        where: { membershipId: membership.id }
      })
    ])

    // Fetch groups and courses details
    const groupIds = membershipGroups.map(mg => mg.groupId)
    const courseIds = membershipCourses.map(mc => mc.courseId)

    const [groups, courses] = await Promise.all([
      groupIds.length > 0 ? prisma.group.findMany({
        where: { id: { in: groupIds } }
      }) : [],
      courseIds.length > 0 ? prisma.course.findMany({
        where: { id: { in: courseIds } }
      }) : []
    ])

    // Create maps for lookups
    const groupMap = new Map(groups.map(g => [g.id, g]))
    const courseMap = new Map(courses.map(c => [c.id, c]))

    // Enrich membership data
    const membershipGroupsWithData = membershipGroups.map(mg => ({
      ...mg,
      group: groupMap.get(mg.groupId)
    }))
    const membershipCoursesWithData = membershipCourses.map(mc => ({
      ...mc,
      course: courseMap.get(mc.courseId)
    }))

    results.membership = {
      name: membership.name,
      expectedGroups: membershipGroupsWithData.length,
      expectedCourses: membershipCoursesWithData.length,
    }

    // Step 3: Clear existing active memberships
    await prisma.userMembership.updateMany({
      where: {
        userId: testUser.id,
        isActive: true
      },
      data: {
        isActive: false,
        expiresAt: new Date()
      }
    })
    results.steps.push({ step: 'clear_memberships', status: 'success', message: 'Cleared existing memberships' })

    // Step 4: Activate membership
    const activatedMembership = await activateMembership(
      testUser.id,
      membership.id,
      null,
      null
    )
    results.steps.push({ step: 'activate_membership', status: 'success', membershipId: activatedMembership.id })

    // Step 5: Verify UserMembership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: testUser.id,
        membershipId: membership.id,
        isActive: true
      }
    })

    results.verification = {
      userMembership: userMembership ? {
        found: true,
        expiresAt: userMembership.expiresAt,
      } : { found: false }
    }

    // Step 6: Check Group Memberships
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: testUser.id }
    })

    // Fetch group details for memberships
    const gmGroupIds = groupMemberships.map(gm => gm.groupId)
    const gmGroups = gmGroupIds.length > 0 ? await prisma.group.findMany({
      where: { id: { in: gmGroupIds } }
    }) : []
    const gmGroupMap = new Map(gmGroups.map(g => [g.id, g]))

    results.verification.groups = {
      expected: membershipGroupsWithData.length,
      actual: groupMemberships.length,
      list: groupMemberships.map(gm => {
        const group = gmGroupMap.get(gm.groupId)
        return {
          name: group?.name,
          type: group?.type,
          role: gm.role
        }
      })
    }

    // Step 7: Check Course Access
    const courseAccess = await prisma.userCourseProgress.findMany({
      where: { userId: testUser.id }
    })

    // Fetch course details for access records
    const caCourseIds = courseAccess.map(ca => ca.courseId)
    const caCourses = caCourseIds.length > 0 ? await prisma.course.findMany({
      where: { id: { in: caCourseIds } }
    }) : []
    const caCourseMap = new Map(caCourses.map(c => [c.id, c]))

    results.verification.courses = {
      expected: membershipCoursesWithData.length,
      actual: courseAccess.length,
      list: courseAccess.map(ca => {
        const course = caCourseMap.get(ca.courseId)
        return {
          title: course?.title,
          hasAccess: ca.hasAccess,
          accessExpiresAt: ca.accessExpiresAt,
          progress: ca.progress
        }
      })
    }

    // Final Summary
    const groupsMatch = groupMemberships.length === membershipGroupsWithData.length
    const coursesMatch = courseAccess.length === membershipCoursesWithData.length
    const membershipActive = !!userMembership

    results.summary = {
      testPassed: groupsMatch && coursesMatch && membershipActive,
      checks: {
        membershipActive,
        groupsMatch,
        coursesMatch,
      },
      testUser: {
        email: 'testuser@example.com',
        password: 'test123',
        message: 'You can login with these credentials to verify access'
      }
    }

    results.status = results.summary.testPassed ? 'PASSED ✅' : 'FAILED ❌'

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      status: 'FAILED ❌',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
