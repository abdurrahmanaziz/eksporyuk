const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sync UserMembership from SUCCESS transactions
 * 
 * Mapping product_name to membership duration:
 * - Contains "Lifetime" or "Selamanya" → LIFETIME
 * - Contains "12 Bulan" or "1 Tahun" → TWELVE_MONTHS  
 * - Contains "6 Bulan" → SIX_MONTHS
 * - Contains "3 Bulan" → THREE_MONTHS (if exists)
 * - Contains "1 Bulan" → ONE_MONTH (if exists)
 */

// Membership duration mapping
const MEMBERSHIP_IDS = {
  SIX_MONTHS: 'cmjauiev30000it1h0c0wndna',
  TWELVE_MONTHS: 'cmjauif2n0001it1h0q4kwjym',
  LIFETIME: 'cmjauif3g0002it1h21ocqrf3',
};

// Duration in days for calculating endDate
const DURATION_DAYS = {
  SIX_MONTHS: 180,
  TWELVE_MONTHS: 365,
  LIFETIME: 36500, // 100 years
};

/**
 * Parse product name to determine membership duration
 */
function parseDuration(productName) {
  if (!productName) return null;
  
  const name = productName.toLowerCase();
  
  // === SKIP non-membership products ===
  
  // Skip events/zoom/webinar - not membership
  if (name.includes('zoom') || name.includes('webinar')) {
    return null;
  }
  
  // Skip kopdar/workshop/offline events
  if (name.includes('kopdar') || name.includes('workshop') || name.includes('offline')) {
    return null;
  }
  
  // Skip standalone services/products
  if (name.includes('legalitas') || name.includes('kaos') || name.includes('dp trade')) {
    return null;
  }
  if (name.includes('jasa website') || name.includes('jasa katalog') || name.includes('jasa company')) {
    return null;
  }
  if (name.includes('katalog produk') && !name.includes('kelas')) {
    return null;
  }
  if (name.includes('titip barang') || name.includes('paket umroh') || name.includes('tiket untuk')) {
    return null;
  }
  
  // Skip aplikasi/software only purchases (not bundled with kelas)
  if ((name.includes('aplikasi eya') || name === 'ekspor yuk automation' || name === 'ekspor yuk automation eya') 
      && !name.includes('bundling') && !name.includes('kelas')) {
    return null;
  }
  if (name.includes('eya desktop') || name === 'eya dekstop') {
    return null;
  }
  
  // Skip kelas gratis & donasi
  if (name.includes('gratis') || name.includes('donasi')) {
    return null;
  }
  
  // === MEMBERSHIP patterns ===
  
  // Lifetime patterns - check first (most specific)
  if (name.includes('lifetime') || name.includes('selamanya')) {
    return 'LIFETIME';
  }
  
  // Bundling - usually includes lifetime
  if (name.includes('bundling')) {
    return 'LIFETIME';
  }
  
  // Prelaunch/Ultah - early access = lifetime
  if (name.includes('prelaunch') || name.includes('ultah')) {
    return 'LIFETIME';
  }
  
  // Re-Kelas patterns (explicit check before generic kelas)
  if (name.includes('re kelas') || name.includes('rekelas') || name.includes('re-kelas')) {
    if (name.includes('lifetime') || name.includes('selamanya')) return 'LIFETIME';
    if (name.includes('12 bulan')) return 'TWELVE_MONTHS';
    if (name.includes('6 bulan')) return 'SIX_MONTHS';
    return 'TWELVE_MONTHS'; // Default re-kelas to 12 months
  }
  
  // Duration patterns  
  if (name.includes('12 bulan') || name.includes('1 tahun') || name.includes('12bulan')) {
    return 'TWELVE_MONTHS';
  }
  if (name.includes('6 bulan') || name.includes('6bulan')) {
    return 'SIX_MONTHS';
  }
  
  // Promo patterns
  if (name.includes('promo')) {
    // Promo with "merdeka" or "kemerdekaan" = 12 months
    if (name.includes('merdeka')) return 'TWELVE_MONTHS';
    // Promo with "lifetime", "thr", etc = lifetime  
    if (name.includes('lifetime') || name.includes('thr') || name.includes('tahun baru')) return 'LIFETIME';
    // Default promo to 12 months
    return 'TWELVE_MONTHS';
  }
  
  // Generic "Kelas Eksporyuk" or "Kelas Ekspor Yuk" without duration
  if (name.includes('kelas ekspor') || name.includes('kelas bimbingan ekspor') || name === 'kelas eksporyuk') {
    return 'TWELVE_MONTHS';
  }
  
  // "eksporyuk" standalone (simple name)
  if (name === 'eksporyuk' || name === 'ekspor yuk') {
    return 'TWELVE_MONTHS';
  }
  
  // Paket Ekspor Yuk patterns  
  if (name.includes('paket ekspor')) {
    if (name.includes('lifetime')) return 'LIFETIME';
    if (name.includes('12 bulan')) return 'TWELVE_MONTHS';
    if (name.includes('6 bulan')) return 'SIX_MONTHS';
    return 'TWELVE_MONTHS'; // Default paket to 12 months
  }
  
  return null; // Not a membership product
}

