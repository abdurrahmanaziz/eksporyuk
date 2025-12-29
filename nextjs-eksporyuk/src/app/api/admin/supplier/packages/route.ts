import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/supplier/packages - List all supplier packages
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const packages = await prisma.supplierPackage.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // Count memberships for each package manually
    const packagesWithStats = await Promise.all(
      packages.map(async (pkg) => {
        const [totalSubscriptions, activeSubscriptions] = await Promise.all([
          prisma.supplierMembership.count({
            where: { packageId: pkg.id },
          }),
          prisma.supplierMembership.count({
            where: {
              packageId: pkg.id,
              isActive: true,
            },
          }),
        ])

        return {
          ...pkg,
          activeSubscriptions,
          totalSubscriptions,
          _count: { memberships: totalSubscriptions },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: packagesWithStats,
    })
  } catch (error) {
    console.error('[ADMIN_SUPPLIER_PACKAGES_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/supplier/packages - Create new supplier package
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      type,
      duration,
      price,
      originalPrice,
      features,
      description,
      isActive,
      displayOrder,
      commissionType,
      affiliateCommissionRate,
    } = body

    // Validation
    if (!name || !slug || !type || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, type, duration, price' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPackage = await prisma.supplierPackage.findFirst({
      where: { slug },
    })

    if (existingPackage) {
      return NextResponse.json(
        { error: 'Package with this slug already exists' },
        { status: 400 }
      )
    }

    // Create package
    const newPackage = await prisma.supplierPackage.create({
      data: {
        id: createId(),
        name,
        slug,
        type,
        duration,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        features: features || {},
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
        commissionType: commissionType || 'PERCENTAGE',
        affiliateCommissionRate: affiliateCommissionRate || 30,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: newPackage,
      message: 'Supplier package created successfully',
    })
  } catch (error) {
    console.error('[ADMIN_SUPPLIER_PACKAGES_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
