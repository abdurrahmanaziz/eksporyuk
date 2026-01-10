import { prisma } from '@/lib/prisma'

// Point values for different activities
const POINT_VALUES = {
  POST: 5,
  COMMENT: 3,
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 2,
  QUIZ_COMPLETE: 10,
  QUIZ_PASS: 20,
  CHALLENGE_COMPLETE: 50,
  BADGE_EARN: 10,
  STORY_POST: 3
}

// Badge condition types
type BadgeConditionType = 
  | 'posts_count' 
  | 'comments_count' 
  | 'reactions_given' 
  | 'reactions_received'
  | 'quiz_pass_count'
  | 'consecutive_days'
  | 'points_total'
  | 'challenge_wins'

interface BadgeCondition {
  type: BadgeConditionType
  threshold: number
}

export const gamificationService = {
  /**
   * Award points to a user for an activity
   */
  async awardPoints(
    userId: string,
    groupId: string,
    type: keyof typeof POINT_VALUES,
    sourceId?: string,
    description?: string
  ) {
    const points = POINT_VALUES[type] || 0
    
    if (points === 0) return

    // Update user points
    await prisma.userPoints.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      },
      update: {
        points: { increment: points },
        totalEarned: { increment: points }
      },
      create: {
        userId,
        groupId,
        points,
        totalEarned: points
      }
    })

    // Log transaction
    await prisma.pointTransaction.create({
      data: {
        userId,
        groupId,
        points,
        type,
        sourceId,
        description: description || `Points earned for ${type.toLowerCase()}`
      }
    })

    // Check for badge eligibility after awarding points
    await this.checkBadgeEligibility(userId, groupId)

    return points
  },

  /**
   * Check if user is eligible for any badges based on their activity
   */
  async checkBadgeEligibility(userId: string, groupId: string) {
    // Get all badges with conditions
    const badges = await prisma.badgeDefinition.findMany({
      where: {
        isActive: true,
        conditions: { not: null }
      }
    })

    // Get user's existing badges
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId,
        OR: [
          { groupId },
          { groupId: null }
        ]
      }
    })
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

    // Get user stats
    const stats = await this.getUserStats(userId, groupId)

    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue

      const conditions = badge.conditions as BadgeCondition | BadgeCondition[]
      const conditionsArray = Array.isArray(conditions) ? conditions : [conditions]

      // Check if all conditions are met
      const allConditionsMet = conditionsArray.every(condition => {
        switch (condition.type) {
          case 'posts_count':
            return stats.postsCount >= condition.threshold
          case 'comments_count':
            return stats.commentsCount >= condition.threshold
          case 'reactions_given':
            return stats.reactionsGiven >= condition.threshold
          case 'reactions_received':
            return stats.reactionsReceived >= condition.threshold
          case 'quiz_pass_count':
            return stats.quizPassCount >= condition.threshold
          case 'points_total':
            return stats.totalPoints >= condition.threshold
          case 'challenge_wins':
            return stats.challengeWins >= condition.threshold
          default:
            return false
        }
      })

      if (allConditionsMet) {
        await this.awardBadge(userId, badge.id, groupId, `Auto-awarded for meeting badge conditions`)
      }
    }
  },

  /**
   * Get user's activity stats for a group
   */
  async getUserStats(userId: string, groupId: string) {
    const [
      postsCount,
      commentsCount,
      reactionsGiven,
      reactionsReceived,
      quizPassCount,
      challengeWins,
      userPoints
    ] = await Promise.all([
      // Posts count
      prisma.post.count({
        where: {
          authorId: userId,
          groupId,
          type: { in: ['POST', 'POLL', 'ANNOUNCEMENT'] }
        }
      }),
      // Comments count
      prisma.postComment.count({
        where: {
          userId,
          post: { groupId }
        }
      }),
      // Reactions given
      prisma.postReaction.count({
        where: {
          userId,
          post: { groupId }
        }
      }),
      // Reactions received
      prisma.postReaction.count({
        where: {
          post: {
            authorId: userId,
            groupId
          }
        }
      }),
      // Quiz passes
      prisma.groupQuizAttempt.count({
        where: {
          userId,
          isPassed: true,
          quiz: { groupId }
        }
      }),
      // Challenge wins (rank 1)
      prisma.challengProgress.count({
        where: {
          userId,
          isCompleted: true,
          rank: 1,
          challenge: { groupId }
        }
      }),
      // User points
      prisma.userPoints.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        }
      })
    ])

    return {
      postsCount,
      commentsCount,
      reactionsGiven,
      reactionsReceived,
      quizPassCount,
      challengeWins,
      totalPoints: userPoints?.totalEarned || 0,
      currentPoints: userPoints?.points || 0,
      level: userPoints?.level || 1
    }
  },

  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: string,
    badgeId: string,
    groupId?: string,
    reason?: string,
    awardedBy?: string
  ) {
    // Check if already has badge
    const existing = await prisma.userBadge.findFirst({
      where: {
        userId,
        badgeId,
        groupId: groupId || null
      }
    })

    if (existing) return null

    // Award badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        groupId,
        reason,
        awardedBy
      },
      include: {
        badge: true
      }
    })

    // Award badge points
    if (userBadge.badge.points && groupId) {
      await prisma.userPoints.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        },
        update: {
          points: { increment: userBadge.badge.points },
          totalEarned: { increment: userBadge.badge.points }
        },
        create: {
          userId,
          groupId,
          points: userBadge.badge.points,
          totalEarned: userBadge.badge.points
        }
      })

      await prisma.pointTransaction.create({
        data: {
          userId,
          groupId,
          points: userBadge.badge.points,
          type: 'BADGE_EARN',
          sourceId: badgeId,
          description: `Badge earned: ${userBadge.badge.name}`
        }
      })
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'BADGE_EARNED',
        title: 'Badge Baru! 🏆',
        message: `Selamat! Kamu mendapatkan badge "${userBadge.badge.name}"`,
        link: groupId ? `/community/groups/${groupId}/badges` : '/profile/badges'
      }
    })

    return userBadge
  },

  /**
   * Calculate and update user level based on total points
   */
  async updateUserLevel(userId: string, groupId: string) {
    const userPoints = await prisma.userPoints.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    })

    if (!userPoints) return 1

    // Level calculation: level = sqrt(totalEarned / 100) + 1
    const newLevel = Math.floor(Math.sqrt(userPoints.totalEarned / 100)) + 1

    if (newLevel !== userPoints.level) {
      await prisma.userPoints.update({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        },
        data: { level: newLevel }
      })

      // Notify user of level up
      if (newLevel > userPoints.level) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'LEVEL_UP',
            title: 'Level Up! 🎉',
            message: `Selamat! Kamu naik ke Level ${newLevel}!`,
            link: `/community/groups/${groupId}/leaderboard`
          }
        })
      }
    }

    return newLevel
  },

  /**
   * Update challenge progress based on activity type
   */
  async updateChallengeProgress(
    userId: string,
    groupId: string,
    activityType: string,
    count: number = 1
  ) {
    const now = new Date()

    // Find active challenges matching the activity type
    const challenges = await prisma.groupChallenge.findMany({
      where: {
        groupId,
        isActive: true,
        type: activityType,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })

    for (const challenge of challenges) {
      // Update or create progress
      await prisma.challengProgress.upsert({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId
          }
        },
        update: {
          progress: { increment: count }
        },
        create: {
          challengeId: challenge.id,
          userId,
          progress: count
        }
      })

      // Check if target reached
      if (challenge.target) {
        const progress = await prisma.challengProgress.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId
            }
          }
        })

        if (progress && progress.progress >= challenge.target && !progress.isCompleted) {
          await prisma.challengProgress.update({
            where: {
              challengeId_userId: {
                challengeId: challenge.id,
                userId
              }
            },
            data: {
              isCompleted: true,
              completedAt: now
            }
          })

          // Award challenge points
          await this.awardPoints(userId, groupId, 'CHALLENGE_COMPLETE', challenge.id, `Completed challenge: ${challenge.title}`)
        }
      }
    }
  }
}

export default gamificationService
