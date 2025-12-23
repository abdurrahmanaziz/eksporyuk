import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// POST - Duplicate membership plan
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Find original plan
    const originalPlan = await prisma.membership.findUnique({
      where: { id },
      include: {
        membershipGroups: true,
        membershipCourses: true,
        membershipProducts: true,
      }
    })

    if (!originalPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Create duplicate with modified name
    const duplicateName = `${originalPlan.name} (Copy)`
    const duplicateSlug = generateSlug(duplicateName)

    // Check if slug already exists and make it unique
    let finalSlug = duplicateSlug
    let counter = 1
    while (await prisma.membership.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${duplicateSlug}-${counter}`
      counter++
    }

    const duplicatedPlan = await prisma.membership.create({
      data: {
        name: duplicateName,
        slug: finalSlug,
        checkoutSlug: finalSlug, // Same as slug for checkout
        checkoutTemplate: originalPlan.checkoutTemplate || 'modern',
        description: originalPlan.description || '',
        duration: originalPlan.duration,
        price: originalPlan.price,
        marketingPrice: originalPlan.marketingPrice,
        commissionType: originalPlan.commissionType || 'PERCENTAGE',
        affiliateCommissionRate: originalPlan.affiliateCommissionRate || 30,
        features: originalPlan.features || [],
        isBestSeller: false, // Reset badges
        isPopular: false,
        isMostPopular: false,
        isActive: false, // Set as inactive by default
        status: 'DRAFT', // Set as draft
        salesPageUrl: originalPlan.salesPageUrl,
        alternativeUrl: originalPlan.alternativeUrl,
        reminders: originalPlan.reminders,
        formLogo: originalPlan.formLogo,
        formBanner: originalPlan.formBanner,
        formDescription: originalPlan.formDescription,
        mailketingListId: originalPlan.mailketingListId,
        mailketingListName: originalPlan.mailketingListName,
        autoAddToList: originalPlan.autoAddToList ?? true,
        autoRemoveOnExpire: originalPlan.autoRemoveOnExpire ?? false,
        showInGeneralCheckout: false, // Don't show in general checkout by default
        
        // Copy relations only if they exist
        ...(originalPlan.membershipGroups.length > 0 && {
          membershipGroups: {
            create: originalPlan.membershipGroups.map(mg => ({
              groupId: mg.groupId
            }))
          }
        }),
        ...(originalPlan.membershipCourses.length > 0 && {
          membershipCourses: {
            create: originalPlan.membershipCourses.map(mc => ({
              courseId: mc.courseId
            }))
          }
        }),
        ...(originalPlan.membershipProducts.length > 0 && {
          membershipProducts: {
            create: originalPlan.membershipProducts.map(mp => ({
              productId: mp.productId
            }))
          }
        })
      }
    })

    return NextResponse.json({
      message: 'Paket berhasil diduplikasi',
      plan: duplicatedPlan
    })
  } catch (error) {
    console.error('Error duplicating plan:', error)
    
    // More detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate plan'
    
    return NextResponse.json(
      { 
        error: 'Failed to duplicate plan',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}
