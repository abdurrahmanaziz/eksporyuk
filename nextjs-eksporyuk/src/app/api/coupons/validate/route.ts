import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/coupons/validate - Validate coupon code (checkout flow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, productId, courseId, planId, isRenewal } = body

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Kode kupon tidak boleh kosong' },
        { status: 400 }
      )
    }

    // Find coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: 'Kode kupon tidak valid atau sudah kadaluarsa' },
        { status: 404 }
      )
    }

    // Check expiry
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return NextResponse.json(
        { valid: false, message: 'Kupon sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, message: 'Kupon sudah mencapai batas penggunaan' },
        { status: 400 }
      )
    }

    // Check if this is a renewal-only coupon
    if (coupon.isForRenewal) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { valid: false, message: 'Kupon ini hanya untuk member yang sudah login' },
          { status: 400 }
        )
      }

      // Check if user has active membership (for renewal validation)
      const hasActiveMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        }
      })

      // If isRenewal is explicitly false and coupon is for renewal only
      if (!isRenewal && !hasActiveMembership) {
        return NextResponse.json(
          { valid: false, message: 'Kupon ini hanya untuk perpanjangan membership. Anda harus memiliki membership aktif terlebih dahulu.' },
          { status: 400 }
        )
      }
    }

    // Check if applicable to membership
    if (planId && coupon.membershipIds) {
      try {
        const membershipIds = typeof coupon.membershipIds === 'string' 
          ? JSON.parse(coupon.membershipIds as string)
          : coupon.membershipIds as any[]
        
        if (Array.isArray(membershipIds) && membershipIds.length > 0 && !membershipIds.includes(planId)) {
          return NextResponse.json(
            { valid: false, message: 'Kupon tidak berlaku untuk paket ini' },
            { status: 400 }
          )
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue.toString()),
        isForRenewal: coupon.isForRenewal
      }
    })

  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Gagal memvalidasi kupon' },
      { status: 500 }
    )
  }
}

// GET /api/coupons/validate?code=XXX&productId=YYY&courseId=ZZZ - Validate coupon code
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const productId = searchParams.get('productId')
    const courseId = searchParams.get('courseId')
    const membershipId = searchParams.get('membershipId')
    const isRenewal = searchParams.get('isRenewal') === 'true'

    if (!code) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kode kupon harus diisi' },
        { status: 400 }
      )
    }

    // Find coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: {
        code,
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kupon tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kupon tidak aktif' },
        { status: 400 }
      )
    }

    // Check expiry
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kupon sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // Check valid from
    if (coupon.validFrom && new Date() < coupon.validFrom) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kupon belum aktif' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, success: false, error: 'Kupon sudah mencapai batas penggunaan' },
        { status: 400 }
      )
    }

    // Check if this is a renewal-only coupon
    if (coupon.isForRenewal) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { valid: false, success: false, error: 'Kupon ini hanya untuk member yang sudah login' },
          { status: 400 }
        )
      }

      // Check if user has active membership
      const hasActiveMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        }
      })

      if (!isRenewal && !hasActiveMembership) {
        return NextResponse.json(
          { valid: false, success: false, error: 'Kupon ini hanya untuk perpanjangan membership. Anda harus memiliki membership aktif terlebih dahulu.' },
          { status: 400 }
        )
      }
    }

    // Check if coupon is applicable to the specified product, course, or membership
    if (productId && coupon.productIds) {
      try {
        const productIds = typeof coupon.productIds === 'string' 
          ? JSON.parse(coupon.productIds as string)
          : coupon.productIds as any[]
        
        if (Array.isArray(productIds) && productIds.length > 0 && !productIds.includes(productId)) {
          return NextResponse.json(
            { valid: false, success: false, error: 'Kupon tidak berlaku untuk produk ini' },
            { status: 400 }
          )
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (courseId && coupon.courseIds) {
      try {
        const courseIds = typeof coupon.courseIds === 'string' 
          ? JSON.parse(coupon.courseIds as string)
          : coupon.courseIds as any[]
        
        if (Array.isArray(courseIds) && courseIds.length > 0 && !courseIds.includes(courseId)) {
          return NextResponse.json(
            { valid: false, success: false, error: 'Kupon tidak berlaku untuk kursus ini' },
            { status: 400 }
          )
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (membershipId && coupon.membershipIds) {
      try {
        const membershipIds = typeof coupon.membershipIds === 'string' 
          ? JSON.parse(coupon.membershipIds as string)
          : coupon.membershipIds as any[]
        
        if (Array.isArray(membershipIds) && membershipIds.length > 0 && !membershipIds.includes(membershipId)) {
          return NextResponse.json(
            { valid: false, success: false, error: 'Kupon tidak berlaku untuk paket ini' },
            { status: 400 }
          )
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Return coupon details
    return NextResponse.json({
      valid: true,
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.discountType.toLowerCase(), // 'percentage' or 'fixed'
        discount: Number(coupon.discountValue),
        minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : null,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        isForRenewal: coupon.isForRenewal,
      },
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { valid: false, success: false, error: 'Gagal memvalidasi kupon' },
      { status: 500 }
    )
  }
}
