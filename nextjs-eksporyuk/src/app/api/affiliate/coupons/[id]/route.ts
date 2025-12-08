import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PATCH /api/affiliate/coupons/[id] - Toggle coupon status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    // Verify coupon belongs to this user
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existingCoupon || existingCoupon.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 })
    }
    
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ coupon, success: true })
  } catch (error: any) {
    console.error('Error updating affiliate coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/affiliate/coupons/[id] - Update affiliate coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { code } = body

    // Verify coupon belongs to this affiliate
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existingCoupon || existingCoupon.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 })
    }
    
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
      },
    })

    return NextResponse.json({ coupon })
  } catch (error: any) {
    console.error('Error updating affiliate coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/affiliate/coupons/[id] - Delete affiliate coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify coupon belongs to this affiliate
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existingCoupon || existingCoupon.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Coupon not found or unauthorized' }, { status: 404 })
    }

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting affiliate coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon', details: error.message },
      { status: 500 }
    )
  }
}
