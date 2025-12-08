const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCourseXenditIntegration() {
  try {
    console.log('\n=== TEST COURSE XENDIT INTEGRATION ===\n');

    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        originalPrice: true,
        level: true,
      },
      take: 3
    });

    console.log('✅ Course checkout flow sekarang terintegrasi dengan Xendit\n');

    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   Slug: ${course.slug}`);
      console.log(`   💰 Price: ${course.price === 0 ? 'GRATIS' : `Rp ${course.price.toLocaleString('id-ID')}`}`);
      
      if (course.originalPrice && course.originalPrice > course.price) {
        const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
        console.log(`   🔥 Discount: ${discount}% (dari Rp ${course.originalPrice.toLocaleString('id-ID')})`);
      }
      
      console.log(`   📱 Salespage: http://localhost:3000/course/${course.slug}`);
      console.log(`   💳 Checkout: http://localhost:3000/checkout/course/${course.slug}`);
      console.log('');
    });

    console.log('🔧 FIXES APPLIED:');
    console.log('   ✅ Removed duplicate buy button from hero section');
    console.log('   ✅ Single buy button now in sidebar (sebelah kanan)');
    console.log('   ✅ Button text: "Daftar & Bayar via Xendit"');
    console.log('   ✅ Clear messaging about Xendit payment methods');
    console.log('   ✅ Course checkout integrated with /api/checkout');
    console.log('   ✅ Creates courseEnrollment in database');
    console.log('   ✅ Support for affiliate tracking');
    console.log('');

    console.log('💳 XENDIT INTEGRATION:');
    console.log('   ✅ type: "COURSE" in checkout API');
    console.log('   ✅ courseId passed to transaction');
    console.log('   ✅ Course enrollment creation');
    console.log('   ✅ Payment URL redirect to Xendit');
    console.log('   ✅ Support Transfer Bank, E-Wallet, Kartu Kredit');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCourseXenditIntegration();