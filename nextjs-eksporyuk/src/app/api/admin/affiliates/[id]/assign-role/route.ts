import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/affiliates/[id]/assign-role
 * Assigns AFFILIATE role to a user safely
 * 
 * Request body:
 * {
 *   userId: string  // The user ID to assign AFFILIATE role to
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   user?: {
 *     id: string
 *     name: string
 *     email: string
 *     role: string
 *     roles: Array<string>
 *   }
 *   error?: string
 * }
 */

interface AssignRoleBody {
  userId?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session and verify admin access
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body: AssignRoleBody = await request.json()
    const userId = body.userId || params.id

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          select: { role: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate affiliate profile exists for this user
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId }
    })

    if (!affiliateProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User must have an affiliate profile before assigning AFFILIATE role'
        },
        { status: 400 }
      )
    }

    // Validate affiliate is approved
    if (affiliateProfile.applicationStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot assign role to unapproved affiliate. Current status: ${affiliateProfile.applicationStatus}`
        },
        { status: 400 }
      )
    }

    // Check if user already has AFFILIATE role
    const existingRole = user.userRoles.find(r => r.role === 'AFFILIATE')

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'User already has AFFILIATE role' },
        { status: 400 }
      )
    }

    // Safely assign AFFILIATE role using upsert
    // This ensures no duplicates if somehow called twice
    const assignedRole = await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId,
          role: 'AFFILIATE'
        }
      },
      create: {
        userId,
        role: 'AFFILIATE'
      },
      update: {}
    })

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          select: { role: true }
        }
      }
    })

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated user data' },
        { status: 500 }
      )
    }

    // Extract all roles for response
    const userRoles = [updatedUser.role, ...updatedUser.userRoles.map(r => r.role)]
    const uniqueRoles = Array.from(new Set(userRoles))

    return NextResponse.json(
      {
        success: true,
        message: `AFFILIATE role successfully assigned to ${user.name}`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          roles: uniqueRoles
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign role'
      },
      { status: 500 }
    )
  }
}
