#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDashboard() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║         DASHBOARD ACTIVATION - FINAL VERIFICATION             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Verify Courses
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        thumbnail: true
      },
      take: 5
    });
    console.log('📚 COURSES (Progress Kelas)');
    console.log(`   Total: ${await prisma.course.count({ where: { isPublished: true } })} published`);
    console.log(`   Status: ${courses.length > 0 ? '✅ READY' : '❌ NO DATA'}\n`);

    // Verify Groups
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        ownerId: true
      },
      take: 5
    });
    console.log('👥 GROUPS (Grup Rekomendasi)');
    console.log(`   Total: ${await prisma.group.count({ where: { isActive: true } })} active`);
    console.log(`   Status: ${groups.length > 0 ? '✅ READY' : '❌ NO DATA'}\n`);

    // Verify Products (NEW)
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        productStatus: 'PUBLISHED',
        isFeatured: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: true,
        affiliateCommissionRate: true
      }
    });
    console.log('🛍️  PRODUCTS (Produk Rekomendasi) - ✨ NEWLY ACTIVATED');
    console.log(`   Total: ${await prisma.product.count({ 
      where: { isActive: true, productStatus: 'PUBLISHED' } 
    })} published`);
    console.log(`   Featured: ${products.length}`);
    console.log(`   Status: ${products.length > 0 ? '✅ READY' : '❌ NO DATA'}`);
    
    if (products.length > 0) {
      console.log('\n   Featured Products:');
      products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      └─ Rp ${parseFloat(p.price).toLocaleString('id-ID')} | Affiliate: ${p.affiliateCommissionRate}%`);
      });
    }
    console.log('');

    // Verify Community Feed
    const posts = await prisma.post.findMany({
      where: { 
        approvalStatus: 'APPROVED'
      },
      select: {
        id: true,
        content: true,
        User: {
          select: {
            name: true,
            role: true
          }
        }
      },
      take: 3
    });
    console.log('📝 COMMUNITY FEED');
    console.log(`   Total: ${await prisma.post.count({ where: { approvalStatus: 'APPROVED' } })} approved`);
    console.log(`   Status: ${posts.length > 0 ? '✅ READY' : '❌ NO DATA'}\n`);

    // Summary
    const allReady = courses.length > 0 && groups.length > 0 && products.length > 0 && posts.length > 0;
    console.log('╔══════════════════════════════════════════════════════════════╗');
    if (allReady) {
      console.log('║                    ✅ ALL FEATURES ACTIVE                      ║');
      console.log('║                                                              ║');
      console.log('║  Dashboard is ready with:                                   ║');
      console.log('║  • Courses progress tracking                                ║');
      console.log('║  • Community group recommendations                          ║');
      console.log('║  • Product recommendations (NEW)                            ║');
      console.log('║  • Community feed with user posts                           ║');
    } else {
      console.log('║                  ⚠️  INCOMPLETE DATA                         ║');
    }
    console.log('║                                                              ║');
    console.log('║  Launch dashboard:                                           ║');
    console.log('║  $ npm run dev → Visit /dashboard/premium                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDashboard();
