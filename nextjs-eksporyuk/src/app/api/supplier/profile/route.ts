import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/supplier/profile - Get current user's supplier profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        products: {
          where: {
            status: { in: ['DRAFT', 'ACTIVE'] },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    // Get membership info
    const membership = await prisma.supplierMembership.findUnique({
      where: { userId: session.user.id },
      include: {
        package: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        profile,
        membership,
      },
    })
  } catch (error) {
    console.error('[SUPPLIER_PROFILE_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/supplier/profile - Update supplier profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if profile exists
    const existingProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      companyName,
      bio,
      businessCategory,
      province,
      city,
      address,
      contactPerson,
      email,
      phone,
      whatsapp,
      website,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
    } = body

    // Update profile
    const updatedProfile = await prisma.supplierProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(companyName && { companyName }),
        ...(bio !== undefined && { bio }),
        ...(businessCategory !== undefined && { businessCategory }),
        ...(province && { province }),
        ...(city && { city }),
        ...(address !== undefined && { address }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(website !== undefined && { website }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('[SUPPLIER_PROFILE_PUT]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
