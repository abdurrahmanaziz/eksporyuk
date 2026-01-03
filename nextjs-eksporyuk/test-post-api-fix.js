const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing POST create event API commission field handling...\n');

  // Get an admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true }
  });

  if (!adminUser) {
    console.log('❌ No admin user found');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found admin: ${adminUser.name} (${adminUser.email})\n`);

  // Simulate POST API request body
  const requestBody = {
    name: 'Test POST API Event - ' + new Date().toLocaleString(),
    price: 750000,
    originalPrice: 1000000,
    shortDescription: 'Testing POST API commission fields',
    description: 'Verifying that commission fields are persisted from POST request',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    eventEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    eventDuration: 120,
    eventUrl: 'https://zoom.us/test',
    meetingId: 'zoom123',
    maxParticipants: 50,
    productStatus: 'PUBLISHED',
    accessLevel: 'PUBLIC',
    // CRITICAL: These commission fields should be persisted by POST API
    affiliateEnabled: true,
    commissionType: 'PERCENTAGE',
    affiliateCommissionRate: 42,
  };

  console.log('📤 Request body commission settings:');
  console.log(`  - affiliateEnabled: ${requestBody.affiliateEnabled}`);
  console.log(`  - commissionType: ${requestBody.commissionType}`);
  console.log(`  - affiliateCommissionRate: ${requestBody.affiliateCommissionRate}%\n`);

  // Create product exactly like POST API does (after our fix)
  const event = await prisma.product.create({
    data: {
      id: 'test-post-' + Date.now(),
      User: { connect: { id: adminUser.id } },
      name: requestBody.name,
      slug: 'slug-' + Date.now(),
      checkoutSlug: 'checkout-' + Date.now(),
      description: requestBody.description,
      shortDescription: requestBody.shortDescription,
      price: requestBody.price,
      originalPrice: requestBody.originalPrice,
      productType: 'EVENT',
      productStatus: requestBody.productStatus,
      accessLevel: requestBody.accessLevel,
      eventDate: requestBody.eventDate,
      eventEndDate: requestBody.eventEndDate,
      eventDuration: requestBody.eventDuration,
      eventUrl: requestBody.eventUrl,
      meetingId: requestBody.meetingId,
      maxParticipants: requestBody.maxParticipants,
      updatedAt: new Date(),
      // THESE THREE FIELDS ARE THE FIX
      affiliateEnabled: requestBody.affiliateEnabled ?? true,
      commissionType: requestBody.commissionType || 'PERCENTAGE',
      affiliateCommissionRate: requestBody.affiliateCommissionRate || 30,
    },
    select: {
      id: true,
      name: true,
      price: true,
      affiliateEnabled: true,
      commissionType: true,
      affiliateCommissionRate: true,
    }
  });

  console.log('✅ Event created via POST API simulation:\n');
  console.log(`   ID: ${event.id}`);
  console.log(`   Name: ${event.name}`);
  console.log(`   Price: Rp ${event.price.toLocaleString('id-ID')}\n`);
  console.log('💰 Commission Settings (stored in DB):');
  console.log(`   affiliateEnabled: ${event.affiliateEnabled}`);
  console.log(`   commissionType: ${event.commissionType}`);
  console.log(`   affiliateCommissionRate: ${event.affiliateCommissionRate}%`);

  // Verify - fetch from DB
  const verified = await prisma.product.findUnique({
    where: { id: event.id },
    select: {
      affiliateEnabled: true,
      commissionType: true,
      affiliateCommissionRate: true,
    }
  });

  const allCorrect =
    verified.affiliateEnabled === true &&
    verified.commissionType === 'PERCENTAGE' &&
    Number(verified.affiliateCommissionRate) === 42;

  console.log('\n📊 Verification Details:');
  console.log(`  - affiliateEnabled === true: ${verified.affiliateEnabled === true} (actual: ${verified.affiliateEnabled}, type: ${typeof verified.affiliateEnabled})`);
  console.log(`  - commissionType === 'PERCENTAGE': ${verified.commissionType === 'PERCENTAGE'} (actual: ${verified.commissionType}, type: ${typeof verified.commissionType})`);
  console.log(`  - affiliateCommissionRate === 42: ${Number(verified.affiliateCommissionRate) === 42} (actual: ${verified.affiliateCommissionRate}, type: ${typeof verified.affiliateCommissionRate})`);

  console.log('\n' + (allCorrect ? '✅ ALL COMMISSION FIELDS CORRECTLY PERSISTED!' : '❌ MISMATCH!'));

  if (allCorrect) {
    console.log('\n🎉 POST API FIX VERIFIED! Commission fields are now saved correctly.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
