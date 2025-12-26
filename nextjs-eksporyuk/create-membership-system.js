const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mapping produk ke membership berdasarkan Sejoli data
// Hardcode nilai membership IDs dari database
const MEMBERSHIP_MAPPING = {
  // Lifetime Membership
  13401: "mem_lifetime_1",
  3840: "mem_lifetime_2",
  17920: "mem_lifetime_promo",
  13399: "mem_lifetime_3",
  20852: "mem_lifetime_4",
  // 12 Bulan
  8683: "mem_12bulan_1",
  8684: "mem_12bulan_2",
  // 6 Bulan (jika ada)
  // Event/Webinar - skip
  19042: null,
  21476: null,
  18528: null,
  20130: null,
};

(async () => {
  console.log("📋 AUTO-ASSIGN USER MEMBERSHIPS (dari Transactions)");
  console.log("═".repeat(70));
  
  try {
    // 1. Get all successful transactions
    console.log("\n1️⃣  Fetching successful transactions...");
    const transactions = await prisma.transaction.findMany({
      where: { status: "SUCCESS" },
    });
    
    console.log(`   Found ${transactions.length} completed transactions`);
    
    // 2. Get membership records dari database
    console.log("\n2️⃣  Fetching memberships dari database...");
    const memberships = await prisma.membership.findMany();
    console.log(`   Found ${memberships.length} membership records`);
    
    if (memberships.length === 0) {
      console.log("   ⚠️  Tidak ada membership di database!");
      console.log("   Silakan buat membership terlebih dahulu di admin panel");
      process.exit(1);
    }
    
    // 3. Create user memberships
    console.log("\n3️⃣  Creating UserMembership records...");
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Mapping: user + membership
    const userMembershipMap = new Map();
    
    for (const tx of transactions) {
      const productId = parseInt(tx.productId) || tx.productId;
      const membership = memberships.find(
        (m) =>
          m.name.includes("Lifetime") ||
          m.name.includes("12 Bulan") ||
          m.name.includes("6 Bulan")
      );
      
      if (!membership) {
        skipped++;
        continue;
      }
      
      const key = `${tx.userId}_${membership.id}`;
      
      if (!userMembershipMap.has(key)) {
        userMembershipMap.set(key, {
          userId: tx.userId,
          membershipId: membership.id,
          startDate: tx.createdAt,
          transactionId: tx.id,
          membershipName: membership.name,
        });
      }
    }
    
    console.log(`   Mapped ${userMembershipMap.size} user-membership pairs`);
    
    // 4. Create/update UserMembership records
    console.log("\n4️⃣  Upserting UserMembership records...");
    
    for (const [key, data] of userMembershipMap) {
      try {
        const startDate = new Date(data.startDate);
        let endDate = null;
        
        // Tentukan end date berdasarkan membership name
        if (data.membershipName.includes("Lifetime")) {
          // Lifetime: no end date
          endDate = new Date("9999-12-31");
        } else if (data.membershipName.includes("12")) {
          // 12 bulan
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 12);
        } else if (data.membershipName.includes("6")) {
          // 6 bulan
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 6);
        }
        
        const userMembership = await prisma.userMembership.upsert({
          where: {
            userId_membershipId: {
              userId: data.userId,
              membershipId: data.membershipId,
            },
          },
          update: {
            startDate: startDate,
            endDate: endDate,
            transactionId: data.transactionId,
            isActive: true,
            status: "ACTIVE",
            activatedAt: new Date(),
          },
          create: {
            id: `usermem_${data.userId}_${data.membershipId}`,
            userId: data.userId,
            membershipId: data.membershipId,
            startDate: startDate,
            endDate: endDate,
            isActive: true,
            status: "ACTIVE",
            activatedAt: new Date(),
            transactionId: data.transactionId,
          },
        });
        
        // Check if created or updated
        const isNew = new Date(userMembership.createdAt).getTime() ===
          new Date(startDate).getTime();
        
        if (isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Error for ${key}:`, error.message);
      }
    }
    
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // 5. Update user roles to MEMBER_PREMIUM
    console.log("\n5️⃣  Updating user roles to MEMBER_PREMIUM...");
    
    const userIds = Array.from(
      new Set(Array.from(userMembershipMap.values()).map((d) => d.userId))
    );
    
    const updateResult = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role: "MEMBER_PREMIUM" },
    });
    
    console.log(`   ✅ Updated ${updateResult.count} users to MEMBER_PREMIUM`);
    
    // 6. Statistics
    console.log("\n6️⃣  Statistics:");
    
    const totalUserMemberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({
      where: { isActive: true },
    });
    const memberPremiumUsers = await prisma.user.count({
      where: { role: "MEMBER_PREMIUM" },
    });
    
    console.log(`   Total UserMemberships: ${totalUserMemberships}`);
    console.log(`   Active: ${activeMemberships}`);
    console.log(`   Member Premium Users: ${memberPremiumUsers}`);
    
    // 7. Sample data
    console.log("\n7️⃣  Sample UserMemberships (10):");
    
    const samples = await prisma.userMembership.findMany({
      take: 10,
      include: {
        user: { select: { id: true, email: true } },
        membership: { select: { id: true, name: true } },
      },
    });
    
    samples.forEach((um, idx) => {
      const endDate = um.endDate ? um.endDate.toISOString().split("T")[0] : "∞";
      console.log(
        `   ${idx + 1}. ${um.user.email} → ${um.membership.name} (${um.isActive ? "✅" : "❌"}) until ${endDate}`
      );
    });
    
    console.log("\n✅ UserMembership system created successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
