const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  console.log("📋 AUTO-ASSIGN USER MEMBERSHIPS (dari Transactions)");
  console.log("═".repeat(70));
  
  try {
    // 1. Get all successful transactions
    console.log("\n1️⃣  Fetching successful transactions...");
    const transactions = await prisma.transaction.findMany({
      where: { status: "SUCCESS" },
    });
    
    console.log(`   Found ${transactions.length} transactions`);
    
    // 2. Get membership records
    console.log("\n2️⃣  Fetching memberships...");
    const memberships = await prisma.membership.findMany();
    console.log(`   Found ${memberships.length} memberships`);
    
    // Get all memberships by duration for mapping
    const lifetimeMem = memberships.find(m => m.duration === "LIFETIME");
    const bulan12Mem = memberships.find(m => m.duration === "TWELVE_MONTHS");
    const bulan6Mem = memberships.find(m => m.duration === "SIX_MONTHS");
    
    if (!lifetimeMem || !bulan12Mem || !bulan6Mem) {
      console.error("   ❌ Membership tidak lengkap!");
      process.exit(1);
    }
    
    console.log(`   Lifetime: ${lifetimeMem.name}`);
    console.log(`   12 Bulan: ${bulan12Mem.name}`);
    console.log(`   6 Bulan: ${bulan6Mem.name}`);
    
    // 3. Map transactions to users + membership
    console.log("\n3️⃣  Mapping users to memberships...");
    
    const userMembershipMap = new Map();
    
    transactions.forEach((tx) => {
      const key = tx.userId;
      
      // Default ke Lifetime membership (most common)
      let membership = lifetimeMem;
      
      // Bisa di-refine berdasarkan productId jika diperlukan
      // Untuk sekarang, semua dapat Lifetime
      
      if (!userMembershipMap.has(key)) {
        userMembershipMap.set(key, {
          userId: tx.userId,
          membershipId: membership.id,
          startDate: tx.createdAt,
          transactionId: tx.id,
          membershipName: membership.name,
        });
      }
    });
    
    console.log(`   Mapped ${userMembershipMap.size} users`);
    
    // 4. Delete existing UserMemberships for clean slate
    console.log("\n4️⃣  Cleaning existing UserMemberships...");
    const deletedCount = await prisma.userMembership.deleteMany();
    console.log(`   Deleted ${deletedCount.count} existing records`);
    
    // 5. Create UserMembership records
    console.log("\n5️⃣  Creating UserMembership records...");
    
    let created = 0;
    let errors = 0;
    
    for (const [key, data] of userMembershipMap) {
      try {
        const startDate = new Date(data.startDate);
        let endDate = null;
        
        // Determine end date based on membership
        if (data.membershipName.includes("Lifetime")) {
          // Lifetime: no end date (very far future)
          endDate = new Date("2099-12-31");
        } else if (data.membershipName.includes("12")) {
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 12);
        } else if (data.membershipName.includes("6")) {
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
          console.error(
            `   ⚠️  Error for user ${data.userId}:`,
            error.message.substring(0, 80)
          );
        }
      }
    }
    
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // 6. Update user roles
    console.log("\n6️⃣  Updating user roles to MEMBER_PREMIUM...");
    
    const userIds = Array.from(
      new Set(Array.from(userMembershipMap.values()).map((d) => d.userId))
    );
    
    const updateResult = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role: "MEMBER_PREMIUM" },
    });
    
    console.log(`   ✅ Updated ${updateResult.count} users`);
    
    // 7. Statistics
    console.log("\n7️⃣  Statistics:");
    
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
    
    // 8. Sample data
    console.log("\n8️⃣  Sample UserMemberships (10):");
    
    const samples = await prisma.userMembership.findMany({
      take: 10,
    });
    
    for (const um of samples) {
      const user = await prisma.user.findUnique({
        where: { id: um.userId },
        select: { email: true },
      });
      const membership = await prisma.membership.findUnique({
        where: { id: um.membershipId },
        select: { name: true },
      });
      const endDate = um.endDate ? um.endDate.toISOString().split("T")[0] : "∞";
      console.log(
        `   - ${user.email} → ${membership.name} (${um.isActive ? "✅" : "❌"}) until ${endDate}`
      );
    }
    
    console.log("\n✅ UserMembership system created successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
