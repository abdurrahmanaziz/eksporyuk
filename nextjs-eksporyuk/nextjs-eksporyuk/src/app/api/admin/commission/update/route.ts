import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendCommissionSettingsChangeNotification } from '@/lib/commission-notification-service'

interface UpdateCommissionRequest {
  membershipId?: string
  productId?: string
  commissionType: 'FLAT' | 'PERCENTAGE'
  affiliateCommissionRate: number
}

/**
 * Update commission type and rate for membership or product
 * POST /api/admin/commission/update
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body: UpdateCommissionRequest = await request.json()
    const { membershipId, productId, commissionType, affiliateCommissionRate } = body

    // Validation
    if (!membershipId && !productId) {
      return NextResponse.json({ 
        error: 'Either membershipId or productId is required' 
      }, { status: 400 })
    }

    if (!['FLAT', 'PERCENTAGE'].includes(commissionType)) {
      return NextResponse.json({ 
        error: 'Invalid commission type. Must be FLAT or PERCENTAGE' 
      }, { status: 400 })
    }

    if (typeof affiliateCommissionRate !== 'number' || affiliateCommissionRate < 0) {
      return NextResponse.json({ 
        error: 'Invalid commission rate. Must be a positive number' 
      }, { status: 400 })
    }

    // Additional validation based on commission type
    if (commissionType === 'PERCENTAGE' && affiliateCommissionRate > 100) {
      return NextResponse.json({ 
        error: 'Percentage commission cannot exceed 100%' 
      }, { status: 400 })
    }

    // Update membership commission
    if (membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        select: { id: true, title: true, price: true, commissionType: true, affiliateCommissionRate: true }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
      }

      // Additional validation for FLAT commission
      if (commissionType === 'FLAT' && affiliateCommissionRate > Number(membership.price)) {
        return NextResponse.json({ 
          error: `FLAT commission (Rp ${affiliateCommissionRate.toLocaleString('id-ID')}) cannot exceed membership price (Rp ${Number(membership.price).toLocaleString('id-ID')})` 
        }, { status: 400 })
      }

      const updatedMembership = await prisma.membership.update({
        where: { id: membershipId },
        data: {
          commissionType,
          affiliateCommissionRate,
          updatedAt: new Date()
        },
        select: {
          id: true,
          title: true,
          price: true,
          commissionType: true,
          affiliateCommissionRate: true
        }
      })

      // Send notification about commission change
      try {
        const equivalentPercentage = ((affiliateCommissionRate / Number(membership.price)) * 100).toFixed(2)
        await sendCommissionSettingsChangeNotification({
          itemType: 'MEMBERSHIP',
          itemName: membership.title,
          itemId: membershipId,
          previousCommissionType: membership.commissionType as 'FLAT' | 'PERCENTAGE',
          previousRate: Number(membership.affiliateCommissionRate),
          newCommissionType: commissionType,
          newRate: affiliateCommissionRate,
          equivalentPercentage,
          changedBy: session.user.name || session.user.email || 'Admin'
        })
      } catch (error) {
        console.error('Error sending commission change notification:', error)
        // Don't block the response if notification fails
      }

      return NextResponse.json({
        success: true,
        message: `Commission updated successfully for ${membership.title}`,
        data: {
          type: 'membership',
          item: updatedMembership,
          previousCommissionType: membership.commissionType,
          previousCommissionRate: membership.affiliateCommissionRate
        }
      })
    }

    // Update product commission  
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, price: true, commissionType: true, affiliateCommissionRate: true }
      })

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Additional validation for FLAT commission
      if (commissionType === 'FLAT' && affiliateCommissionRate > Number(product.price)) {
        return NextResponse.json({ 
          error: `FLAT commission (Rp ${affiliateCommissionRate.toLocaleString('id-ID')}) cannot exceed product price (Rp ${Number(product.price).toLocaleString('id-ID')})` 
        }, { status: 400 })
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          commissionType,
          affiliateCommissionRate,
          updatedAt: new Date()
        },
        select: {
          id: true,
          title: true,
          price: true,
          commissionType: true,
          affiliateCommissionRate: true
        }
      })

      // Send notification about commission change
      try {
        const equivalentPercentage = ((affiliateCommissionRate / Number(product.price)) * 100).toFixed(2)
        await sendCommissionSettingsChangeNotification({
          itemType: 'PRODUCT',
          itemName: product.title,
          itemId: productId,
          previousCommissionType: product.commissionType as 'FLAT' | 'PERCENTAGE',
          previousRate: Number(product.affiliateCommissionRate),
          newCommissionType: commissionType,
          newRate: affiliateCommissionRate,
          equivalentPercentage,
          changedBy: session.user.name || session.user.email || 'Admin'
        })
      } catch (error) {
        console.error('Error sending commission change notification:', error)
        // Don't block the response if notification fails
      }

      return NextResponse.json({
        success: true,
        message: `Commission updated successfully for ${product.title}`,
        data: {
          type: 'product',
          item: updatedProduct,
          previousCommissionType: product.commissionType,
          previousCommissionRate: product.affiliateCommissionRate
        }
      })
    }

  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Bulk update commission for multiple items
 * PUT /api/admin/commission/update
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      membershipIds = [], 
      productIds = [], 
      commissionType, 
      affiliateCommissionRate 
    } = body

    if (membershipIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ 
        error: 'At least one membershipId or productId is required' 
      }, { status: 400 })
    }

    const results: any[] = []

    // Bulk update memberships
    if (membershipIds.length > 0) {
      const updated = await prisma.membership.updateMany({
        where: { id: { in: membershipIds } },
        data: {
          commissionType,
          affiliateCommissionRate,
          updatedAt: new Date()
        }
      })
      results.push({ type: 'memberships', count: updated.count })
    }

    // Bulk update products
    if (productIds.length > 0) {
      const updated = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: {
          commissionType,
          affiliateCommissionRate,
          updatedAt: new Date()
        }
      })
      results.push({ type: 'products', count: updated.count })
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk commission update completed',
      results,
      settings: {
        commissionType,
        affiliateCommissionRate
      }
    })

  } catch (error) {
    console.error('Error bulk updating commission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}