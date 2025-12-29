const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const affiliate = await prisma.affiliateProfile.findFirst({
    where: { affiliateCode: 'abdurrahmanaziz' }
  });
  console.log('Using affiliate:', affiliate?.affiliateCode);

  const membership = await prisma.membership.findFirst({
    where: { isActive: true }
  });
  console.log('Using membership:', membership?.name);

  if (!affiliate || !membership) {
    console.log('Missing data');
    return;
  }

  const code = affiliate.affiliateCode + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const url = 'https://eksporyuk.com/checkout/' + membership.slug + '?ref=' + code;
  console.log('Generated URL:', url);

  try {
    const link = await prisma.affiliateLink.create({
      data: {
        code: code,
        fullUrl: url,
        clicks: 0,
        linkType: 'CHECKOUT',
        affiliateId: affiliate.id,
        membershipId: membership.id,
      }
    });
    console.log('SUCCESS! Created link:', link.id, link.code);
  } catch (err) {
    console.log('Error creating link:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
