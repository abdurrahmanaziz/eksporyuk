const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding event with commission settings...\n');

  // Get an admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, name: true }
  });

  if (!adminUser) {
    console.log('❌ No admin user found. Please create one first.');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found admin: ${adminUser.name} (${adminUser.id})\n`);

  // Create event with commission settings
  const event = await prisma.product.create({
    data: {
      id: 'evt-' + Date.now(),
      User: { connect: { id: adminUser.id } },
      name: 'Test Event with Commission - ' + new Date().toISOString().split('T')[0],
      slug: 'test-event-commission-' + Date.now(),
      checkoutSlug: 'checkout-test-event-' + Date.now(),
      description: 'Test event to verify commission fields are saved correctly',
      shortDescription: 'Testing commission functionality',
      price: 500000,
      originalPrice: 750000,
      productType: 'EVENT',
      productStatus: 'PUBLISHED',
      accessLevel: 'PUBLIC',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      eventEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
      eventDuration: 120,
      eventVisibility: 'PUBLIC',
      eventUrl: 'https://zoom.us/j/test123456',
      meetingId: 'test123456',
      meetingPassword: 'password123',
      maxParticipants: 100,
      seoMetaTitle: 'Test Event with Commission',
      seoMetaDescription: 'Testing commission field persistence',
      ctaButtonText: 'Daftar Sekarang',
      updatedAt: new Date(),
      // IMPORTANT: These are the fields we just fixed
      affiliateEnabled: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 35,
    },
    select: {
      id: true,
      name: true,
      affiliateEnabled: true,
      commissionType: true,
      affiliateCommissionRate: true,
      eventDate: true,
      price: true,
    }
  });

  console.log('✅ Event created successfully:\n');
  console.log(`   ID: ${event.id}`);
  console.log(`   Name: ${event.name}`);
  console.log(`   Price: Rp ${event.price.toLocaleString('id-ID')}`);
  console.log(`   Date: ${event.eventDate.toLocaleDateString('id-ID')}`);
  console.log('\n💰 Commission Settings:');
  console.log(`   affiliateEnabled: ${event.affiliateEnabled}`);
  console.log(`   commissionType: ${event.commissionType}`);
  console.log(`   affiliateCommissionRate: ${event.affiliateCommissionRate}%`);

  // Verify by fetching
  const verification = await prisma.product.findUnique({
    where: { id: event.id },
    select: {
      id: true,
      name: true,
      affiliateEnabled: true,
      commissionType: true,
      affiliateCommissionRate: true,
    }
  });

  console.log('\n✅ Verification (refetched from DB):');
  console.log(`   affiliateEnabled: ${verification.affiliateEnabled}`);
  console.log(`   commissionType: ${verification.commissionType}`);
  console.log(`   affiliateCommissionRate: ${verification.affiliateCommissionRate}%`);

  const allCorrect =
    verification.affiliateEnabled === true &&
    verification.commissionType === 'PERCENTAGE' &&
    verification.affiliateCommissionRate === 35;

  console.log('\n' + (allCorrect ? '✅ ALL COMMISSION FIELDS SAVED CORRECTLY!' : '❌ SOME FIELDS MISSING'));

  console.log('\n🎯 Next steps:');
  console.log(`   1. Go to: /admin/events/${event.id}/edit`);
  console.log('   2. Check Settings tab - commission values should be there');
  console.log('   3. Test reminder creation');
  console.log('   4. Test RSVP registration\n');

  await prisma.$disconnect();
}

main().catch(console.error);
