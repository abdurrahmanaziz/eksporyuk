import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/memberships/packages/[id] - Get single membership
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const membership = await prisma.membership.findUnique({
      where: { id },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error fetching membership:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    )
  }
}

// PATCH /api/memberships/packages/[id] - Update membership (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      slug,
      checkoutSlug,
      checkoutTemplate,
      description,
      duration,
      price,
      originalPrice,
      discount,
      features,
      isBestSeller,
      salesPageUrl,
      alternativeUrl,
      isActive,
      productIds, // Array of product IDs
      groupIds, // Array of group IDs
      courseIds, // Array of course IDs
      commissionType,
      affiliateCommissionRate,
      formLogo,
      formBanner,
      formDescription,
    } = body

    // Update membership
    const membership = await prisma.membership.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug: slug || null }),
        ...(checkoutSlug !== undefined && { checkoutSlug: checkoutSlug || null }),
        ...(checkoutTemplate !== undefined && { checkoutTemplate: checkoutTemplate || 'modern' }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(price !== undefined && { price }),
        ...(originalPrice !== undefined && { originalPrice }),
        ...(discount !== undefined && { discount }),
        ...(features !== undefined && { features }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(salesPageUrl !== undefined && { salesPageUrl: salesPageUrl || null }),
        ...(alternativeUrl !== undefined && { alternativeUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(commissionType !== undefined && { commissionType }),
        ...(affiliateCommissionRate !== undefined && { affiliateCommissionRate }),
        ...(formLogo !== undefined && { formLogo }),
        ...(formBanner !== undefined && { formBanner }),
        ...(formDescription !== undefined && { formDescription }),
      },
    })

    // Update membership-product relations if productIds provided
    if (productIds && Array.isArray(productIds)) {
      await prisma.membershipProduct.deleteMany({
        where: { membershipId: id },
      })

      if (productIds.length > 0) {
        await prisma.membershipProduct.createMany({
          data: productIds.map((productId: string) => ({
            membershipId: id,
            productId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Update membership-group relations if groupIds provided
    if (groupIds && Array.isArray(groupIds)) {
      await prisma.membershipGroup.deleteMany({
        where: { membershipId: id },
      })

      if (groupIds.length > 0) {
        await prisma.membershipGroup.createMany({
          data: groupIds.map((groupId: string) => ({
            membershipId: id,
            groupId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Update membership-course relations if courseIds provided
    if (courseIds && Array.isArray(courseIds)) {
      await prisma.membershipCourse.deleteMany({
        where: { membershipId: id },
      })

      if (courseIds.length > 0) {
        await prisma.membershipCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            membershipId: id,
            courseId,
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error updating membership:', error)
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    )
  }
}

// DELETE /api/memberships/packages/[id] - Delete membership (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve params properly
    let id: string
    try {
      const resolvedParams = await params
      id = resolvedParams?.id
      if (!id) {
        return NextResponse.json(
          { error: 'Missing membership ID' },
          { status: 400 }
        )
      }
    } catch (e) {
      console.error('Error resolving params:', e)
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    console.log('Attempting to delete membership:', id)

    // Delete all related records - order matters due to foreign keys
    let deletedProducts = 0, deletedGroups = 0, deletedCourses = 0, deletedAffLinks = 0
    
    try {
      const result = await prisma.membershipProduct.deleteMany({
        where: { membershipId: id },
      })
      deletedProducts = result.count
      console.log(`Deleted ${deletedProducts} membershipProduct records`)
    } catch (e) {
      console.warn('Error deleting membershipProduct:', e)
    }

    try {
      const result = await prisma.membershipGroup.deleteMany({
        where: { membershipId: id },
      })
      deletedGroups = result.count
      console.log(`Deleted ${deletedGroups} membershipGroup records`)
    } catch (e) {
      console.warn('Error deleting membershipGroup:', e)
    }

    try {
      const result = await prisma.membershipCourse.deleteMany({
        where: { membershipId: id },
      })
      deletedCourses = result.count
      console.log(`Deleted ${deletedCourses} membershipCourse records`)
    } catch (e) {
      console.warn('Error deleting membershipCourse:', e)
    }

    // Try to delete affiliate links if they exist
    try {
      const result = await prisma.affiliateLink.deleteMany({
        where: { membershipId: id },
      })
      deletedAffLinks = result.count
      console.log(`Deleted ${deletedAffLinks} affiliateLink records`)
    } catch (e) {
      console.warn('Error deleting affiliateLink:', e)
    }

    // Delete the membership itself
    let deletedMembership = null
    try {
      deletedMembership = await prisma.membership.delete({
        where: { id },
      })
      console.log('Membership deleted successfully:', id)
    } catch (deleteError) {
      console.error('Error deleting membership record:', deleteError)
      
      // If hard delete fails, fallback to soft delete
      console.log('Falling back to soft delete...')
      const updated = await prisma.membership.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        success: true,
        method: 'soft_delete',
        message: 'Membership marked as inactive instead of deleted',
        id: updated.id,
      })
    }

    return NextResponse.json({
      success: true,
      method: 'hard_delete',
      message: 'Membership deleted successfully',
      stats: {
        deletedProducts,
        deletedGroups,
        deletedCourses,
        deletedAffLinks,
      },
      id,
    })
  } catch (error) {
    console.error('Fatal error in DELETE handler:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete membership',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
