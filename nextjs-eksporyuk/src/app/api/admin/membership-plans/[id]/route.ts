import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Generate cuid-like ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('hex')
}


// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET - Get single membership plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch membership plan with explicit select to avoid missing column errors
    const plan = await prisma.membership.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        checkoutTemplate: true,
        description: true,
        duration: true,
        price: true,
        originalPrice: true,
        discount: true,
        commissionType: true,
        affiliateCommissionRate: true,
        affiliateEnabled: true,
        features: true,
        isBestSeller: true,
        isPopular: true,
        isMostPopular: true,
        isActive: true,
        status: true,
        salesPageUrl: true,
        alternativeUrl: true,
        reminders: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        mailketingListId: true,
        mailketingListName: true,
        autoAddToList: true,
        autoRemoveOnExpire: true,
        showInGeneralCheckout: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Count user memberships separately (no direct relation in schema)
    const userMembershipsCount = await prisma.userMembership.count({
      where: { membershipId: id }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
    }

    // Fetch related data separately (no direct relation in schema)
    const [membershipGroups, membershipCourses, membershipProducts, membershipFeatures] = await Promise.all([
      prisma.membershipGroup.findMany({
        where: { membershipId: id },
        select: { groupId: true }
      }),
      prisma.membershipCourse.findMany({
        where: { membershipId: id },
        select: { courseId: true }
      }),
      prisma.membershipProduct.findMany({
        where: { membershipId: id },
        select: { productId: true }
      }),
      prisma.membershipFeatureAccess.findMany({
        where: { membershipId: id }
      })
    ])

    // Combine data
    const enrichedPlan = {
      ...plan,
      membershipGroups,
      membershipCourses,
      membershipProducts,
      membershipFeatures
    }

    // Parse features - handle flat array format
    let prices: any[] = []
    let benefits: string[] = []
    
    if (enrichedPlan.features) {
      try {
        let featuresData = plan.features
        
        // Parse if string
        if (typeof featuresData === 'string') {
          featuresData = JSON.parse(featuresData)
        }
        
        // Handle flat array (default format)
        if (Array.isArray(featuresData)) {
          benefits = featuresData
          const basePrice = parseFloat(plan.price?.toString() || '0')
          const originalPrice = parseFloat(plan.originalPrice?.toString() || basePrice.toString())
          
          prices = [{
            duration: plan.duration || 'ONE_MONTH',
            label: plan.name,
            price: basePrice,
            originalPrice: originalPrice,
            benefits: benefits,
            badge: '',
            isPopular: plan.isPopular || false
          }]
        }
      } catch (e) {
        console.error('Error parsing features:', e)
      }
    }
    
    const planWithPrices = {
      ...plan,
      prices,
      benefits,
      features: benefits, // Flat array for backward compatibility
      affiliateCommission: parseFloat(plan.affiliateCommissionRate?.toString() || '0.30'),
      salespage: plan.salesPageUrl || '',
      followUpMessages: plan.reminders || []
    }

    return NextResponse.json({ plan: planWithPrices })

  } catch (error) {
    console.error('Error fetching membership plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT & PATCH - Update membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      name,
      description,
      duration,
      price,
      originalPrice,
      discount,
      commissionType,
      affiliateCommissionRate,
      isBestSeller,
      isPopular,
      isActive,
      status,
      salesPageUrl,
      features,
      formLogo,
      formBanner,
      showInGeneralCheckout,
      membershipFeatures, // Legacy: Feature access configurations as objects
      featureAccess, // New: Feature access as array of string keys
      groups, // Array of group IDs
      courses, // Array of course IDs
      products // Array of product IDs
    } = body

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Nama membership tidak boleh kosong' }, { status: 400 })
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return NextResponse.json({ error: 'Harga tidak valid (harus >= 0)' }, { status: 400 })
    }

    if (duration !== undefined) {
      const validDurations = ['SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME']
      if (!validDurations.includes(duration)) {
        return NextResponse.json({ 
          error: 'Durasi tidak valid', 
          validValues: validDurations 
        }, { status: 400 })
      }
    }

    // Check if plan exists
    const existingPlan = await prisma.membership.findUnique({
      where: { id: id }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Membership plan tidak ditemukan' }, { status: 404 })
    }

    // Build update data - only include fields that exist in schema
    const updateData: any = {}
    const changedFields: string[] = []

    if (name !== undefined && name.trim()) {
      updateData.name = name.trim()
      changedFields.push('name')
      
      // Regenerate slug if name changed
      if (name.trim() !== existingPlan.name) {
        let newSlug = generateSlug(name)
        
        // Check if new slug already exists (excluding current plan)
        const slugExists = await prisma.membership.findFirst({
          where: {
            slug: newSlug,
            id: { not: id }
          }
        })

        if (slugExists) {
          newSlug = `${newSlug}-${Date.now()}`
        }

        updateData.slug = newSlug
        changedFields.push('slug')
      }
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || ''
      if (description !== existingPlan.description) changedFields.push('description')
    }
    
    // Handle duration - only update if it's a valid enum value
    if (duration !== undefined) {
      const validDurations = ['SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME']
      if (validDurations.includes(duration)) {
        updateData.duration = duration
        if (duration !== existingPlan.duration) changedFields.push('duration')
      }
    }
    
    if (price !== undefined) {
      updateData.price = Math.max(0, price)
      if (price !== existingPlan.price) changedFields.push('price')
    }

    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice
      if (originalPrice !== existingPlan.originalPrice) changedFields.push('originalPrice')
    }
    if (discount !== undefined) {
      updateData.discount = discount
      if (discount !== existingPlan.discount) changedFields.push('discount')
    }
    if (commissionType !== undefined) {
      // Validate commission type
      const validCommissionTypes = ['PERCENTAGE', 'FLAT']
      if (validCommissionTypes.includes(commissionType)) {
        updateData.commissionType = commissionType
        if (commissionType !== existingPlan.commissionType) changedFields.push('commissionType')
      }
    }
    if (affiliateCommissionRate !== undefined) {
      updateData.affiliateCommissionRate = affiliateCommissionRate
      if (affiliateCommissionRate !== existingPlan.affiliateCommissionRate) changedFields.push('affiliateCommissionRate')
    }
    if (isBestSeller !== undefined) {
      updateData.isBestSeller = isBestSeller
      if (isBestSeller !== existingPlan.isBestSeller) changedFields.push('isBestSeller')
    }
    if (isPopular !== undefined) {
      updateData.isPopular = isPopular
      if (isPopular !== existingPlan.isPopular) changedFields.push('isPopular')
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive
      if (isActive !== existingPlan.isActive) changedFields.push('isActive')
    }
    if (status !== undefined) {
      updateData.status = status
      // Auto-set isActive based on status
      updateData.isActive = status === 'PUBLISHED'
      if (status !== existingPlan.status) changedFields.push('status')
    }
    if (salesPageUrl !== undefined) {
      updateData.salesPageUrl = salesPageUrl?.trim() || null
      if (salesPageUrl !== existingPlan.salesPageUrl) changedFields.push('salesPageUrl')
    }
    if (features !== undefined) {
      updateData.features = features
      changedFields.push('features')
    }
    if (formLogo !== undefined) {
      updateData.formLogo = formLogo || null
      if (formLogo !== existingPlan.formLogo) changedFields.push('formLogo')
    }
    if (formBanner !== undefined) {
      updateData.formBanner = formBanner || null
      if (formBanner !== existingPlan.formBanner) changedFields.push('formBanner')
    }
    if (showInGeneralCheckout !== undefined) {
      updateData.showInGeneralCheckout = showInGeneralCheckout
      if (showInGeneralCheckout !== existingPlan.showInGeneralCheckout) changedFields.push('showInGeneralCheckout')
    }

    // Handle affiliateEnabled
    if (body.affiliateEnabled !== undefined) {
      updateData.affiliateEnabled = body.affiliateEnabled
      if (body.affiliateEnabled !== existingPlan.affiliateEnabled) changedFields.push('affiliateEnabled')
    }

    // Update membership plan
    const updatedPlan = await prisma.membership.update({
      where: { id: id },
      data: updateData
    })

    // Track relationship updates
    let groupsUpdated = false
    let coursesUpdated = false
    let productsUpdated = false
    let featuresUpdated = false

    // Update membership feature access if provided (supports both formats)
    const featuresToUpdate = featureAccess || membershipFeatures
    if (featuresToUpdate !== undefined && Array.isArray(featuresToUpdate)) {
      // Delete existing features
      await prisma.membershipFeatureAccess.deleteMany({
        where: { membershipId: id }
      })
      
      // Create new features
      if (featuresToUpdate.length > 0) {
        // Handle both string array and object array formats
        const featureData = featuresToUpdate.map((f: any) => {
          // If string, convert to object
          if (typeof f === 'string') {
            return {
              id: generateId(),
              membershipId: id,
              featureKey: f,
              enabled: true,
              value: null,
              updatedAt: new Date()
            }
          }
          // If object, use as is
          return {
            id: generateId(),
            membershipId: id,
            featureKey: f.featureKey,
            enabled: f.enabled !== false,
            value: f.value || null,
            updatedAt: new Date()
          }
        })
        
        await prisma.membershipFeatureAccess.createMany({
          data: featureData
        })
      }
      featuresUpdated = true
      changedFields.push('featureAccess')
    }

    // Update groups if provided
    if (groups !== undefined && Array.isArray(groups)) {
      // Delete existing group associations
      await prisma.membershipGroup.deleteMany({
        where: { membershipId: id }
      })
      
      // Create new group associations
      if (groups.length > 0) {
        await prisma.membershipGroup.createMany({
          data: groups.map((groupId: string) => ({
            id: generateId(),
            membershipId: id,
            groupId: groupId
          })),
          skipDuplicates: true
        })
      }
      groupsUpdated = true
      changedFields.push('groups')
    }

    // Update courses if provided
    if (courses !== undefined && Array.isArray(courses)) {
      // Delete existing course associations
      await prisma.membershipCourse.deleteMany({
        where: { membershipId: id }
      })
      
      // Create new course associations
      if (courses.length > 0) {
        await prisma.membershipCourse.createMany({
          data: courses.map((courseId: string) => ({
            id: generateId(),
            membershipId: id,
            courseId: courseId
          })),
          skipDuplicates: true
        })
      }
      coursesUpdated = true
      changedFields.push('courses')
    }

    // Update products if provided
    if (products !== undefined && Array.isArray(products)) {
      // Delete existing product associations
      await prisma.membershipProduct.deleteMany({
        where: { membershipId: id }
      })
      
      // Create new product associations
      if (products.length > 0) {
        await prisma.membershipProduct.createMany({
          data: products.map((productId: string) => ({
            id: generateId(),
            membershipId: id,
            productId: productId
          })),
          skipDuplicates: true
        })
      }
      productsUpdated = true
      changedFields.push('products')
    }

    // Fetch junction table data to enrich response
    const [fetchedGroups, fetchedCourses, fetchedProducts, fetchedFeatures] = await Promise.all([
      prisma.membershipGroup.findMany({
        where: { membershipId: id },
        select: { groupId: true }
      }),
      prisma.membershipCourse.findMany({
        where: { membershipId: id },
        select: { courseId: true }
      }),
      prisma.membershipProduct.findMany({
        where: { membershipId: id },
        select: { productId: true }
      }),
      prisma.membershipFeatureAccess.findMany({
        where: { membershipId: id }
      })
    ])

    const enrichedPlan = {
      ...updatedPlan,
      membershipGroups: fetchedGroups,
      membershipCourses: fetchedCourses,
      membershipProducts: fetchedProducts,
      membershipFeatures: fetchedFeatures
    }

    // Log activity (optional, don't fail if error)
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_MEMBERSHIP_PLAN',
          entity: 'MEMBERSHIP',
          entityId: updatedPlan.id,
          metadata: {
            planName: updatedPlan.name,
            updatedFields: changedFields,
            relationshipsUpdated: {
              groups: groupsUpdated,
              courses: coursesUpdated,
              products: productsUpdated,
              features: featuresUpdated
            }
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Membership berhasil diperbarui',
      plan: enrichedPlan,
      summary: {
        changedFields: changedFields.length,
        fieldNames: changedFields,
        relationshipsUpdated: {
          groups: groupsUpdated ? (groups?.length || 0) : undefined,
          courses: coursesUpdated ? (courses?.length || 0) : undefined,
          products: productsUpdated ? (products?.length || 0) : undefined,
          features: featuresUpdated ? (featuresToUpdate?.length || 0) : undefined
        }
      }
    })

  } catch (error) {
    console.error('Error updating membership plan:', error)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan saat memperbarui membership',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if plan exists with all related data counts
    const existingPlan = await prisma.membership.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            userMemberships: true,
            affiliateLinks: true,
            membershipReminders: true,
            upgradeLogs: true
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
    }

    // Build detailed error message if plan is in use
    const usageErrors: string[] = []
    if (existingPlan._count.userMemberships > 0) {
      usageErrors.push(`${existingPlan._count.userMemberships} active members`)
    }
    if (existingPlan._count.affiliateLinks > 0) {
      usageErrors.push(`${existingPlan._count.affiliateLinks} affiliate links`)
    }
    if (existingPlan._count.upgradeLogs > 0) {
      usageErrors.push(`${existingPlan._count.upgradeLogs} upgrade logs`)
    }

    if (usageErrors.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete membership plan "${existingPlan.name}"`,
          details: `This plan is currently linked to: ${usageErrors.join(', ')}.`,
          suggestion: 'Set the plan to inactive instead of deleting it to preserve data integrity.'
        },
        { status: 400 }
      )
    }

    // Safe to delete - remove all related records in transaction
    await prisma.$transaction(async (tx) => {
      // Delete membership reminders
      await tx.membershipReminder.deleteMany({
        where: { membershipId: id }
      })
      
      // Delete membership groups
      await tx.membershipGroup.deleteMany({
        where: { membershipId: id }
      })
      
      // Delete membership courses
      await tx.membershipCourse.deleteMany({
        where: { membershipId: id }
      })
      
      // Delete membership products
      await tx.membershipProduct.deleteMany({
        where: { membershipId: id }
      })
      
      // Finally delete the membership
      await tx.membership.delete({
        where: { id: id }
      })
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETE_MEMBERSHIP_PLAN',
          entity: 'MEMBERSHIP',
          entityId: id,
          metadata: {
            planName: existingPlan.name,
            slug: existingPlan.slug,
            deletedAt: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // Don't fail the whole operation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Membership plan "${existingPlan.name}" has been deleted successfully.`
    })

  } catch (error) {
    console.error('Error deleting membership plan:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete membership plan',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
