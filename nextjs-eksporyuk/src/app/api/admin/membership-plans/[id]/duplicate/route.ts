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
    
    console.log('Duplicate request - Session:', session?.user?.role)
    console.log('Duplicate request - Plan ID:', params.id)
    
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
      console.error('Plan not found:', id)
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    console.log('Original plan found:', originalPlan.name)

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

    console.log('Creating duplicate with data:', {
      name: duplicateName,
      slug: finalSlug,
      duration: originalPlan.duration,
      price: originalPlan.price.toString()
    })

    // Prepare the data object
    const createData: any = {
      name: duplicateName,
      slug: finalSlug,
      checkoutSlug: finalSlug,
      checkoutTemplate: originalPlan.checkoutTemplate || 'modern',
      description: originalPlan.description,
      duration: originalPlan.duration,
      price: originalPlan.price,
      marketingPrice: originalPlan.marketingPrice,
      commissionType: originalPlan.commissionType,
      affiliateCommissionRate: originalPlan.affiliateCommissionRate,
      features: originalPlan.features,
      isBestSeller: false,
      isPopular: false,
      isMostPopular: false,
      isActive: false,
      status: 'DRAFT',
      salesPageUrl: originalPlan.salesPageUrl,
      alternativeUrl: originalPlan.alternativeUrl,
      reminders: originalPlan.reminders,
      formLogo: originalPlan.formLogo,
      formBanner: originalPlan.formBanner,
      formDescription: originalPlan.formDescription,
      mailketingListId: originalPlan.mailketingListId,
      mailketingListName: originalPlan.mailketingListName,
      autoAddToList: originalPlan.autoAddToList,
      autoRemoveOnExpire: originalPlan.autoRemoveOnExpire,
      showInGeneralCheckout: false,
    }

    // Add relations only if they exist
    if (originalPlan.membershipGroups.length > 0) {
      createData.membershipGroups = {
        create: originalPlan.membershipGroups.map(mg => ({
          groupId: mg.groupId
        }))
      }
    }

    if (originalPlan.membershipCourses.length > 0) {
      createData.membershipCourses = {
        create: originalPlan.membershipCourses.map(mc => ({
          courseId: mc.courseId
        }))
      }
    }

    if (originalPlan.membershipProducts.length > 0) {
      createData.membershipProducts = {
        create: originalPlan.membershipProducts.map(mp => ({
          productId: mp.productId
        }))
      }
    }

    console.log('Final create data keys:', Object.keys(createData))

    const duplicatedPlan = await prisma.membership.create({
      data: createData
    })

    console.log('Duplicate created successfully:', duplicatedPlan.id)

    return NextResponse.json({
      message: 'Paket berhasil diduplikasi',
      plan: duplicatedPlan
    })
  } catch (error) {
    console.error('Error duplicating plan - Full error:', error)
    
    // More detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate plan'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error message:', errorMessage)
    console.error('Error stack:', errorStack)
    
    return NextResponse.json(
      { 
        error: 'Failed to duplicate plan',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
