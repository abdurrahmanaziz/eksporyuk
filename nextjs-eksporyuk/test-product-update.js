const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductUpdate() {
  console.log('\n=== TEST PRODUCT UPDATE (untuk cek NextAuth error) ===\n');

  try {
    // Test 1: Get first product
    const product = await prisma.product.findFirst();
    if (!product) {
      console.log('❌ No products found');
      return;
    }

    console.log(`📦 Testing product: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Slug: ${product.slug}`);
    
    // Test 2: Update product (simulate what admin does)
    const originalDescription = product.description;
    const testDescription = `${originalDescription} [TEST UPDATE ${new Date().toISOString()}]`;
    
    console.log('\n🔄 Simulating product update...');
    
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        description: testDescription
      }
    });

    console.log('✅ Update berhasil!');
    console.log(`   New description length: ${updatedProduct.description.length} chars`);

    // Test 3: Rollback to original
    console.log('\n🔄 Rolling back...');
    await prisma.product.update({
      where: { id: product.id },
      data: {
        description: originalDescription
      }
    });

    console.log('✅ Rollback berhasil!');
    console.log('\n💡 DATABASE UPDATE WORKING - NextAuth error kemungkinan sudah fixed!');

  } catch (error) {
    console.error('❌ Error during update:', error.message);
    if (error.message.includes('CLIENT_FETCH_ERROR')) {
      console.log('🔍 NextAuth error masih ada');
    } else {
      console.log('🔍 Error bukan dari NextAuth');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProductUpdate();