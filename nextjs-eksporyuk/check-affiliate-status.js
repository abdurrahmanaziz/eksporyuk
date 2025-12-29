const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== CHECKING AFFILIATE STATUS ===\n');
  
  // Check Memberships
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    select: { id: true, name: true, affiliateEnabled: true, status: true }
  });
  
  console.log('📦 SEMUA MEMBERSHIP AKTIF:');
  memberships.forEach(m => {
    const status = m.affiliateEnabled ? '✅' : '❌';
    console.log(`  ${status} ${m.name} | affiliateEnabled: ${m.affiliateEnabled} | status: ${m.status}`);
  });
  
  // Check Products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, affiliateCommissionRate: true }
  });
  
  console.log('\n🛍️ SEMUA PRODUK AKTIF:');
  products.forEach(p => {
    console.log(`  - ${p.name} | commission: ${p.affiliateCommissionRate}%`);
  });
  
  // Check Courses
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, affiliateEnabled: true, affiliateCommissionRate: true }
  });
  
  console.log('\n📚 SEMUA COURSE PUBLISHED:');
  courses.forEach(c => {
    const status = c.affiliateEnabled ? '✅' : '❌';
    console.log(`  ${status} ${c.title} | affiliateEnabled: ${c.affiliateEnabled}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
