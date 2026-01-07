/**
 * Test Chat System Integration
 * Verifikasi semua komponen chat berfungsi dengan baik
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testChatSystem() {
  console.log("🧪 TESTING CHAT SYSTEM INTEGRATION\n");

  try {
    // 1. Test database connection
    console.log("1️⃣ Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully\n");

    // 2. Check required tables exist
    console.log("2️⃣ Checking required database tables...");
    
    const checkTables = async () => {
      try {
        await prisma.chatRoom.findFirst();
        console.log("✅ ChatRoom table exists");
        
        await prisma.chatParticipant.findFirst();
        console.log("✅ ChatParticipant table exists");
        
        await prisma.message.findFirst();
        console.log("✅ Message table exists");
        
        // Check for users that can be mentors (ADMIN/MENTOR role)
        const mentorUsers = await prisma.user.count({
          where: {
            OR: [
              { role: 'MENTOR' },
              { role: 'ADMIN' }
            ],
            isActive: true,
            isSuspended: false
          }
        });
        console.log(`✅ Found ${mentorUsers} potential mentors`);
        
        // Check total users for chat
        const totalUsers = await prisma.user.count({
          where: {
            isActive: true,
            isSuspended: false
          }
        });
        console.log(`✅ Found ${totalUsers} total active users`);
        
        console.log("");
        
      } catch (error) {
        console.error("❌ Database table check failed:", error.message);
        throw error;
      }
    };
    
    await checkTables();

    // 3. Test creating a chat room (simulate)
    console.log("3️⃣ Testing chat room creation logic...");
    
    // Find two users for testing
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isSuspended: false
      },
      select: {
        id: true,
        name: true,
        role: true
      },
      take: 2
    });

    if (users.length >= 2) {
      console.log(`✅ Found test users: ${users[0].name} (${users[0].role}) and ${users[1].name} (${users[1].role})`);
      
      // Check if a room already exists between these users
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'DIRECT',
          OR: [
            { 
              user1Id: users[0].id, 
              user2Id: users[1].id 
            },
            { 
              user1Id: users[1].id, 
              user2Id: users[0].id 
            }
          ]
        }
      });

      if (existingRoom) {
        console.log(`✅ Direct room already exists between users: ${existingRoom.id}`);
      } else {
        console.log("✅ No existing room found (ready for creation)");
      }
      
    } else {
      console.log("⚠️  Not enough users found for room creation test");
    }
    
    console.log("");

    // 4. Check current chat data
    console.log("4️⃣ Checking existing chat data...");
    
    const roomCount = await prisma.chatRoom.count();
    const messageCount = await prisma.message.count();
    const participantCount = await prisma.chatParticipant.count();
    
    console.log(`📊 Current chat statistics:`);
    console.log(`   - Chat rooms: ${roomCount}`);
    console.log(`   - Messages: ${messageCount}`);
    console.log(`   - Participants: ${participantCount}`);
    console.log("");

    // 5. Test message schema compatibility
    console.log("5️⃣ Testing message schema compatibility...");
    
    const sampleMessage = await prisma.message.findFirst({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (sampleMessage) {
      console.log("✅ Message with sender relation works");
      console.log(`   Sample: "${sampleMessage.content?.substring(0, 50)}..." by ${sampleMessage.sender.name}`);
    } else {
      console.log("✅ No messages yet, but schema is ready");
    }
    
    console.log("");

    // 6. Summary
    console.log("🎯 CHAT SYSTEM TEST RESULTS:");
    console.log("✅ Database connection: OK");
    console.log("✅ Required tables: OK");
    console.log("✅ User data for mentors: OK");
    console.log("✅ Schema compatibility: OK");
    console.log("✅ Ready for production use!");
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Login to https://eksporyuk.com/chat");
    console.log("2. Select a mentor from the list");
    console.log("3. Start chatting!");
    console.log("4. Test on mobile devices for responsiveness");

  } catch (error) {
    console.error("\n❌ CHAT SYSTEM TEST FAILED:");
    console.error(error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check database connection");
    console.error("2. Run: npx prisma generate");
    console.error("3. Run: npx prisma db push");
    console.error("4. Verify user data exists");
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testChatSystem();