async function syncMemberships() {
  console.log('=== Syncing UserMemberships from Transactions ===\n');
  
  // Get all SUCCESS MEMBERSHIP transactions
  const transactions = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      type: 'MEMBERSHIP'
    },
    select: {
      id: true,
      userId: true,
      invoiceNumber: true,
      metadata: true,
      amount: true,
      createdAt: true,
      paidAt: true,
    },
    orderBy: { createdAt: 'asc' } // Process oldest first
  });
  
  console.log(`Found ${transactions.length} SUCCESS MEMBERSHIP transactions\n`);
  
  // Stats
  let updated = 0;
  let created = 0;
  let skipped = 0;
  let notMembership = 0;
  
  const durationStats = {
    LIFETIME: 0,
    TWELVE_MONTHS: 0,
    SIX_MONTHS: 0,
  };
  
  for (const tx of transactions) {
    const productName = tx.metadata?.product_name || tx.metadata?.productName || '';
    const duration = parseDuration(productName);
    
    if (!duration) {
      notMembership++;
      continue;
    }
    
    const membershipId = MEMBERSHIP_IDS[duration];
    if (!membershipId) {
      skipped++;
      continue;
    }
    
    const startDate = tx.paidAt || tx.createdAt;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + DURATION_DAYS[duration]);
    
    // Check if user already has this membership
    const existing = await prisma.userMembership.findFirst({
      where: {
        userId: tx.userId,
        membershipId: membershipId,
      }
    });
    
    if (existing) {
      // Update existing - extend if new endDate is later, set to ACTIVE
      const newEndDate = endDate > existing.endDate ? endDate : existing.endDate;
      await prisma.userMembership.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          isActive: true,
          endDate: newEndDate,
          // Don't update transactionId - it's unique constraint
        }
      });
      updated++;
    } else {
      // Create new UserMembership
      try {
        await prisma.userMembership.create({
          data: {
            userId: tx.userId,
            membershipId: membershipId,
            transactionId: tx.id,
            status: 'ACTIVE',
            isActive: true,
            startDate: startDate,
            endDate: endDate,
          }
        });
        created++;
      } catch (err) {
        if (err.code === 'P2002') {
          // Unique constraint - already exists
          updated++;
        } else {
          console.error(`Error for ${tx.invoiceNumber}:`, err.message);
          skipped++;
        }
      }
    }
    
    durationStats[duration]++;
    
    if ((created + updated) % 500 === 0) {
      console.log(`Processed ${created + updated}...`);
    }
  }
  
  console.log('\n=== Results ===');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Not membership (events/zoom): ${notMembership}`);
  
  console.log('\n=== Duration Distribution ===');
  console.log(`Lifetime: ${durationStats.LIFETIME}`);
  console.log(`12 Months: ${durationStats.TWELVE_MONTHS}`);
  console.log(`6 Months: ${durationStats.SIX_MONTHS}`);
  
  // Verify
  console.log('\n=== Verification ===');
  const activeCount = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  const totalCount = await prisma.userMembership.count();
  console.log(`Total UserMembership: ${totalCount}`);
  console.log(`Active UserMembership: ${activeCount}`);
  
  // Count by membership type
  const byMembership = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: true
  });
  
  const memberships = await prisma.membership.findMany();
  const membershipMap = new Map(memberships.map(m => [m.id, m.name]));
  
  console.log('\nActive memberships by type:');
  byMembership.forEach(g => {
    console.log(`  ${membershipMap.get(g.membershipId)}: ${g._count}`);
  });
  
  await prisma.$disconnect();
}

syncMemberships().catch(console.error);
