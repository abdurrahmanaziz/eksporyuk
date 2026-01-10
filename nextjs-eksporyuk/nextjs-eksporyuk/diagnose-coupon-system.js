const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnose() {
  console.log('\n========================================')
  console.log('🔍 SISTEM KUPON - DIAGNOSTIC REPORT')
  console.log('========================================\n')

  try {
    // 1. Check AffiliateLinks
    console.log('📊 STEP 1: AFFILIATE LINKS')
    console.log('========================================')
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      include: {
        membership: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Total active links: ${affiliateLinks.length}\n`)

    const linksWithCoupon = affiliateLinks.filter(link => link.couponCode)
    console.log(`Links with couponCode field: ${linksWithCoupon.length}`)
    
    if (linksWithCoupon.length === 0) {
      console.log('  ✅ No links have couponCode - system clean!\n')
    } else {
      console.log('')
      for (const link of linksWithCoupon) {
        console.log(`  🔗 ${link.membership?.name || 'Unknown Package'}`)
        console.log(`     Code: ${link.code}`)
        console.log(`     Short: ${link.shortCode}`)
        console.log(`     CouponCode: ${link.couponCode}`)
        console.log(`     URL: http://localhost:3000/go/${link.shortCode}/checkout`)
        console.log('')
      }
    }

    // 2. Check Coupons Table
    console.log('========================================')
    console.log('💳 STEP 2: COUPONS IN DATABASE')
    console.log('========================================')
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Total active coupons: ${coupons.length}\n`)

    if (coupons.length === 0) {
      console.log('  ⚠️  NO COUPONS GENERATED YET\n')
    } else {
      for (const coupon of coupons) {
        const expiryStatus = coupon.expiresAt 
          ? (new Date() > coupon.expiresAt ? '🔴 EXPIRED' : '🟢 VALID')
          : '🟢 NO EXPIRY'
        
        console.log(`  💳 ${coupon.code}`)
        console.log(`     Type: ${coupon.discountType}`)
        console.log(`     Value: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' IDR'}`)
        console.log(`     Status: ${expiryStatus}`)
        console.log(`     Usage: ${coupon.usedCount}/${coupon.maxUses || '∞'}`)
        console.log('')
      }
    }

    // 3. Cross-check
    console.log('========================================')
    console.log('🔄 STEP 3: CROSS-CHECK (SOP COMPLIANCE)')
    console.log('========================================\n')

    console.log('SOP Rules:')
    console.log('  1️⃣  Affiliate link MAY have couponCode (planning field)')
    console.log('  2️⃣  Coupon ONLY applied if EXISTS in Coupon table')
    console.log('  3️⃣  If NOT generated → Field EMPTY, no discount')
    console.log('  4️⃣  If IS generated → Auto-fill + auto-apply\n')

    console.log('Checking compliance...\n')

    let compliant = 0
    let nonCompliant = 0

    for (const link of linksWithCoupon) {
      const couponExists = coupons.find(c => c.code === link.couponCode)
      
      if (couponExists) {
        console.log(`  ✅ ${link.couponCode}`)
        console.log(`     Link: ${link.code} (${link.membership?.name})`)
        console.log(`     Coupon: EXISTS in database`)
        console.log(`     Status: WILL AUTO-APPLY ✓`)
        console.log(`     Test URL: http://localhost:3000/go/${link.shortCode}/checkout`)
        console.log('')
        compliant++
      } else {
        console.log(`  ❌ ${link.couponCode}`)
        console.log(`     Link: ${link.code} (${link.membership?.name})`)
        console.log(`     Coupon: NOT GENERATED in database`)
        console.log(`     Status: FIELD STAYS EMPTY (SOP compliant)`)
        console.log(`     Test URL: http://localhost:3000/go/${link.shortCode}/checkout`)
        console.log(`     Action: Generate coupon in Coupon table to activate`)
        console.log('')
        nonCompliant++
      }
    }

    console.log('========================================')
    console.log('📈 SUMMARY')
    console.log('========================================')
    console.log(`Affiliate links with couponCode: ${linksWithCoupon.length}`)
    console.log(`Coupons generated in database: ${coupons.length}`)
    console.log(`✅ Compliant (coupon exists): ${compliant}`)
    console.log(`❌ Not generated (field empty): ${nonCompliant}`)
    console.log('')

    if (nonCompliant > 0) {
      console.log('⚠️  ACTION REQUIRED:')
      console.log(`   ${nonCompliant} coupon(s) need to be generated in Coupon table`)
      console.log('   Go to admin panel → Generate Coupons')
      console.log('   Or run: node generate-coupons.js')
    } else if (linksWithCoupon.length > 0) {
      console.log('✅ ALL COUPONS GENERATED!')
      console.log('   System working perfectly!')
    } else {
      console.log('ℹ️  NO COUPON CODES SET')
      console.log('   System clean, no coupons to track')
    }

    console.log('')
    console.log('========================================')
    console.log('🧪 TESTING INSTRUCTIONS')
    console.log('========================================')
    console.log('1. Clear browser cache and cookies')
    console.log('2. Visit test URL above')
    console.log('3. Check browser console for SOP logs:')
    console.log('   - 🔍 "Affiliate link has couponCode: XXX"')
    console.log('   - 🔍 "Coupon validation result: ..."')
    console.log('   - ✅ or ❌ based on existence')
    console.log('4. Verify coupon field:')
    console.log('   - If ✅: Field auto-filled, discount applied')
    console.log('   - If ❌: Field EMPTY, no discount')
    console.log('')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
