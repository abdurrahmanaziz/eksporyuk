const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mapping dari description ke membership type (dari PRD 6)
function getMembershipType(description, amount) {
  if (!description) return null;
  
  const desc = description.toLowerCase();
  
  // Lifetime
  if (desc.includes("lifetime")) {
    return "LIFETIME";
  }
  
  // Webinar, Zoom, Event → No membership
  if (
    desc.includes("webinar") ||
    desc.includes("zoom") ||
    desc.includes("kopdar") ||
    desc.includes("event") ||
    desc.includes("workshop")
  ) {
    return "EVENT";
  }
  
  // Kelas Eksporyuk - perlu lihat amount untuk beda 6 bulan vs 12 bulan
  if (desc.includes("kelas") || desc.includes("class")) {
    // Heuristic: jika amount sekitar 600-700K = 6 bulan, 900K+ = 12 bulan
    if (amount >= 800000) {
      return "12_BULAN";
    } else {
      return "6_BULAN";
    }
  }
  
  // Default 12 bulan untuk paket lain
  return "12_BULAN";
}

(async () => {
  console.log("📋 CORRECT MEMBERSHIP ASSIGNMENT (berdasarkan Sejoli description)");
  console.log("═".repeat(70));
  
  try {
    // 1. Get all successful transactions
    console.log("\n1️⃣  Fetching successful transactions...");
    const transactions = await prisma.transaction.findMany({
      where: { status: "SUCCESS" },
    });
    
    console.log(`   Found ${transactions.length} transactions`);
    
    // 2. Get memberships
    console.log("\n2️⃣  Fetching memberships...");
    const memberships = await prisma.membership.findMany();
    
    const lifetimeMem = memberships.find(m => m.duration === "LIFETIME");
    const bulan12Mem = memberships.find(m => m.duration === "TWELVE_MONTHS");
    const bulan6Mem = memberships.find(m => m.duration === "SIX_MONTHS");
    
    console.log(`   Lifetime: ${lifetimeMem.name}`);
    console.log(`   12 Bulan: ${bulan12Mem.name}`);
    console.log(`   6 Bulan: ${bulan6Mem.name}`);
    
    // 3. Map transactions berdasarkan description
    console.log("\n3️⃣  Mapping users ke membership type...");
    
    const userMembershipMap = new Map();
    let typeCount = { LIFETIME: 0, "12_BULAN": 0, "6_BULAN": 0, EVENT: 0 };
    
    transactions.forEach((tx) => {
      const membershipType = getMembershipType(tx.description, tx.amount);
      typeCount[membershipType]++;
      
      // Skip Event/Webinar (User Free)
      if (membershipType === "EVENT") {
        return;
      }
      
      const key = tx.userId;
      
      // Tentukan membership berdasarkan type
      let membership = null;
      if (membershipType === "LIFETIME") {
        membership = lifetimeMem;
      } else if (membershipType === "12_BULAN") {
        membership = bulan12Mem;
      } else if (membershipType === "6_BULAN") {
        membership = bulan6Mem;
      }
      
      if (!membership) return;
      
      // Jika user belum ada, buat entry baru
      if (!userMembershipMap.has(key)) {
        userMembershipMap.set(key, {
          userId: tx.userId,
          membershipId: membership.id,
          membershipType: membershipType,
          startDate: tx.createdAt,
          transactionId: tx.id,
          membershipName: membership.name,
        });
      } else {
        // Upgrade jika mendapat membership yang lebih tinggi
        const current = userMembershipMap.get(key);
        const priority = { LIFETIME: 3, "12_BULAN": 2, "6_BULAN": 1 };
        
        if (priority[membershipType] > priority[current.membershipType]) {
          userMembershipMap.set(key, {
            userId: tx.userId,
            membershipId: membership.id,
            membershipType: membershipType,
            startDate: tx.createdAt,
            transactionId: tx.id,
            membershipName: membership.name,
          });
        }
      }
    });
    
    console.log(`   Type Distribution:`);
    console.log(`     Lifetime: ${typeCount.LIFETIME}`);
    console.log(`     12 Bulan: ${typeCount["12_BULAN"]}`);
    console.log(`     6 Bulan: ${typeCount["6_BULAN"]}`);
    console.log(`     Event/Webinar: ${typeCount.EVENT}`);
    
    console.log(`   Mapped users: ${userMembershipMap.size}`);
    
    // 4. Delete existing UserMemberships
    console.log("\n4️⃣  Cleaning existing UserMemberships...");
    const deletedCount = await prisma.userMembership.deleteMany();
    console.log(`   Deleted ${deletedCount.count} existing records`);
    
    // 5. Create UserMembership records
    console.log("\n5️⃣  Creating UserMembership records dengan mapping yang benar...");
    
    let created = 0;
    let errors = 0;
    
    for (const [key, data] of userMembershipMap) {
      try {
        const startDate = new Date(data.startDate);
        let endDate = null;
        
        // Determine end date
        if (data.membershipType === "LIFETIME") {
          endDate = new Date("2099-12-31");
        } else if (data.membershipType === "12_BULAN") {
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 12);
        } else if (data.membershipType === "6_BULAN") {
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 6);
        }
        
        await prisma.userMembership.create({
          data: {
            id: `usermem_${data.userId}_${data.membershipId}`.substring(0, 25),
            userId: data.userId,
            membershipId: data.membershipId,
            startDate: startDate,
            endDate: endDate,
            isActive: true,
            status: "ACTIVE",
            activatedAt: new Date(),
            transactionId: data.transactionId,
            updatedAt: new Date(),
          },
        });
        
        created++;
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`   ⚠️  Error for user ${data.userId}:`, error.message.substring(0, 60));
        }
      }
    }
    
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // 6. Update user roles
    console.log("\n6️⃣  Updating user roles...");
    
    const userIds = Array.from(
      new Set(Array.from(userMembershipMap.values()).map((d) => d.userId))
    );
    
    // Event users tetap MEMBER_FREE, membership users jadi MEMBER_PREMIUM
    const updateMemberPremium = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role: "MEMBER_PREMIUM" },
    });
    
    console.log(`   ✅ Updated ${updateMemberPremium.count} to MEMBER_PREMIUM`);
    
    // 7. Statistics
    console.log("\n7️⃣  Statistics:");
    
    const totalUserMemberships = await prisma.userMembership.count();
    const lifetimeCount = await prisma.userMembership.count({
      where: { membershipId: lifetimeMem.id },
    });
    const bulan12Count = await prisma.userMembership.count({
      where: { membershipId: bulan12Mem.id },
    });
    const bulan6Count = await prisma.userMembership.count({
      where: { membershipId: bulan6Mem.id },
    });
    
    console.log(`   Total UserMemberships: ${totalUserMemberships}`);
    console.log(`     - Lifetime: ${lifetimeCount}`);
    console.log(`     - 12 Bulan: ${bulan12Count}`);
    console.log(`     - 6 Bulan: ${bulan6Count}`);
    
    // 8. Sample by type
    console.log("\n8️⃣  Sample UserMemberships per type:");
    
    for (const [memType, memRecord] of [
      ["Lifetime", lifetimeMem],
      ["12 Bulan", bulan12Mem],
      ["6 Bulan", bulan6Mem],
    ]) {
      const samples = await prisma.userMembership.findMany({
        where: { membershipId: memRecord.id },
        take: 3,
      });
      
      console.log(`\n   ${memType}:`);
      for (const um of samples) {
        const user = await prisma.user.findUnique({
          where: { id: um.userId },
          select: { email: true },
        });
        const endDate = um.endDate ? um.endDate.toISOString().split("T")[0] : "∞";
        console.log(`     - ${user.email} until ${endDate}`);
      }
    }
    
    console.log("\n✅ Membership system corrected successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
