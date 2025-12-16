import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    const plan = await prisma.membership.findUnique({
      where: { id: id },
      include: {
        membershipFeatures: true,
        membershipGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        membershipCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        membershipProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            userMemberships: true
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
    }

    // Parse features - handle flat array format
    let prices: any[] = []
    let benefits: string[] = []
    
    if (plan.features) {
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
            discount: plan.discount || 0,
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

    // Check if plan exists
    const existingPlan = await prisma.membership.findUnique({
      where: { id: id }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Membership plan tidak ditemukan' }, { status: 404 })
    }

    // Build update data - only include fields that exist in schema
    const updateData: any = {}

    if (name !== undefined && name.trim()) {
      updateData.name = name.trim()
      
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
      }
    }

    if (description !== undefined) updateData.description = description?.trim() || ''
    
    // Handle duration - only update if it's a valid enum value
    if (duration !== undefined) {
      const validDurations = ['SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME']
      if (validDurations.includes(duration)) {
        updateData.duration = duration
      }
      // Ignore numeric duration values (from legacy UI) - they're not compatible with enum
    }
    
    if (price !== undefined) updateData.price = price
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice
    if (discount !== undefined) updateData.discount = discount
    if (affiliateCommissionRate !== undefined) updateData.affiliateCommissionRate = affiliateCommissionRate
    if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller
    if (isPopular !== undefined) updateData.isPopular = isPopular
    if (isActive !== undefined) updateData.isActive = isActive
    if (status !== undefined) updateData.status = status
    if (salesPageUrl !== undefined) updateData.salesPageUrl = salesPageUrl?.trim() || null
    if (features !== undefined) updateData.features = features
    if (formLogo !== undefined) updateData.formLogo = formLogo || null
    if (formBanner !== undefined) updateData.formBanner = formBanner || null
    if (showInGeneralCheckout !== undefined) updateData.showInGeneralCheckout = showInGeneralCheckout

    // Update membership plan
    const updatedPlan = await prisma.membership.update({
      where: { id: id },
      data: updateData,
      include: {
        _count: {
          select: {
            userMemberships: true,
            membershipGroups: true,
            membershipCourses: true,
            membershipProducts: true
          }
        }
      }
    })

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
              membershipId: id,
              featureKey: f,
              enabled: true,
              value: null
            }
          }
          // If object, use as is
          return {
            membershipId: id,
            featureKey: f.featureKey,
            enabled: f.enabled !== false,
            value: f.value || null
          }
        })
        
        await prisma.membershipFeatureAccess.createMany({
          data: featureData
        })
      }
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
            membershipId: id,
            groupId: groupId
          }))
        })
      }
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
            membershipId: id,
            courseId: courseId
          }))
        })
      }
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
            membershipId: id,
            productId: productId
          }))
        })
      }
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
            updatedFields: Object.keys(updateData)
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json({
      message: 'Membership berhasil diperbarui',
      plan: updatedPlan
    })

  } catch (error) {
    console.error('Error updating membership plan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui membership' },
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
