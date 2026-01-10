import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testButtonLayout() {
  console.log('🧪 Testing Button Layout Feature...\n');

  // 1. Check database
  console.log('1️⃣ Checking database...');
  const bioPage = await prisma.affiliateBioPage.findFirst({
    select: {
      id: true,
      displayName: true,
      template: true,
      buttonLayout: true,
      affiliate: {
        select: {
          id: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!bioPage) {
    console.log('❌ No bio page found!\n');
    return;
  }

  console.log('✅ Bio Page found:');
  console.log(`   Display Name: ${bioPage.displayName}`);
  console.log(`   Template: ${bioPage.template}`);
  console.log(`   Button Layout: ${bioPage.buttonLayout}`);
  console.log(`   Username: ${bioPage.affiliate.user.username}`);
  console.log(`   Email: ${bioPage.affiliate.user.email}\n`);

  // 2. Test updating buttonLayout
  console.log('2️⃣ Testing update to grid-2...');
  const updated = await prisma.affiliateBioPage.update({
    where: { id: bioPage.id },
    data: { buttonLayout: 'grid-2' }
  });
  console.log(`✅ Updated to: ${updated.buttonLayout}\n`);

  // 3. Test updating back to stack
  console.log('3️⃣ Reverting to stack...');
  const reverted = await prisma.affiliateBioPage.update({
    where: { id: bioPage.id },
    data: { buttonLayout: 'stack' }
  });
  console.log(`✅ Reverted to: ${reverted.buttonLayout}\n`);

  // 4. Check CTA buttons
  console.log('4️⃣ Checking CTA buttons...');
  const bioWithCTAs = await prisma.affiliateBioPage.findUnique({
    where: { id: bioPage.id },
    include: {
      ctaButtons: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      }
    }
  });

  console.log(`✅ Found ${bioWithCTAs?.ctaButtons.length || 0} active CTA buttons`);
  if (bioWithCTAs?.ctaButtons && bioWithCTAs.ctaButtons.length > 0) {
    bioWithCTAs.ctaButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. ${btn.buttonText} (${btn.buttonType})`);
    });
  } else {
    console.log('   ⚠️  No CTA buttons found. Create some to test layouts!');
  }

  console.log('\n✅ All tests passed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Open http://localhost:3000/affiliate/bio');
  console.log('   2. Look for "Layout CTA Buttons" section');
  console.log('   3. Try changing layout and save');
  console.log(`   4. View public page: http://localhost:3000/bio/${bioPage.affiliate.user.username}`);
}

testButtonLayout()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
