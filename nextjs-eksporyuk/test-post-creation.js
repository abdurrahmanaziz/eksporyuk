const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const createId = () => crypto.randomBytes(16).toString('hex');

async function testPostCreation() {
  console.log('🧪 TESTING POST CREATION\n');
  
  try {
    // Get an existing user
    const user = await prisma.user.findFirst({
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.error('❌ No users found');
      return;
    }

    console.log(`Testing post creation for user: ${user.name} (${user.id})\n`);

    // Attempt to create a post using the same logic as the API
    const newPost = await prisma.post.create({
      data: {
        id: createId(),
        content: 'Test post - ' + new Date().toISOString(),
        authorId: user.id,
        type: 'POST',
        approvalStatus: 'APPROVED',
        updatedAt: new Date(),
      }
    });

    console.log('✅ Post created successfully');
    console.log(`   ID: ${newPost.id}`);
    console.log(`   Content: ${newPost.content}`);
    console.log(`   Author: ${newPost.authorId}`);
    console.log(`   Status: ${newPost.approvalStatus}\n`);

    // Verify it exists
    const fetchedPost = await prisma.post.findUnique({
      where: { id: newPost.id }
    });

    if (fetchedPost) {
      console.log('✅ Post verified in database');
    } else {
      console.log('❌ Post not found after creation');
    }

    // Check total posts
    const totalPosts = await prisma.post.count();
    console.log(`\nTotal posts in database: ${totalPosts}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Details:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testPostCreation();
