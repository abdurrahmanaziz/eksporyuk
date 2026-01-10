import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/utils'


export const dynamic = 'force-dynamic';
// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    // Get user (no relations in schema)
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        isOnline: true,
        lastSeenAt: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Manual lookups (schema has no relations)
    const wallet = await prisma.wallet.findUnique({
      where: { userId: id },
    })

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: id },
    })

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: id },
    })

    const followerCount = await prisma.follow.count({ where: { followingId: id } })
    const followingCount = await prisma.follow.count({ where: { followerId: id } })
    const postCount = await prisma.post.count({ where: { authorId: id } })

    const userWithDetails = {
      ...user,
      wallet,
      affiliateProfile,
      mentorProfile,
      _count: {
        followers: followerCount,
        following: followingCount,
        posts: postCount,
      },
    }

    // Hide sensitive data for non-admin users
    if (currentUser.id !== id && !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(currentUser.role)) {
      const { wallet: _, ...publicUser } = userWithDetails
      return NextResponse.json(publicUser)
    }

    return NextResponse.json(userWithDetails)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    // Only allow users to update their own profile or admins
    if (currentUser.id !== id && !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, username, bio, phone, avatar, emailNotifications, whatsappNotifications } = body

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(whatsappNotifications !== undefined && { whatsappNotifications }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        phone: true,
        emailNotifications: true,
        whatsappNotifications: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
