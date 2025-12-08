import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/supplier/products - Get current supplier's products
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      supplierId: profile.id,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.supplierProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.supplierProduct.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    })
  } catch (error) {
    console.error('[SUPPLIER_PRODUCTS_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/supplier/products - Create new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found. Please register as supplier first.' },
        { status: 404 }
      )
    }

    // Get membership to check quota
    const membership = await prisma.supplierMembership.findUnique({
      where: { userId: session.user.id },
      include: { package: true },
    })

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: 'No active supplier membership found' },
        { status: 403 }
      )
    }

    const features = membership.package.features as any
    const maxProducts = features.maxProducts ?? 1
    const maxImages = features.maxImages ?? 3
    const maxDocuments = features.maxDocuments ?? 1

    // Check quota (if not unlimited)
    if (maxProducts !== -1) {
      const currentProductCount = await prisma.supplierProduct.count({
        where: {
          supplierId: profile.id,
          status: { in: ['DRAFT', 'ACTIVE'] },
        },
      })

      if (currentProductCount >= maxProducts) {
        return NextResponse.json(
          {
            error: `Kuota produk habis. Paket Anda memungkinkan ${maxProducts} produk. Upgrade ke Premium untuk produk unlimited.`,
            code: 'QUOTA_EXCEEDED',
            maxProducts,
            currentCount: currentProductCount,
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const {
      title,
      slug,
      description,
      images,
      documents,
      category,
      tags,
      status,
      price,
      minOrder,
    } = body

    // Validate images limit
    if (images && Array.isArray(images) && images.length > maxImages) {
      return NextResponse.json(
        {
          error: `Maksimum ${maxImages} gambar diizinkan untuk paket Anda. Upgrade untuk lebih banyak gambar.`,
          code: 'IMAGES_LIMIT_EXCEEDED',
          maxImages,
          currentImages: images.length,
        },
        { status: 403 }
      )
    }

    // Validate documents limit
    if (documents && Array.isArray(documents) && documents.length > maxDocuments) {
      return NextResponse.json(
        {
          error: `Maksimum ${maxDocuments} dokumen diizinkan untuk paket Anda. Upgrade untuk lebih banyak dokumen.`,
          code: 'DOCUMENTS_LIMIT_EXCEEDED',
          maxDocuments,
          currentDocuments: documents.length,
        },
        { status: 403 }
      )
    }

    // Validation
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const slugExists = await prisma.supplierProduct.findUnique({
      where: { slug },
    })

    if (slugExists) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose another.' },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.supplierProduct.create({
      data: {
        supplierId: profile.id,
        title,
        slug,
        description,
        images: images || null,
        documents: documents || null,
        category,
        tags,
        status: status || 'DRAFT',
        price,
        minOrder,
      },
    })

    // Update total products count
    await prisma.supplierProfile.update({
      where: { id: profile.id },
      data: {
        totalProducts: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    })
  } catch (error) {
    console.error('[SUPPLIER_PRODUCTS_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
