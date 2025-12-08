import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/supplier/packages/[id]/features
 * Update features for specific supplier package (ADMIN ONLY)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validate package exists
    const existingPackage = await prisma.supplierPackage.findUnique({
      where: { id },
    })

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Extract features from body
    const {
      maxProducts,
      verifiedBadge,
      customURL,
      statistics,
      ranking,
      priority,
      catalogDownload,
      multiLanguage,
    } = body

    // Build features object
    const features: any = {}

    if (maxProducts !== undefined) features.maxProducts = maxProducts
    if (verifiedBadge !== undefined) features.verifiedBadge = verifiedBadge
    if (customURL !== undefined) features.customURL = customURL
    if (statistics !== undefined) features.statistics = statistics
    if (ranking !== undefined) features.ranking = ranking
    if (priority !== undefined) features.priority = priority
    if (catalogDownload !== undefined) features.catalogDownload = catalogDownload
    if (multiLanguage !== undefined) features.multiLanguage = multiLanguage

    // Get existing features and merge
    const existingFeatures = existingPackage.features as any
    const updatedFeatures = {
      ...existingFeatures,
      ...features,
    }

    // Update package
    const updatedPackage = await prisma.supplierPackage.update({
      where: { id },
      data: {
        features: updatedFeatures,
      },
    })

    console.log(`[ADMIN] Features updated for supplier package: ${updatedPackage.name}`)

    return NextResponse.json({
      success: true,
      package: {
        id: updatedPackage.id,
        name: updatedPackage.name,
        features: updatedFeatures,
      },
    })
  } catch (error) {
    console.error('Error updating supplier package features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/supplier/packages/[id]/features
 * Get features for specific supplier package
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = params

    const supplierPackage = await prisma.supplierPackage.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        features: true,
      },
    })

    if (!supplierPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      package: supplierPackage,
      features: supplierPackage.features,
    })
  } catch (error) {
    console.error('Error fetching supplier package features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
