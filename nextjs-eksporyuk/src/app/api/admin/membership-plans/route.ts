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

// GET - Fetch all membership plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        checkoutTemplate: true,
        description: true,
        duration: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
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
        updatedAt: true,
        userMemberships: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            createdAt: true,
            transaction: {
              select: {
                createdAt: true
              }
            }
          }
        },
        _count: {
          select: {
            userMemberships: true,
            membershipGroups: true,
            membershipCourses: true,
            membershipProducts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Sort plans by latest transaction date
    const sortedPlans = plans.sort((a, b) => {
      const aLatestTx = a.userMemberships[0]?.transaction?.createdAt
      const bLatestTx = b.userMemberships[0]?.transaction?.createdAt
      
      // If both have transactions, sort by latest transaction date
      if (aLatestTx && bLatestTx) {
        return new Date(bLatestTx).getTime() - new Date(aLatestTx).getTime()
      }
      
      // Plans with transactions come first
      if (aLatestTx && !bLatestTx) return -1
      if (!aLatestTx && bLatestTx) return 1
      
      // If neither has transactions, sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Parse features as prices for frontend
    const plansWithPrices = sortedPlans.map(plan => {
      let prices: any[] = []
      let benefits: any[] = []
      let featureTags: any[] = []
      
      if (plan.features) {
        try {
          let featuresData = plan.features
          
          // Parse if string
          if (typeof featuresData === 'string') {
            featuresData = JSON.parse(featuresData)
          }
          
          // New format: { tags: [], benefits: [] }
          if (featuresData && typeof featuresData === 'object' && !Array.isArray(featuresData) && 'benefits' in featuresData) {
            featureTags = Array.isArray(featuresData.tags) ? featuresData.tags : []
            benefits = Array.isArray(featuresData.benefits) ? featuresData.benefits : []
            
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
          // Check if array (old format)
          else if (Array.isArray(featuresData) && featuresData.length > 0) {
            const firstItem = featuresData[0]
            
            // Type A: Price objects
            if (firstItem && typeof firstItem === 'object' && 'price' in firstItem) {
              prices = featuresData
              benefits = (firstItem as any).benefits || []
            }
            // Type B: Benefit strings - build price from DB fields
            else if (typeof firstItem === 'string') {
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
          }
        } catch (e) {
          console.error('Error parsing features:', e)
        }
      }
      
      return {
        ...plan,
        prices,
        benefits,
        featureTags,
        features: [...featureTags, ...benefits], // Backward compatible flat array
        affiliateCommission: parseFloat(plan.affiliateCommissionRate?.toString() || '0.30'),
        salespage: plan.salesPageUrl || ''
      }
    })

    return NextResponse.json({ plans: plansWithPrices })

  } catch (error) {
    console.error('Error fetching membership plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new membership plan
export async function POST(request: NextRequest) {
  try {
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
      discount = 0,
      commissionType = 'PERCENTAGE',
      affiliateCommissionRate = 30,
      isBestSeller = false,
      isPopular = false,
      isActive = true,
      showInGeneralCheckout = true,
      salesPageUrl,
      features = [],
      membershipFeatures = [] // New: Feature access configurations
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama membership wajib diisi' },
        { status: 400 }
      )
    }

    if (!duration) {
      return NextResponse.json(
        { error: 'Durasi membership wajib dipilih' },
        { status: 400 }
      )
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Harga wajib diisi' },
        { status: 400 }
      )
    }

    // Generate slug from name
    let slug = generateSlug(name)
    
    // Check if slug already exists
    const existingPlan = await prisma.membership.findUnique({
      where: { slug }
    })

    if (existingPlan) {
      // Append random number if slug exists
      slug = `${slug}-${Date.now()}`
    }

    // Create membership plan
    const newPlan = await prisma.membership.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || '',
        duration,
        price,
        originalPrice: originalPrice || price,
        discount,
        commissionType,
        affiliateCommissionRate,
        isBestSeller,
        isPopular,
        isActive,
        showInGeneralCheckout,
        salesPageUrl: salesPageUrl?.trim() || null,
        features: features || []
      },
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

    // Create membership feature access records
    if (membershipFeatures && Array.isArray(membershipFeatures) && membershipFeatures.length > 0) {
      await prisma.membershipFeatureAccess.createMany({
        data: membershipFeatures.map((f: any) => ({
          membershipId: newPlan.id,
          featureKey: f.featureKey,
          enabled: f.enabled !== false,
          value: f.value || null
        }))
      })
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE_MEMBERSHIP_PLAN',
          entity: 'MEMBERSHIP',
          entityId: newPlan.id,
          metadata: {
            planName: newPlan.name,
            slug: newPlan.slug,
            duration: newPlan.duration
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json({
      message: 'Membership berhasil dibuat',
      plan: newPlan
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating membership plan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat membership' },
      { status: 500 }
    )
  }
}
