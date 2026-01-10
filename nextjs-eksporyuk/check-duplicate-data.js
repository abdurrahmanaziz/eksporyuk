import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js'

async function checkDuplicateData() {
  const prisma = new PrismaClient()

  try {
    console.log('🔍 Checking for duplicate data before applying constraints...')

    // Check PostLike duplicates
    const duplicatePostLikes = await prisma.$queryRaw`
      SELECT "postId", "userId", COUNT(*)
      FROM "PostLike"
      GROUP BY "postId", "userId"
      HAVING COUNT(*) > 1
    `
    console.log(`📊 Duplicate PostLikes:`, duplicatePostLikes)

    // Check PostReaction duplicates
    const duplicatePostReactions = await prisma.$queryRaw`
      SELECT "postId", "userId", "type", COUNT(*)
      FROM "PostReaction"
      GROUP BY "postId", "userId", "type"
      HAVING COUNT(*) > 1
    `
    console.log(`📊 Duplicate PostReactions:`, duplicatePostReactions)

    // Check CommentReaction duplicates
    const duplicateCommentReactions = await prisma.$queryRaw`
      SELECT "commentId", "userId", "type", COUNT(*)
      FROM "CommentReaction"
      GROUP BY "commentId", "userId", "type"
      HAVING COUNT(*) > 1
    `
    console.log(`📊 Duplicate CommentReactions:`, duplicateCommentReactions)

    // Check SavedPost duplicates
    const duplicateSavedPosts = await prisma.$queryRaw`
      SELECT "postId", "userId", COUNT(*)
      FROM "SavedPost"
      GROUP BY "postId", "userId"
      HAVING COUNT(*) > 1
    `
    console.log(`📊 Duplicate SavedPosts:`, duplicateSavedPosts)

    // Get counts
    const counts = await Promise.all([
      prisma.postLike.count(),
      prisma.postReaction.count(), 
      prisma.commentReaction.count(),
      prisma.savedPost.count()
    ])

    console.log('\n📈 Current record counts:')
    console.log(`PostLikes: ${counts[0]}`)
    console.log(`PostReactions: ${counts[1]}`)
    console.log(`CommentReactions: ${counts[2]}`)
    console.log(`SavedPosts: ${counts[3]}`)

    if (counts.every(c => c === 0)) {
      console.log('\n✅ No data found - safe to apply constraints!')
    }

  } catch (error) {
    console.error('❌ Error checking data:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateData()