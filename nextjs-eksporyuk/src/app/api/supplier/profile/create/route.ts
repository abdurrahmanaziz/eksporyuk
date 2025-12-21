import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      companyName,
      slug,
      description,
      province,
      city,
      district,
      address,
      postalCode,
      phone,
      email,
      website,
      businessType,
    } = body

    // Validation
    if (!companyName || !province || !city) {
      return NextResponse.json(
        { error: 'Company name, province, and city are required' },
        { status: 400 }
      )
    }

    // Check if user already has supplier profile
    const existingProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Supplier profile already exists' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    if (slug) {
      const slugExists = await prisma.supplierProfile.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already taken. Please choose another one.' },
          { status: 400 }
        )
      }
    }

    // Get default FREE supplier package
    const freePackage = await prisma.supplierPackage.findFirst({
      where: {
        type: 'FREE',
        isActive: true,
      },
    })

    if (!freePackage) {
      return NextResponse.json(
        { error: 'No FREE package available. Please contact admin.' },
        { status: 500 }
      )
    }

    // Create supplier profile with FREE package membership
    const supplierProfile = await prisma.supplierProfile.create({
      data: {
        userId: session.user.id,
        companyName,
        slug: slug || companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description,
        province,
        city,
        district,
        address,
        postalCode,
        phone,
        email,
        website,
        businessType,
        isVerified: false,
        isSuspended: false,
      },
    })

    // Create FREE supplier membership
    await prisma.supplierMembership.create({
      data: {
        userId: session.user.id,
        packageId: freePackage.id,
        isActive: true,
        startDate: new Date(),
        // No endDate for FREE package
      },
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'SUPPLIER_PROFILE_CREATED',
          entity: 'SUPPLIER_PROFILE',
          entityId: supplierProfile.id,
          metadata: {
            companyName,
            packageType: 'FREE',
          },
        },
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier profile created successfully',
      profile: supplierProfile,
      redirectToPackage: false, // User is on FREE, can upgrade later
    })
  } catch (error) {
    console.error('Error creating supplier profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
