import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/users/[id] - Get user detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        isActive: true,
        isSuspended: true,
        suspendReason: true,
        suspendedAt: true,
        suspendedBy: true,
        isFounder: true,
        isCoFounder: true,
        affiliateMenuEnabled: true,
        createdAt: true,
        updatedAt: true,
        affiliateProfile: {
          select: {
            id: true,
            affiliateCode: true,
            tier: true,
            commissionRate: true,
            isActive: true,
            applicationStatus: true,
            totalEarnings: true,
            totalConversions: true,
          },
        },
        wallet: {
          select: {
            balance: true,
            totalEarnings: true,
            totalPayout: true,
          },
        },
        userRoles: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            courseEnrollments: true,
            userMemberships: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      name,
      email,
      phone,
      whatsapp,
      role,
      isActive,
      isFounder,
      isCoFounder,
      affiliateMenuEnabled,
    } = body

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Check if email is being changed
    const emailChanged = email && email !== currentUser.email

    // Check if new email is taken by another user
    if (emailChanged) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah digunakan user lain' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp || null }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(isFounder !== undefined && { isFounder }),
        ...(isCoFounder !== undefined && { isCoFounder }),
        ...(affiliateMenuEnabled !== undefined && { affiliateMenuEnabled }),
        // Reset email verification if email changed
        ...(emailChanged && { emailVerified: false }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        affiliateMenuEnabled: true,
      },
    })

    // Send verification email if email was changed
    if (emailChanged) {
      try {
        const { createVerificationToken, sendVerificationEmail } = await import('@/lib/email-verification')
        const token = await createVerificationToken(user.id, user.email)
        await sendVerificationEmail(user.email, token, user.name)
        console.log('✅ Verification email sent to new email:', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError)
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: emailChanged 
        ? 'User berhasil diupdate. Email verifikasi telah dikirim ke email baru.' 
        : 'User berhasil diupdate',
      user,
      emailChanged 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Tidak bisa menghapus akun sendiri' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
