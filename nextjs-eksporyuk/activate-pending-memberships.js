const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Activate ALL PENDING UserMemberships that have SUCCESS transactions
 * This includes:
 * - Zoom/Event/Webinar purchases (get FREE membership)
 * - Actual membership purchases (get proper membership with dates)
 * 
 * Also ensures affiliate commissions are processed
 */

// Membership IDs
const MEMBERSHIP_IDS = {
  FREE: null, // Will be fetched/created
  SIX_MONTHS: 'cmjauiev30000it1h0c0wndna',
  TWELVE_MONTHS: 'cmjauif2n0001it1h0q4kwjym',
  LIFETIME: 'cmjauif3g0002it1h21ocqrf3',
};

// Duration in days
const DURATION_DAYS = {
  SIX_MONTHS: 180,
  TWELVE_MONTHS: 365,
  LIFETIME: 36500,
};

/**
 * Parse product name to determine if it's event or membership
 */
function parseProductType(productName) {
  if (!productName) return { type: 'UNKNOWN', duration: null };
  
  const name = productName.toLowerCase();
  
  // Event products (zoom, webinar, kopdar, workshop, offline)
  if (name.includes('zoom') || name.includes('webinar') || 
      name.includes('kopdar') || name.includes('workshop') || 
      name.includes('offline')) {
    return { type: 'EVENT', duration: 'FREE' };
  }
  
  // Non-membership products
  if (name.includes('aplikasi eya') || name.includes('eya desktop') || name === 'eya dekstop') {
    return { type: 'SOFTWARE', duration: null };
  }
  if (name.includes('legalitas') || name.includes('jasa website') || 
      name.includes('jasa katalog') || name.includes('jasa company')) {
    return { type: 'SERVICE', duration: null };
  }
  if (name.includes('kaos') || name.includes('titip barang') || name.includes('dp trade')) {
    return { type: 'PRODUCT', duration: null };
  }
  
  // Membership products - determine duration
  let duration = 'TWELVE_MONTHS'; // Default
  
  if (name.includes('lifetime') || name.includes('selamanya') || name.includes('bundling')) {
    duration = 'LIFETIME';
  } else if (name.includes('12 bulan') || name.includes('1 tahun')) {
    duration = 'TWELVE_MONTHS';
  } else if (name.includes('6 bulan')) {
    duration = 'SIX_MONTHS';
  } else if (name.includes('prelaunch') || name.includes('ultah')) {
    duration = 'LIFETIME';
  } else if (name.includes('promo')) {
    if (name.includes('lifetime') || name.includes('thr') || name.includes('tahun baru')) {
      duration = 'LIFETIME';
    }
  }
  
  return { type: 'MEMBERSHIP', duration };
}

/**
 * Get or create FREE membership for event participants
 */
async function getFreeMembership() {
  let freeMembership = await prisma.membership.findFirst({
    where: { duration: 'FREE' }
  });
  
  if (!freeMembership) {
    freeMembership = await prisma.membership.create({
      data: {
        name: 'Member Free',
        slug: 'member-free',
        description: 'Akses gratis untuk peserta event/webinar',
        price: 0,
        duration: 'FREE',
        features: ['Akses materi gratis', 'Komunitas Ekspor Yuk'],
        isActive: true,
      }
    });
    console.log('Created FREE membership:', freeMembership.id);
  }
  
  return freeMembership;
}

/**
 * Process affiliate commission for a transaction
 */
async function processAffiliateCommission(transaction) {
  const metadata = transaction.metadata || {};
  const affiliateName = metadata.affiliateName || metadata.affiliate_name;
  const commissionAmount = metadata.commissionAmount || metadata.commission_amount || 0;
  
  if (!affiliateName || !commissionAmount || commissionAmount <= 0) return null;
  
  // Check if conversion already exists for this transaction
  const existingConversion = await prisma.affiliateConversion.findFirst({
    where: { transactionId: transaction.id }
  });
  
  if (existingConversion) return existingConversion;
  
  // Find affiliate by name (search in User table)
  const user = await prisma.user.findFirst({
    where: { name: affiliateName },
    include: { affiliateProfile: true }
  });
  
  if (!user?.affiliateProfile) return null;
  
  // Create affiliate conversion
  try {
    const conversion = await prisma.affiliateConversion.create({
      data: {
        affiliateId: user.affiliateProfile.id,
        transactionId: transaction.id,
        commissionAmount: commissionAmount,
        commissionRate: 10, // Default rate
      }
    });
    
    // Update affiliate wallet
    await prisma.wallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balance: commissionAmount,
        balancePending: 0,
      },
      update: {
        balance: { increment: commissionAmount }
      }
    });
    
    return conversion;
  } catch (err) {
    if (err.code !== 'P2002') {
      console.error('Error creating conversion:', err.message);
    }
    return null;
  }
}

