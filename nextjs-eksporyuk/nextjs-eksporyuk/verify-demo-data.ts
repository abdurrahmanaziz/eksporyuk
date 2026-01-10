import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying Affiliate Demo Data...\n');

  // Check Memberships
  console.log('📋 MEMBERSHIPS:');
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      duration: true,
      isActive: true,
    }
  });
  
  memberships.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name}`);
    console.log(`      Slug: ${m.slug}`);
    console.log(`      Price: Rp ${Number(m.price).toLocaleString('id-ID')}`);
    console.log(`      Duration: ${m.duration}`);
    console.log(`      Active: ${m.isActive ? '✅' : '❌'}\n`);
  });

  // Check Products
  console.log('📦 PRODUCTS:');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      productStatus: true,
    }
  });
  
  products.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name}`);
    console.log(`      Slug: ${p.slug}`);
    console.log(`      Price: Rp ${Number(p.price).toLocaleString('id-ID')}`);
    console.log(`      Status: ${p.productStatus}\n`);
  });

  // Check Courses
  console.log('📚 COURSES:');
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      status: true,
      enrollmentCount: true,
    }
  });
  
  courses.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.title}`);
    console.log(`      Slug: ${c.slug}`);
    console.log(`      Price: Rp ${Number(c.price).toLocaleString('id-ID')}`);
    console.log(`      Enrolled: ${c.enrollmentCount} students`);
    console.log(`      Status: ${c.status}\n`);
  });

  // Check Events
  console.log('🎉 EVENTS:');
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      price: true,
      startDate: true,
      isPublished: true,
    },
    orderBy: {
      startDate: 'asc'
    }
  });
  
  events.forEach((e, i) => {
    const eventDate = new Date(e.startDate);
    const daysFromNow = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    console.log(`   ${i + 1}. ${e.title}`);
    console.log(`      Type: ${e.type}`);
    console.log(`      Price: ${e.price ? `Rp ${Number(e.price).toLocaleString('id-ID')}` : 'GRATIS'}`);
    console.log(`      Date: ${eventDate.toLocaleDateString('id-ID')} (${daysFromNow} hari lagi)`);
    console.log(`      Published: ${e.isPublished ? '✅' : '❌'}\n`);
  });

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`   Total Memberships: ${memberships.length}`);
  console.log(`   Total Products: ${products.length}`);
  console.log(`   Total Courses: ${courses.length}`);
  console.log(`   Total Events: ${events.length}`);
  
  const total = memberships.length + products.length + courses.length + events.length;
  console.log(`   \n   🎯 Total Items: ${total}`);
  
  console.log('\n✅ All data verified successfully!');
  console.log('\n💡 Next Step: Test the dropdowns in Affiliate Bio page');
  console.log('   Navigate to: http://localhost:3000/affiliate/bio');
}

verifyData()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
