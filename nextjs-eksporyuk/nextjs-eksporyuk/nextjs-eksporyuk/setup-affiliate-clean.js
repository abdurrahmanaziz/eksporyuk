const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Helper: Generate random 6-char code
function generateCode(prefix = '') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function setupAffiliateLinks() {
  console.log('Setting up affiliate links with clean slug format...\n');

  try {
    // Get all active memberships
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
    });

    console.log(`Found ${memberships.length} active memberships\n`);

    for (const membership of memberships) {
      // Generate affiliate link
      const affiliateCode = generateCode();
      const shortCode = crypto.randomBytes(3).toString('hex').toUpperCase();

      const link = await prisma.affiliateLink.upsert({
        where: { code: affiliateCode },
        update: {},
        create: {
          code: affiliateCode,
          shortCode: shortCode,
          membershipId: membership.id,
          linkType: 'CHECKOUT',
          couponCode: null, // Clean - no coupon
          isActive: true,
        },
      });

      const cleanUrl = `https://eksporyuk.com/membership/${membership.slug}/`;

      console.log(`✅ Membership: ${membership.name}`);
      console.log(`   Slug: ${membership.slug}`);
      console.log(`   Code: ${affiliateCode}`);
      console.log(`   Short: ${shortCode}`);
      console.log(`   URL: ${cleanUrl}`);
      console.log(`   Status: Created\n`);
    }

    console.log('='.repeat(80));
    console.log('✅ Setup complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAffiliateLinks();
