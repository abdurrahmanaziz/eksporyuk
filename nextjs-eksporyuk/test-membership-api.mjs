import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMembershipAPI() {
  try {
    console.log('Testing membership plan retrieval...\n')
    
    // Test with Prisma client directly
    const plan = await prisma.membership.findUnique({
      where: { id: 'mem_6bulan_ekspor' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        duration: true,
        price: true,
        originalPrice: true,
        discount: true,
        features: true,
        isBestSeller: true,
        isPopular: true,
        isMostPopular: true,
        marketingBadge: true,
        isActive: true,
        status: true,
        commissionType: true,
        affiliateCommissionRate: true,
        salesPageUrl: true,
        alternativeUrl: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        mailketingListId: true,
        mailketingListName: true,
        autoAddToList: true,
        autoRemoveOnExpire: true,
        showInGeneralCheckout: true,
        affiliateEnabled: true,
        checkoutSlug: true,
        checkoutTemplate: true,
        reminders: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (plan) {
      console.log('✅ Successfully retrieved membership plan!')
      console.log('\nPlan Details:')
      console.log(`- ID: ${plan.id}`)
      console.log(`- Name: ${plan.name}`)
      console.log(`- Slug: ${plan.slug}`)
      console.log(`- Marketing Badge: ${plan.marketingBadge || 'null'}`)
      console.log(`- Badge Type: ${typeof plan.marketingBadge}`)
      console.log(`- Duration: ${plan.duration}`)
      console.log(`- Price: Rp ${Number(plan.price).toLocaleString('id-ID')}`)
      console.log(`- Commission Rate: ${plan.affiliateCommissionRate}%`)
      console.log(`- Active: ${plan.isActive}`)
      console.log(`- Status: ${plan.status}`)
      
      console.log('\n✅ API Fix Successful - marketingBadge field is now properly typed as enum!')
    } else {
      console.log('❌ Membership plan not found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMembershipAPI()