async function activatePendingMemberships() {
  console.log('=== Activating PENDING Memberships ===\n');
  
  // Get FREE membership
  const freeMembership = await getFreeMembership();
  MEMBERSHIP_IDS.FREE = freeMembership.id;
  
  // Get all PENDING UserMemberships with transactions
  const pendingMemberships = await prisma.userMembership.findMany({
    where: { status: 'PENDING' },
    include: {
      transaction: true
    }
  });
  
  console.log('Total PENDING:', pendingMemberships.length);
  
  let activated = 0;
  let skipped = 0;
  let converted = 0;
  let commissionsProcessed = 0;
  
  const stats = {
    EVENT: 0,
    MEMBERSHIP: 0,
    SOFTWARE: 0,
    SERVICE: 0,
    PRODUCT: 0,
    UNKNOWN: 0,
    NO_TX: 0
  };
  
  for (const um of pendingMemberships) {
    // Skip if no transaction
    if (!um.transaction) {
      stats.NO_TX++;
      skipped++;
      continue;
    }
    
    // Skip if transaction not SUCCESS
    if (um.transaction.status !== 'SUCCESS') {
      skipped++;
      continue;
    }
    
    const productName = um.transaction.metadata?.productName || um.transaction.metadata?.product_name || '';
    const { type, duration } = parseProductType(productName);
    
    stats[type]++;
    
    // Process affiliate commission
    const commission = await processAffiliateCommission(um.transaction);
    if (commission) commissionsProcessed++;
    
    // Determine target membership and dates
    let targetMembershipId = um.membershipId;
    let startDate = um.transaction.paidAt || um.transaction.createdAt;
    let endDate = um.endDate;
    
    if (type === 'EVENT') {
      // Convert to FREE membership if currently on a paid plan
      if (um.membershipId !== MEMBERSHIP_IDS.FREE) {
        // Check if user has another ACTIVE membership
        const otherActive = await prisma.userMembership.findFirst({
          where: {
            userId: um.userId,
            status: 'ACTIVE',
            id: { not: um.id }
          }
        });
        
        if (otherActive) {
          // User has active membership, just activate this one
          targetMembershipId = um.membershipId;
        } else {
          // Convert to FREE
          targetMembershipId = MEMBERSHIP_IDS.FREE;
          converted++;
        }
      }
      endDate = new Date('2099-12-31'); // Indefinite for free
    } else if (type === 'MEMBERSHIP' && duration) {
      // Update to correct membership if needed
      if (MEMBERSHIP_IDS[duration] && um.membershipId !== MEMBERSHIP_IDS[duration]) {
        targetMembershipId = MEMBERSHIP_IDS[duration];
      }
      
      // Calculate end date
      const days = DURATION_DAYS[duration] || 365;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);
    } else if (type === 'SOFTWARE' || type === 'SERVICE' || type === 'PRODUCT') {
      // Non-membership products - skip activation
      skipped++;
      continue;
    }
    
    // Check if user already has this membership (avoid unique constraint)
    if (targetMembershipId !== um.membershipId) {
      const existingMembership = await prisma.userMembership.findFirst({
        where: {
          userId: um.userId,
          membershipId: targetMembershipId,
          id: { not: um.id }
        }
      });
      
      if (existingMembership) {
        // User already has this membership - update that one instead and delete this
        await prisma.userMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            startDate: existingMembership.startDate < startDate ? existingMembership.startDate : startDate,
            endDate: existingMembership.endDate > endDate ? existingMembership.endDate : endDate,
          }
        });
        
        // Delete the duplicate PENDING one
        await prisma.userMembership.delete({
          where: { id: um.id }
        });
        
        activated++;
        if (activated % 500 === 0) {
          console.log(`Activated ${activated}...`);
        }
        continue;
      }
    }
    
    // Activate the membership
    try {
      await prisma.userMembership.update({
        where: { id: um.id },
        data: {
          membershipId: targetMembershipId,
          status: 'ACTIVE',
          isActive: true,
          startDate: startDate,
          endDate: endDate,
        }
      });
      
      activated++;
    } catch (err) {
      if (err.code === 'P2002') {
        // Unique constraint - delete this duplicate
        await prisma.userMembership.delete({
          where: { id: um.id }
        }).catch(() => {});
        skipped++;
      } else {
        console.error('Error activating:', err.message);
        skipped++;
      }
    }
    
    if (activated % 500 === 0) {
      console.log(`Activated ${activated}...`);
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Activated:', activated);
  console.log('Skipped:', skipped);
  console.log('Converted to FREE:', converted);
  console.log('Commissions processed:', commissionsProcessed);
  
  console.log('\n=== Product Type Breakdown ===');
  for (const [type, count] of Object.entries(stats)) {
    console.log(`  ${type}: ${count}`);
  }
  
  // Verification
  const finalStats = await prisma.userMembership.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('\n=== Final Status ===');
  for (const s of finalStats) {
    console.log(`  ${s.status}: ${s._count}`);
  }
  
  await prisma.$disconnect();
}

activatePendingMemberships().catch(console.error);
