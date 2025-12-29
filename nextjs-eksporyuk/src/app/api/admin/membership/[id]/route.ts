import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH - Update membership status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, isActive, autoRenew } = body

    // Validate status
    const validStatuses = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if membership exists
    const existingMembership = await prisma.userMembership.findUnique({
      where: { id }
    })

    if (!existingMembership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Update membership
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
      if (status === 'ACTIVE') {
        updateData.activatedAt = new Date()
        updateData.isActive = true
      } else if (status === 'EXPIRED' || status === 'CANCELLED') {
        updateData.isActive = false
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (autoRenew !== undefined) {
      updateData.autoRenew = autoRenew
    }

    updateData.updatedAt = new Date()

    const updatedMembership = await prisma.userMembership.update({
      where: { id },
      data: updateData
    })

    // Fetch related data manually
    const [user, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: updatedMembership.userId },
        select: { id: true, name: true, email: true }
      }),
      prisma.membership.findUnique({
        where: { id: updatedMembership.membershipId },
        select: { id: true, name: true, duration: true }
      })
    ])

    return NextResponse.json({
      message: 'Membership updated successfully',
      userMembership: {
        ...updatedMembership,
        user,
        membership
      }
    })

  } catch (error) {
    console.error('Error updating membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user membership
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if membership exists
    const existingMembership = await prisma.userMembership.findUnique({
      where: { id }
    })

    if (!existingMembership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Fetch related data manually before delete
    const [user, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: existingMembership.userId },
        select: { name: true, email: true }
      }),
      prisma.membership.findUnique({
        where: { id: existingMembership.membershipId },
        select: { name: true }
      })
    ])

    // Delete membership
    await prisma.userMembership.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Membership deleted successfully',
      deletedMembership: {
        id,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        membershipName: membership?.name || 'Unknown'
      }
    })

  } catch (error) {
    console.error('Error deleting membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}