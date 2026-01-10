const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRedirect() {
  try {
    // Find affiliate link with shortCode 3BEC0Z
    const link = await prisma.affiliateLink.findFirst({
      where: {
        shortCode: '3BEC0Z',
        isActive: true,
        isArchived: false,
      },
      include: {
        membership: {
          select: {
            id: true,
            name: true,
            slug: true,
            externalSalesUrl: true,
            alternativeUrl: true,
          }
        },
        product: {
          select: {
            id: true,
            externalSalesUrl: true,
          }
        }
      }
    });

    if (!link) {
      console.log('❌ Link tidak ditemukan dengan shortCode 3BEC0Z');
      return;
    }

    console.log('✅ Link ditemukan:');
    console.log('Code:', link.code);
    console.log('ShortCode:', link.shortCode);
    console.log('MembershipId:', link.membershipId);
    console.log('ProductId:', link.productId);
    console.log('CouponCode:', link.couponCode);
    console.log('ExpiresAt:', link.expiresAt);
    console.log('IsActive:', link.isActive);
    console.log('IsArchived:', link.isArchived);

    if (link.membership) {
      console.log('\n📦 Membership Info:');
      console.log('Name:', link.membership.name);
      console.log('Slug:', link.membership.slug);
      console.log('ExternalSalesUrl:', link.membership.externalSalesUrl);
      console.log('AlternativeUrl:', link.membership.alternativeUrl);

      // Simulate redirect logic
      console.log('\n🔄 Redirect Logic untuk /go/3BEC0Z/checkout:');
      const baseUrl = 'http://localhost:3000';
      const type = 'checkout';

      if (type === 'checkout') {
        let redirectUrl = `${baseUrl}/checkout-unified?ref=${link.code}`;
        if (link.membershipId && link.membership) {
          const packageIdentifier = link.membership.slug || link.membershipId;
          redirectUrl += `&package=${packageIdentifier}`;
        }
        console.log('Redirect URL:', redirectUrl);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRedirect();
