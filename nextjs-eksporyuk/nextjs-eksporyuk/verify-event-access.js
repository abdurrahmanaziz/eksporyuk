/**
 * VERIFY EVENT/WEBINAR USER ACCESS
 * 
 * Pastikan:
 * 1. User dari EVENT/WEBINAR/ZOOMINAR → MEMBER_FREE (tidak dapat membership)
 * 2. User yang beli MEMBERSHIP Lifetime di Sejoli → LIFETIME di website baru
 * 3. User tidak dapat akses lebih tinggi dari yang seharusnya
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Produk event/webinar/zoominar yang TIDAK memberikan membership
const EVENT_PRODUCTS = [
  'Webinar', 'Zoom', 'Kopdar', 'Workshop', 'Tiket', 'Zoominar',
  'Gratis', 'Donasi', 'Kaos', 'Katalog', 'Company Profile',
  'Umroh', 'Titip Barang', 'Trade Expo', 'DP Trade', 'Legalitas'
];

// Produk yang MEMBERIKAN membership lifetime
const LIFETIME_PRODUCTS = [
  'Lifetime', 'Bundling', 'Kelas Eksporyuk', 'Kelas Bimbingan',
  'Promo MEI', 'Promo.*Lifetime', 'Promo.*THR', 'Ultah Ekspor Yuk',
  'Promo Kemerdekaan', 'Promo Merdeka', 'Promo 10.10', 'Promo.*Tahun Baru'
];

function isEventProduct(productName) {
  if (!productName) return false;
  return EVENT_PRODUCTS.some(keyword => productName.includes(keyword));
}

function isLifetimeProduct(productName) {
  if (!productName) return false;
  return LIFETIME_PRODUCTS.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(productName);
  });
}

async function verifyEventWebinarAccess() {
  console.log('🔍 VERIFY EVENT/WEBINAR USER ACCESS');
  console.log('═'.repeat(80));
  console.log('');

  const issues = [];
  let totalChecked = 0;
  let correctAccess = 0;
  let needsFix = 0;

  try {
    // 1. Cek semua transaksi sukses
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Total transaksi: ${transactions.length}\n`);

    // Group transactions by user
    const userTransactions = {};
    for (const tx of transactions) {
      const userId = tx.userId;
      if (!userTransactions[userId]) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });
        
        if (!user) continue; // Skip jika user tidak ada
        
        userTransactions[userId] = {
          user,
          transactions: []
        };
      }
      userTransactions[userId].transactions.push(tx);
    }

    console.log(`👥 Total unique users: ${Object.keys(userTransactions).length}\n`);
    console.log('─'.repeat(80));
    console.log('CHECKING USER ACCESS...\n');

    // Analyze each user
    for (const [userId, data] of Object.entries(userTransactions)) {
      totalChecked++;
      const { user, transactions: userTxs } = data;
      
      // Determine what user should have
      let hasLifetimeProduct = false;
      let hasMembershipProduct = false;
      let hasOnlyEventProduct = true;
      
      const productsBought = [];
      
      for (const tx of userTxs) {
        const productName = tx.metadata?.productName || tx.description || '';
        productsBought.push(productName);
        
        if (isLifetimeProduct(productName)) {
          hasLifetimeProduct = true;
          hasMembershipProduct = true;
          hasOnlyEventProduct = false;
        } else if (!isEventProduct(productName) && tx.type === 'MEMBERSHIP') {
          hasMembershipProduct = true;
          hasOnlyEventProduct = false;
        } else if (isEventProduct(productName)) {
          // Event product, doesn't change membership status
        }
      }

      // Get current user membership
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: userId,
          status: 'ACTIVE'
        }
      });
      
      let currentMembership = null;
      let membershipDuration = null;
      
      if (userMembership) {
        currentMembership = await prisma.membership.findUnique({
          where: { id: userMembership.membershipId }
        });
        membershipDuration = currentMembership?.duration;
      }

      // Verify correctness
      let expectedAccess = '';
      let currentAccess = '';
      let isCorrect = true;
      
      if (hasLifetimeProduct) {
        expectedAccess = 'MEMBER_PREMIUM + LIFETIME Membership';
        currentAccess = `${user.role} + ${membershipDuration || 'NO_MEMBERSHIP'}`;
        
        if (user.role !== 'MEMBER_PREMIUM' || !membershipDuration || membershipDuration !== 'LIFETIME') {
          isCorrect = false;
          issues.push({
            type: 'LIFETIME_MISSING',
            user: user.email,
            products: productsBought,
            expected: expectedAccess,
            current: currentAccess
          });
          needsFix++;
        }
      } else if (hasMembershipProduct) {
        expectedAccess = 'MEMBER_PREMIUM + Membership (6/12 bulan)';
        currentAccess = `${user.role} + ${membershipDuration || 'NO_MEMBERSHIP'}`;
        
        if (user.role !== 'MEMBER_PREMIUM' || !membershipDuration) {
          isCorrect = false;
          issues.push({
            type: 'MEMBERSHIP_MISSING',
            user: user.email,
            products: productsBought,
            expected: expectedAccess,
            current: currentAccess
          });
          needsFix++;
        }
      } else if (hasOnlyEventProduct) {
        expectedAccess = 'MEMBER_FREE (no membership)';
        currentAccess = `${user.role} + ${membershipDuration || 'NO_MEMBERSHIP'}`;
        
        // Event user should NOT have membership
        if (membershipDuration && !['ADMIN', 'MENTOR', 'AFFILIATE'].includes(user.role)) {
          isCorrect = false;
          issues.push({
            type: 'EVENT_HAS_MEMBERSHIP',
            user: user.email,
            products: productsBought,
            expected: expectedAccess,
            current: currentAccess,
            severity: 'HIGH' // This is wrong!
          });
          needsFix++;
        } else if (user.role === 'MEMBER_PREMIUM' && !['ADMIN', 'MENTOR', 'AFFILIATE'].includes(user.role)) {
          // Could be upgraded by another transaction
          // Check if they have other transactions
          const nonEventTx = userTxs.filter(tx => !isEventProduct(tx.metadata?.productName || ''));
          if (nonEventTx.length === 0) {
            isCorrect = false;
            issues.push({
              type: 'EVENT_PREMIUM_ROLE',
              user: user.email,
              products: productsBought,
              expected: expectedAccess,
              current: currentAccess,
              severity: 'MEDIUM'
            });
            needsFix++;
          }
        }
      }

      if (isCorrect) {
        correctAccess++;
        if (totalChecked <= 10) {
          console.log(`✅ ${user.email}`);
          console.log(`   Products: ${productsBought.join(', ')}`);
          console.log(`   Access: ${currentAccess}`);
        }
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`Total users checked: ${totalChecked}`);
    console.log(`✅ Correct access: ${correctAccess} (${((correctAccess/totalChecked)*100).toFixed(1)}%)`);
    console.log(`⚠️  Need fix: ${needsFix} (${((needsFix/totalChecked)*100).toFixed(1)}%)`);

    if (issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      console.log('─'.repeat(80));
      
      // Group by type
      const grouped = {};
      issues.forEach(issue => {
        if (!grouped[issue.type]) grouped[issue.type] = [];
        grouped[issue.type].push(issue);
      });

      for (const [type, typeIssues] of Object.entries(grouped)) {
        console.log(`\n${type} (${typeIssues.length} users):`);
        console.log('─'.repeat(80));
        
        typeIssues.slice(0, 10).forEach(issue => {
          console.log(`\n❌ ${issue.user}`);
          console.log(`   Products: ${issue.products.join(', ')}`);
          console.log(`   Expected: ${issue.expected}`);
          console.log(`   Current: ${issue.current}`);
          if (issue.severity) {
            console.log(`   ⚠️  Severity: ${issue.severity}`);
          }
        });

        if (typeIssues.length > 10) {
          console.log(`\n   ... and ${typeIssues.length - 10} more`);
        }
      }

      // Generate fix script
      console.log('\n\n🔧 GENERATING FIX SCRIPT...');
      console.log('─'.repeat(80));
      
      let fixScript = `
/**
 * AUTO-GENERATED FIX SCRIPT
 * Generated: ${new Date().toISOString()}
 * Issues found: ${needsFix}
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAccess() {
  console.log('Fixing ${needsFix} users...');
  
`;

      // Generate fixes for each issue type
      if (grouped.EVENT_HAS_MEMBERSHIP) {
        fixScript += `
  // Fix: Remove membership from EVENT-only users
  const eventUsers = [${grouped.EVENT_HAS_MEMBERSHIP.map(i => `'${i.user}'`).join(', ')}];
  
  for (const email of eventUsers) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Delete membership if only bought events
      await prisma.userMembership.updateMany({
        where: { userId: user.id },
        data: { status: 'CANCELLED' }
      });
      
      // Set to FREE role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_FREE' }
      });
      
      console.log(\`Fixed: \${email} → MEMBER_FREE\`);
    }
  }
`;
      }

      fixScript += `
  console.log('✅ Fix completed');
  await prisma.$disconnect();
}

fixAccess();
`;

      // Save fix script
      const fs = require('fs');
      fs.writeFileSync('fix-event-access.js', fixScript);
      console.log('\n✅ Fix script saved to: fix-event-access.js');
    } else {
      console.log('\n✅ ALL USERS HAVE CORRECT ACCESS!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEventWebinarAccess();
