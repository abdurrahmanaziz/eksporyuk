import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find original plan with relations
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
    const baseSlug = generateSlug(duplicateName)

    // Find unique slug (both slug and checkoutSlug will be the same)
    let finalSlug = baseSlug
    let counter = 1
    while (
      await prisma.membership.findFirst({
        where: {
          OR: [
            { slug: finalSlug },
            { checkoutSlug: finalSlug }
          ]
        }
      })
    ) {
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    // Create the duplicate - only include non-null values
    // Prisma requires undefined (not null) for optional fields we want to skip
    const duplicatedPlan = await prisma.membership.create({
      data: {
        name: duplicateName,
        slug: finalSlug,
        checkoutSlug: finalSlug,
        checkoutTemplate: originalPlan.checkoutTemplate ?? 'modern',
        description: originalPlan.description,
        duration: originalPlan.duration,
        // Convert Decimal to number for proper handling
        price: Number(originalPlan.price),
        marketingPrice: originalPlan.marketingPrice ? Number(originalPlan.marketingPrice) : undefined,
        commissionType: originalPlan.commissionType,
        affiliateCommissionRate: Number(originalPlan.affiliateCommissionRate),
        features: originalPlan.features,
        // Reset flags for duplicate
        isBestSeller: false,
        isPopular: false,
        isMostPopular: false,
        isActive: false,
        status: 'DRAFT',
        // Optional fields - only include if not null
        salesPageUrl: originalPlan.salesPageUrl ?? undefined,
        alternativeUrl: originalPlan.alternativeUrl ?? undefined,
        reminders: originalPlan.reminders ?? undefined,
        formLogo: originalPlan.formLogo ?? undefined,
        formBanner: originalPlan.formBanner ?? undefined,
        formDescription: originalPlan.formDescription ?? undefined,
        mailketingListId: originalPlan.mailketingListId ?? undefined,
        mailketingListName: originalPlan.mailketingListName ?? undefined,
        autoAddToList: originalPlan.autoAddToList,
        autoRemoveOnExpire: originalPlan.autoRemoveOnExpire,
        showInGeneralCheckout: false,
        // Relations
        membershipGroups: originalPlan.membershipGroups.length > 0 ? {
          create: originalPlan.membershipGroups.map(mg => ({
            groupId: mg.groupId
          }))
        } : undefined,
        membershipCourses: originalPlan.membershipCourses.length > 0 ? {
          create: originalPlan.membershipCourses.map(mc => ({
            courseId: mc.courseId
          }))
        } : undefined,
        membershipProducts: originalPlan.membershipProducts.length > 0 ? {
          create: originalPlan.membershipProducts.map(mp => ({
            productId: mp.productId
          }))
        } : undefined,
      }
    })

    return NextResponse.json({
      message: 'Paket berhasil diduplikasi',
      plan: duplicatedPlan
    })
  } catch (error) {
    console.error('Error duplicating plan:', error)
    
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
