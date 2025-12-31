import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * Get commission settings for all memberships and products
 * GET /api/admin/commission/settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all memberships with commission info
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        title: true,
        duration: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        createdAt: true,
        updatedAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all products with commission info  
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        productType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary statistics
    const membershipStats = {
      total: memberships.length,
      flatCommission: memberships.filter(m => m.commissionType === 'FLAT').length,
      percentageCommission: memberships.filter(m => m.commissionType === 'PERCENTAGE').length,
      active: memberships.filter(m => m.isActive).length,
      totalValue: memberships.reduce((sum, m) => sum + Number(m.price), 0)
    }

    const productStats = {
      total: products.length,
      flatCommission: products.filter(p => p.commissionType === 'FLAT').length,
      percentageCommission: products.filter(p => p.commissionType === 'PERCENTAGE').length,
      active: products.filter(p => p.isActive).length,
      totalValue: products.reduce((sum, p) => sum + Number(p.price), 0)
    }

    // Transform data to include calculated equivalent percentages for FLAT commissions
    const enhancedMemberships = memberships.map(m => ({
      ...m,
      price: Number(m.price),
      affiliateCommissionRate: Number(m.affiliateCommissionRate),
      equivalentPercentage: m.commissionType === 'FLAT' 
        ? ((Number(m.affiliateCommissionRate) / Number(m.price)) * 100).toFixed(2)
        : Number(m.affiliateCommissionRate).toFixed(2)
    }))

    const enhancedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      affiliateCommissionRate: Number(p.affiliateCommissionRate),
      equivalentPercentage: p.commissionType === 'FLAT'
        ? ((Number(p.affiliateCommissionRate) / Number(p.price)) * 100).toFixed(2)
        : Number(p.affiliateCommissionRate).toFixed(2)
    }))

    return NextResponse.json({
      success: true,
      data: {
        memberships: enhancedMemberships,
        products: enhancedProducts,
        statistics: {
          memberships: membershipStats,
          products: productStats,
          combined: {
            total: membershipStats.total + productStats.total,
            flatCommission: membershipStats.flatCommission + productStats.flatCommission,
            percentageCommission: membershipStats.percentageCommission + productStats.percentageCommission,
            totalValue: membershipStats.totalValue + productStats.totalValue
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching commission settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}