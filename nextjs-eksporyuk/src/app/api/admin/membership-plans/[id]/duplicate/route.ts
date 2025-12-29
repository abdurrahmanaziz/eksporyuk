import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

const createId = () => randomBytes(16).toString('hex')

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

    // Find original plan (no includes - relations not defined in schema)
    const originalPlan = await prisma.membership.findUnique({
      where: { id }
    })

    if (!originalPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Fetch related data manually via junction tables
    const [membershipCourses, membershipGroups, membershipProducts] = await Promise.all([
      prisma.membershipCourse.findMany({
        where: { membershipId: id }
      }),
      prisma.membershipGroup.findMany({
        where: { membershipId: id }
      }),
      prisma.membershipProduct.findMany({
        where: { membershipId: id }
      })
    ])

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
        id: createId(),
        name: duplicateName,
        slug: finalSlug,
        checkoutSlug: finalSlug,
        checkoutTemplate: originalPlan.checkoutTemplate ?? 'modern',
        description: originalPlan.description,
        duration: originalPlan.duration,
        // Convert Decimal to number for proper handling
        price: Number(originalPlan.price),
        originalPrice: originalPlan.originalPrice ? Number(originalPlan.originalPrice) : undefined,
        marketingBadge: originalPlan.marketingBadge ?? undefined,
        discount: originalPlan.discount ?? 0,
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
        updatedAt: new Date(),
      }
    })

    // Create relations separately via junction tables
    if (membershipGroups.length > 0) {
      await prisma.membershipGroup.createMany({
        data: membershipGroups.map(mg => ({
          id: createId(),
          membershipId: duplicatedPlan.id,
          groupId: mg.groupId,
          createdAt: new Date()
        }))
      })
    }

    if (membershipCourses.length > 0) {
      await prisma.membershipCourse.createMany({
        data: membershipCourses.map(mc => ({
          id: createId(),
          membershipId: duplicatedPlan.id,
          courseId: mc.courseId,
          createdAt: new Date()
        }))
      })
    }

    if (membershipProducts.length > 0) {
      await prisma.membershipProduct.createMany({
        data: membershipProducts.map(mp => ({
          id: createId(),
          membershipId: duplicatedPlan.id,
          productId: mp.productId,
          createdAt: new Date()
        }))
      })
    }

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
