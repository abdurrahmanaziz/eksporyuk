import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This cron job should run every minute to publish scheduled posts
// Set up in vercel.json or use external cron service

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow both cron secret and localhost for development
    const isLocal = req.url?.includes('localhost') || req.url?.includes('127.0.0.1')
    if (!isLocal && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all pending scheduled posts that should be published
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: now
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            slug: true,
            requireApproval: true
          }
        }
      }
    })

    if (scheduledPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts to publish',
        publishedCount: 0
      })
    }

    let publishedCount = 0
    let failedCount = 0

    for (const scheduled of scheduledPosts) {
      try {
        // Check if author is still a group member
        const membership = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: scheduled.groupId,
              userId: scheduled.authorId
            }
          }
        })

        if (!membership) {
          // Author is no longer a member, cancel the post
          await prisma.scheduledPost.update({
            where: { id: scheduled.id },
            data: {
              status: 'FAILED',
              errorMessage: 'Author is no longer a member of the group'
            }
          })
          failedCount++
          continue
        }

        // Determine approval status
        const isAdminOrMod = ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)
        const approvalStatus = (scheduled.group.requireApproval && !isAdminOrMod) ? 'PENDING' : 'APPROVED'

        // Create the actual post
        const post = await prisma.post.create({
          data: {
            authorId: scheduled.authorId,
            groupId: scheduled.groupId,
            content: scheduled.content,
            contentFormatted: scheduled.contentFormatted || undefined,
            images: scheduled.images || undefined,
            videos: scheduled.videos || undefined,
            documents: scheduled.documents || undefined,
            type: scheduled.type,
            approvalStatus
          }
        })

        // Update scheduled post status
        await prisma.scheduledPost.update({
          where: { id: scheduled.id },
          data: {
            status: 'PUBLISHED',
            publishedPostId: post.id
          }
        })

        publishedCount++

        // Award points for posting
        try {
          await prisma.userPoints.upsert({
            where: {
              userId_groupId: {
                userId: scheduled.authorId,
                groupId: scheduled.groupId
              }
            },
            update: {
              points: { increment: 5 },
              totalEarned: { increment: 5 }
            },
            create: {
              userId: scheduled.authorId,
              groupId: scheduled.groupId,
              points: 5,
              totalEarned: 5
            }
          })

          await prisma.pointTransaction.create({
            data: {
              userId: scheduled.authorId,
              groupId: scheduled.groupId,
              points: 5,
              type: 'SCHEDULED_POST',
              sourceId: post.id,
              description: 'Scheduled post published'
            }
          })
        } catch (pointsError) {
          console.error('Error awarding points:', pointsError)
        }

      } catch (error) {
        console.error(`Failed to publish scheduled post ${scheduled.id}:`, error)
        
        await prisma.scheduledPost.update({
          where: { id: scheduled.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        failedCount++
      }
    }

    return NextResponse.json({
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      publishedCount,
      failedCount
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
