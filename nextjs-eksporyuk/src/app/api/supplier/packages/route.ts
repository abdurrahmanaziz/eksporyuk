import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/supplier/packages
 * Public API - Get all active supplier packages for registration form
 */
export async function GET() {
  try {
    const packages = await prisma.supplierPackage.findMany({
      where: {
        isActive: true, // Only show active packages
      },
      orderBy: [
        { displayOrder: 'asc' },
        { price: 'asc' }, // Show cheaper packages first
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        duration: true,
        price: true,
        originalPrice: true,
        features: true,
        description: true,
        displayOrder: true,
      },
    })

    return NextResponse.json({
      success: true,
      packages,
    })
  } catch (error) {
    console.error('[SUPPLIER_PACKAGES_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
