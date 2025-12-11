import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// PATCH /api/admin/coupons/[id] - Update coupon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      code, discountType, discountValue, usageLimit, validUntil, description, 
      isActive, minPurchase, productIds, membershipIds, courseIds, 
      isAffiliateEnabled, isForRenewal, maxGeneratePerAffiliate, maxUsagePerCoupon
    } = body

    const updateData: any = {}

    if (code !== undefined) updateData.code = code.toUpperCase()
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue)
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? Number(usageLimit) : null
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (description !== undefined) updateData.description = description || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? Number(minPurchase) : null
    // For JSON fields, use Prisma.DbNull to clear, or array value to set
    if (productIds !== undefined) {
      updateData.productIds = productIds && productIds.length > 0 ? productIds : Prisma.DbNull
    }
    if (membershipIds !== undefined) {
      updateData.membershipIds = membershipIds && membershipIds.length > 0 ? membershipIds : Prisma.DbNull
    }
    if (courseIds !== undefined) {
      updateData.courseIds = courseIds && courseIds.length > 0 ? courseIds : Prisma.DbNull
    }
    if (isAffiliateEnabled !== undefined) updateData.isAffiliateEnabled = isAffiliateEnabled
    if (isForRenewal !== undefined) updateData.isForRenewal = isForRenewal
    if (maxGeneratePerAffiliate !== undefined) updateData.maxGeneratePerAffiliate = maxGeneratePerAffiliate ? Number(maxGeneratePerAffiliate) : null
    if (maxUsagePerCoupon !== undefined) updateData.maxUsagePerCoupon = maxUsagePerCoupon ? Number(maxUsagePerCoupon) : null

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/coupons/[id] - Update coupon (alias for PATCH)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
