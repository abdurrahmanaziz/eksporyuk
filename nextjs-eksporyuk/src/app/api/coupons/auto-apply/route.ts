import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')

    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId is required' },
        { status: 400 }
      )
    }

    // Find active coupon for this membership
    // Check if membershipIds contains this membership
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: new Date()
        },
        OR: [
          { validUntil: { gte: new Date() } },
          { validUntil: null }
        ]
      }
    })

    // Filter coupons that apply to this membership
    const applicableCoupon = coupons.find(coupon => {
      // If no membershipIds specified, coupon applies to all
      if (!coupon.membershipIds) return true
      
      // Check if membershipIds (JSON array) contains this membership
      try {
        const membershipIds = typeof coupon.membershipIds === 'string' 
          ? JSON.parse(coupon.membershipIds as string)
          : coupon.membershipIds as any[]
        
        if (Array.isArray(membershipIds)) {
          return membershipIds.includes(membershipId)
        }
      } catch (e) {
        return false
      }
      
      return false
    })

    const coupon = applicableCoupon

    if (!coupon) {
      return NextResponse.json({ coupon: null })
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discount: Number(coupon.discountValue),
        discountType: coupon.discountType
      }
    })
  } catch (error) {
    console.error('Error fetching auto-apply coupon:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}
