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
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
    const membership = await prisma.supplierMembership.findFirst({
      where: { userId: session.user.id },
      include: {
        package: true,
      },
      orderBy: { createdAt: 'desc' },
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

    // ===== EDIT LOCKING LOGIC (PRD Rule) =====
    const lockedStatuses = ['RECOMMENDED_BY_MENTOR', 'VERIFIED']
    if (lockedStatuses.includes(existingProfile.status)) {
      return NextResponse.json(
        { 
          error: 'Profile is locked for editing',
          message: 'Your profile has been verified and cannot be edited directly. Please contact admin for changes.',
          status: existingProfile.status
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      // Existing fields
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
      
      // NEW FIELDS
      // Tab 1: Identitas Usaha
      legalEntityType,
      businessField,
      mainProducts,
      establishedYear,
      
      // Tab 2: Alamat & Lokasi
      district,
      postalCode,
      productionLocation,
      
      // Tab 3: Kontak Perusahaan
      picPosition,
      businessEmail,
      
      // Tab 4: Legalitas
      nibNumber,
      npwpNumber,
      siupNumber,
      
      // Tab 5: Bio Supplier
      companyAdvantages,
      uniqueValue,
      
      // Status update (only from DRAFT to ONBOARDING)
      status,
    } = body

    // Track what fields changed for audit
    const changedFields: string[] = []
    const oldValues: any = {}
    const newValues: any = {}
    
    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (oldVal !== newVal) {
        changedFields.push(field)
        oldValues[field] = oldVal
        newValues[field] = newVal
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    // Existing fields
    if (companyName) {
      trackChange('companyName', existingProfile.companyName, companyName)
      updateData.companyName = companyName
    }
    if (bio !== undefined) {
      trackChange('bio', existingProfile.bio, bio)
      updateData.bio = bio
    }
    if (businessCategory !== undefined) {
      trackChange('businessCategory', existingProfile.businessCategory, businessCategory)
      updateData.businessCategory = businessCategory
    }
    if (province) {
      trackChange('province', existingProfile.province, province)
      updateData.province = province
    }
    if (city) {
      trackChange('city', existingProfile.city, city)
      updateData.city = city
    }
    if (address !== undefined) {
      trackChange('address', existingProfile.address, address)
      updateData.address = address
    }
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (website !== undefined) updateData.website = website
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl
    
    // NEW FIELDS
    if (legalEntityType !== undefined) updateData.legalEntityType = legalEntityType
    if (businessField !== undefined) updateData.businessField = businessField
    if (mainProducts !== undefined) updateData.mainProducts = mainProducts
    if (establishedYear !== undefined) updateData.establishedYear = establishedYear ? parseInt(establishedYear) : null
    if (district !== undefined) updateData.district = district
    if (postalCode !== undefined) updateData.postalCode = postalCode
    if (productionLocation !== undefined) updateData.productionLocation = productionLocation
    if (picPosition !== undefined) updateData.picPosition = picPosition
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail
    if (nibNumber !== undefined) updateData.nibNumber = nibNumber
    if (npwpNumber !== undefined) updateData.npwpNumber = npwpNumber
    if (siupNumber !== undefined) updateData.siupNumber = siupNumber
    if (companyAdvantages !== undefined) updateData.companyAdvantages = companyAdvantages
    if (uniqueValue !== undefined) updateData.uniqueValue = uniqueValue
    
    // Status update (only allow DRAFT → ONBOARDING or ONBOARDING → WAITING_REVIEW)
    if (status && status !== existingProfile.status) {
      const allowedTransitions: Record<string, string[]> = {
        'DRAFT': ['ONBOARDING'],
        'ONBOARDING': ['WAITING_REVIEW', 'DRAFT'],
        'WAITING_REVIEW': [], // Can't self-update from this status
      }
      
      if (allowedTransitions[existingProfile.status]?.includes(status)) {
        trackChange('status', existingProfile.status, status)
        updateData.status = status
      } else {
        return NextResponse.json(
          { error: `Cannot change status from ${existingProfile.status} to ${status}` },
          { status: 400 }
        )
      }
    }

    // Update profile in transaction with audit log
    const result = await prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.supplierProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      })
      
      // Create audit log if there were changes
      if (changedFields.length > 0) {
        await tx.supplierAuditLog.create({
          data: {
            supplierId: existingProfile.id,
            userId: session.user.id,
            action: 'PROFILE_EDIT',
            fieldChanged: changedFields.join(', '),
            oldValue: JSON.stringify(oldValues),
            newValue: JSON.stringify(newValues),
            notes: `Updated ${changedFields.length} field(s)`,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        })
      }
      
      return updatedProfile
    })

    return NextResponse.json({
      success: true,
      data: result,
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
