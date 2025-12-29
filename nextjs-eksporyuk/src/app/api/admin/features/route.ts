import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { FEATURE_DEFINITIONS } from '@/lib/features'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/features - List all available features and user permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get user's specific permissions
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId }
      })

      // Get user data separately
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true }
      })

      // Attach user data
      const permissionsWithUser = userPermissions.map(perm => ({
        ...perm,
        user
      }))

      return NextResponse.json({
        success: true,
        permissions: permissionsWithUser
      })
    }

    // Get all permissions
    const allPermissions = await prisma.userPermission.findMany({
      orderBy: { feature: 'asc' }
    })

    // Get unique user IDs and fetch user data
    const userIds = [...new Set(allPermissions.map(p => p.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Attach user data to permissions
    const permissionsWithUsers = allPermissions.map(perm => ({
      ...perm,
      user: userMap.get(perm.userId) || null
    }))

    // Group by feature
    const featureGroups = permissionsWithUsers.reduce((acc: any, perm) => {
      if (!acc[perm.feature]) {
        acc[perm.feature] = []
      }
      acc[perm.feature].push(perm)
      return acc
    }, {})

    // Available features list from definitions
    const availableFeatures = FEATURE_DEFINITIONS

    return NextResponse.json({
      success: true,
      features: availableFeatures,
      featureGroups,
      stats: {
        totalPermissions: allPermissions.length,
        uniqueFeatures: Object.keys(featureGroups).length,
        enabledPermissions: allPermissions.filter(p => p.enabled).length
      }
    })

  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/features - Create or update user permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, feature, enabled, value } = await request.json()

    if (!userId || !feature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert permission
    const permission = await prisma.userPermission.upsert({
      where: {
        userId_feature: { userId, feature }
      },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        value: value || null,
        updatedAt: new Date()
      },
      create: {
        userId,
        feature,
        enabled: enabled !== undefined ? enabled : true,
        value: value || null
      }
    })

    return NextResponse.json({
      success: true,
      permission: {
        ...permission,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    })

  } catch (error) {
    console.error('Error creating/updating permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/features - Remove user permission
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const feature = searchParams.get('feature')

    if (!userId || !feature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    await prisma.userPermission.delete({
      where: {
        userId_feature: { userId, feature }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Permission removed successfully'
    })

  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
