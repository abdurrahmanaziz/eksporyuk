import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    console.log(`[API] Fetching membership with slug: ${slug}`)
    
    const plan = await prisma.membership.findUnique({
      where: { 
        slug: slug
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        formLogo: true,
        formBanner: true,
        features: true, // Can be prices array OR benefits array
        price: true, // Base price
        originalPrice: true, // Original price
        discount: true, // Discount percentage
        duration: true, // Duration enum
        salesPageUrl: true,
        affiliateCommissionRate: true,
        isActive: true,
        status: true, // DRAFT, PUBLISHED, ARCHIVED
        reminders: true, // Contains followUpMessages
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

    console.log(`[API] Plan found:`, plan ? 'YES' : 'NO')

    if (!plan) {
      console.log(`[API] Error: Plan not found for slug: ${slug}`)
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    // Check if plan is active
    if (!plan.isActive) {
      console.log(`[API] Error: Plan is not active: ${slug}`)
      return NextResponse.json(
        { error: 'Membership plan is not active' },
        { status: 403 }
      )
    }

    // Check if plan status is PUBLISHED (required for public checkout)
    if (plan.status !== 'PUBLISHED') {
      console.log(`[API] Error: Plan status is not PUBLISHED: ${slug}, status: ${plan.status}`)
      return NextResponse.json(
        { error: `Membership plan is ${plan.status === 'DRAFT' ? 'still in draft' : 'archived'}` },
        { status: 403 }
      )
    }

    // Parse JSON fields safely
    let prices = []
    let benefits = []
    let followUpMessages = []
    
    console.log('[API] Features type:', typeof plan.features)
    console.log('[API] Features value:', JSON.stringify(plan.features).substring(0, 200))
    
    try {
      let featuresData = plan.features
      
      // Handle different features structures
      if (typeof featuresData === 'string') {
        console.log('[API] Parsing features as string')
        featuresData = JSON.parse(featuresData)
      }
      
      if (Array.isArray(featuresData)) {
        console.log('[API] Features is an array with', featuresData.length, 'items')
        
        // EMPTY ARRAY = General Checkout Page (show all membership options)
        if (featuresData.length === 0) {
          console.log('[API] Empty features array - this is a GENERAL CHECKOUT PAGE')
          console.log('[API] Fetching ALL active membership plans as options...')
          
          // Fetch all active memberships as price options
          const allMemberships = await prisma.membership.findMany({
            where: {
              isActive: true,
              slug: { not: slug } // Exclude current (pro) from list
            },
            select: {
              id: true,
              name: true,
              slug: true,
              checkoutSlug: true,
              price: true,
              originalPrice: true,
              discount: true,
              duration: true,
              features: true,
              isBestSeller: true,
              isPopular: true,
              isMostPopular: true
            },
            orderBy: [
              { isMostPopular: 'desc' },
              { isPopular: 'desc' },
              { price: 'asc' }
            ]
          })
          
          console.log(`[API] Found ${allMemberships.length} active memberships`)
          
          // Convert each membership to price option format
          prices = allMemberships.map(m => {
            const basePrice = parseFloat(m.price?.toString() || '0')
            const originalPrice = parseFloat(m.originalPrice?.toString() || basePrice.toString())
            
            // Parse benefits from features if it's a string array
            let membershipBenefits: string[] = []
            try {
              let membershipFeatures = m.features
              if (typeof membershipFeatures === 'string') {
                membershipFeatures = JSON.parse(membershipFeatures)
              }
              if (Array.isArray(membershipFeatures)) {
                // If array of strings, use as benefits
                if (membershipFeatures.length > 0 && typeof membershipFeatures[0] === 'string') {
                  membershipBenefits = membershipFeatures
                }
                // If array of price objects with benefits
                else if (membershipFeatures.length > 0 && typeof membershipFeatures[0] === 'object' && membershipFeatures[0].benefits) {
                  membershipBenefits = membershipFeatures[0].benefits
                }
              }
            } catch (e) {
              console.log(`[API] Error parsing benefits for ${m.slug}:`, e)
            }
            
            return {
              duration: m.duration || 'ONE_MONTH',
              label: m.name,
              price: basePrice,
              originalPrice: originalPrice,
              discount: m.discount || 0,
              benefits: membershipBenefits,
              badge: m.isBestSeller ? '🔥 Best Seller' : m.isMostPopular ? '⭐ Most Popular' : '',
              isPopular: m.isPopular || m.isMostPopular || m.isBestSeller,
              membershipId: m.id, // Important: pass membership ID for checkout
              membershipSlug: m.checkoutSlug || m.slug // Use checkoutSlug or slug
            }
          })
          
          console.log('[API] Converted to', prices.length, 'price options')
          benefits = [] // No general benefits for multi-option page
        }
        // Check if array contains price objects or benefit strings
        else if (featuresData.length > 0) {
          const firstItem = featuresData[0]
          
          if (typeof firstItem === 'object' && firstItem !== null && 'price' in firstItem) {
            // Features is array of price options (like paket-lifetime)
            console.log('[API] Features contains price objects')
            prices = featuresData
            benefits = firstItem.benefits || []
          } else if (typeof firstItem === 'string') {
            // Features is array of benefit strings (like paket-1-bulan)
            console.log('[API] Features contains benefit strings')
            benefits = featuresData
            
            // Build price from database fields
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
              isPopular: false
            }]
            
            console.log('[API] Built price object from database:', prices[0])
          }
        }
      } else if (featuresData && typeof featuresData === 'object') {
        console.log('[API] Features is an object')
        // If it's an object with prices property
        if ('prices' in featuresData) {
          prices = featuresData.prices
          benefits = featuresData.benefits || []
        } else if ('price' in featuresData) {
          // Single price object
          prices = [featuresData]
          benefits = featuresData.benefits || []
        } else {
          // Fallback: build from database fields
          const basePrice = parseFloat(plan.price?.toString() || '0')
          const originalPrice = parseFloat(plan.originalPrice?.toString() || basePrice.toString())
          
          prices = [{
            duration: plan.duration || 'ONE_MONTH',
            label: plan.name,
            price: basePrice,
            originalPrice: originalPrice,
            discount: plan.discount || 0,
            benefits: [],
            badge: '',
            isPopular: false
          }]
        }
      } else {
        console.log('[API] No features found, building from database fields')
        // Fallback: build from database fields
        const basePrice = parseFloat(plan.price?.toString() || '0')
        const originalPrice = parseFloat(plan.originalPrice?.toString() || basePrice.toString())
        
        prices = [{
          duration: plan.duration || 'ONE_MONTH',
          label: plan.name,
          price: basePrice,
          originalPrice: originalPrice,
          discount: plan.discount || 0,
          benefits: [],
          badge: '',
          isPopular: false
        }]
      }
      
      console.log('[API] Final parsed prices count:', prices.length)
      console.log('[API] Final benefits count:', benefits.length)
    } catch (e) {
      console.error('[API] Error parsing features:', e)
      
      // Fallback: build from database fields
      const basePrice = parseFloat(plan.price?.toString() || '0')
      const originalPrice = parseFloat(plan.originalPrice?.toString() || basePrice.toString())
      
      prices = [{
        duration: plan.duration || 'ONE_MONTH',
        label: plan.name,
        price: basePrice,
        originalPrice: originalPrice,
        discount: plan.discount || 0,
        benefits: [],
        badge: '',
        isPopular: false
      }]
    }

    try {
      // Reminders might be already parsed or need parsing
      if (typeof plan.reminders === 'string') {
        followUpMessages = JSON.parse(plan.reminders)
      } else if (Array.isArray(plan.reminders)) {
        followUpMessages = plan.reminders
      }
    } catch (e) {
      console.error('Error parsing reminders:', e)
      followUpMessages = []
    }

    return NextResponse.json({
      plan: {
        ...plan,
        prices,
        benefits, // Add benefits separately
        followUpMessages,
        affiliateCommission: parseFloat(plan.affiliateCommissionRate?.toString() || '0')
      }
    })
  } catch (error: any) {
    console.error('[API] ERROR fetching membership plan:', error)
    console.error('[API] Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch membership plan',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
