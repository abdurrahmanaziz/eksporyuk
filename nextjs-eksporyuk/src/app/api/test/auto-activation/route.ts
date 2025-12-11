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
      where: { slug: 'basic' },
      include: {
        membershipGroups: {
          include: { group: true }
        },
        membershipCourses: {
          include: { course: true }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({
        error: 'Basic membership not found! Run seed-sample-data.js first.'
      }, { status: 404 })
    }

    results.membership = {
      name: membership.name,
      expectedGroups: membership.membershipGroups.length,
      expectedCourses: membership.membershipCourses.length,
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
      where: { userId: testUser.id },
      include: { group: true }
    })

    results.verification.groups = {
      expected: membership.membershipGroups.length,
      actual: groupMemberships.length,
      list: groupMemberships.map(gm => ({
        name: gm.group.name,
        type: gm.group.type,
        role: gm.role
      }))
    }

    // Step 7: Check Course Access
    const courseAccess = await prisma.userCourseProgress.findMany({
      where: { userId: testUser.id },
      include: { course: true }
    })

    results.verification.courses = {
      expected: membership.membershipCourses.length,
      actual: courseAccess.length,
      list: courseAccess.map(ca => ({
        title: ca.course.title,
        hasAccess: ca.hasAccess,
        accessExpiresAt: ca.accessExpiresAt,
        progress: ca.progress
      }))
    }

    // Final Summary
    const groupsMatch = groupMemberships.length === membership.membershipGroups.length
    const coursesMatch = courseAccess.length === membership.membershipCourses.length
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
