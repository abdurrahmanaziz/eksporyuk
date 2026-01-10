import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Get supplier profile
    const supplier = await prisma.supplierProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        companyName: true,
        bio: true,
        logo: true,
        banner: true,
        address: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        website: true,
        whatsapp: true,
        instagramUrl: true,
        facebookUrl: true,
        linkedinUrl: true,
        businessCategory: true,
        userId: true,
        isVerified: true,
        isSuspended: true,
        viewCount: true,
        createdAt: true
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (supplier.isSuspended) {
      return NextResponse.json(
        { success: false, error: 'Supplier suspended' },
        { status: 403 }
      )
    }

    // Increment view count
    await prisma.supplierProfile.update({
      where: { userId: supplier.userId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    // Get active products
    const products = await prisma.supplierProduct.findMany({
      where: {
        supplier: {
          userId: supplier.userId
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        images: true,
        category: true,
        price: true,
        minOrder: true,
        viewCount: true,
        likeCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    })

    // Get membership info
    const membership = await prisma.supplierMembership.findFirst({
      where: {
        userId: supplier.userId,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      select: {
        id: true,
        package: {
          select: {
            name: true,
            type: true
          }
        },
        startDate: true,
        endDate: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        products,
        membership,
        isPremium: membership?.package?.type === 'PREMIUM'
      }
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}
