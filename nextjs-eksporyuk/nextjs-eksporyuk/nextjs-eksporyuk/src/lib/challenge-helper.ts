import { prisma } from './prisma'
import { notificationService } from './services/notificationService'
import { starsenderService } from './services/starsenderService'
import { sendChallengeProgressUpdateEmail, sendChallengeCompletedEmail } from './challenge-email-helper'

/**
 * Challenge Helper
 * Untuk integrasi challenge dengan sistem affiliate
 * 
 * NOTE: Challenges menggunakan OPT-IN system:
 * - Affiliate harus BERGABUNG secara manual dengan klik tombol "Ikuti Challenge"
 * - Progress HANYA diupdate untuk challenge yang sudah diikuti
 * - Tidak ada auto-join untuk menjaga kontrol dan kesadaran affiliate
 */

interface UpdateChallengeProgressParams {
  affiliateId: string
  membershipId?: string | null
  productId?: string | null
  courseId?: string | null
  transactionAmount: number
}

/**
 * Update progress untuk semua challenge yang diikuti affiliate
 * Dipanggil saat ada konversi/penjualan yang dikonfirmasi
 */
export async function updateChallengeProgress(params: UpdateChallengeProgressParams) {
  const { affiliateId, membershipId, productId, courseId, transactionAmount } = params
  
  try {
    // Dapatkan tanggal sekarang
    const now = new Date()
    
    // Cari semua challenge aktif yang diikuti affiliate
    const activeProgress = await prisma.affiliateChallengeProgress.findMany({
      where: {
        affiliateId,
        completed: false,
        challenge: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          // Challenge harus match dengan produk yang dijual
          // ATAU tidak terhubung ke produk spesifik (semua produk)
          OR: [
            { membershipId: null, productId: null, courseId: null }, // Challenge untuk semua produk
            { membershipId: membershipId || undefined },
            { productId: productId || undefined },
            { courseId: courseId || undefined },
          ]
        }
      },
      include: {
        challenge: true
      }
    })

    // Update setiap progress
    for (const progress of activeProgress) {
      const challenge = progress.challenge
      
      // Skip jika challenge terhubung ke produk tertentu tapi tidak match
      if (challenge.membershipId && challenge.membershipId !== membershipId) continue
      if (challenge.productId && challenge.productId !== productId) continue
      if (challenge.courseId && challenge.courseId !== courseId) continue
      
      let incrementValue = 0
      
      // Tentukan nilai increment berdasarkan target type
      switch (challenge.targetType) {
        case 'SALES_COUNT':
        case 'CONVERSIONS':
        case 'NEW_CUSTOMERS':
          incrementValue = 1 // Setiap transaksi = 1
          break
        case 'REVENUE':
          incrementValue = transactionAmount // Jumlah transaksi
          break
        case 'CLICKS':
          // Klik ditrack terpisah, tidak di sini
          continue
        default:
          incrementValue = 1
      }
      
      const oldValue = Number(progress.currentValue)
      const newValue = oldValue + incrementValue
      const targetValue = Number(challenge.targetValue)
      const isCompleted = newValue >= targetValue
      
      // Calculate progress percentages
      const oldProgress = Math.floor((oldValue / targetValue) * 100)
      const newProgress = Math.floor((newValue / targetValue) * 100)
      
      // Check for milestone achievements (25%, 50%, 75%)
      const milestones = [25, 50, 75]
      const achievedMilestone = milestones.find(milestone => 
        oldProgress < milestone && newProgress >= milestone
      )
      
      await prisma.affiliateChallengeProgress.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
      
      // Send notifications for significant progress updates
      try {
        // Get affiliate user data
        const affiliate = await prisma.affiliateProfile.findUnique({
          where: { id: progress.affiliateId },
          include: {
            user: {
              select: { id: true, name: true, email: true, whatsapp: true, phone: true }
            }
          }
        })
        
        if (affiliate?.user) {
          const user = affiliate.user
          const progressPercentage = Math.min(100, Math.floor((newValue / targetValue) * 100))
          
          // Send completion notification
          if (isCompleted) {
            // Email notification
            if (user.email) {
              sendChallengeCompletedEmail({
                email: user.email,
                name: user.name || 'Affiliate',
                challengeName: challenge.title,
                targetValue: Number(challenge.targetValue),
                targetType: challenge.targetType.replace(/_/g, ' '),
                rewardValue: Number(challenge.rewardValue),
                rewardType: challenge.rewardType.replace(/_/g, ' '),
                currentValue: newValue,
                completionDate: new Date().toLocaleDateString('id-ID')
              }).catch(err => {
                console.error('Failed to send challenge completed email:', err)
              })
            }
            
            // Push notification
            notificationService.send({
              userId: user.id,
              type: 'AFFILIATE' as any,
              title: '🏆 Tantangan Selesai!',
              message: `Selamat! Anda telah menyelesaikan tantangan "${challenge.title}". Klaim reward Anda sekarang!`,
              link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/challenges/${challenge.id}`,
              channels: ['pusher', 'onesignal'],
              metadata: {
                challengeId: challenge.id,
                completed: true,
                rewardValue: challenge.rewardValue,
                rewardType: challenge.rewardType
              }
            }).catch(err => {
              console.error('Failed to send completion push notification:', err)
            })
            
            // WhatsApp notification
            const waNumber = user.whatsapp || user.phone
            if (waNumber && starsenderService.isConfigured()) {
              const waMessage = `🏆 *TANTANGAN SELESAI!*\n\nSelamat ${user.name}! 🎉\n\nAnda telah berhasil menyelesaikan tantangan:\n\n📋 *${challenge.title}*\n✅ Progress: ${newValue}/${targetValue} (100%)\n🎁 Reward: ${challenge.rewardType === 'CASH_BONUS' ? 'Rp ' + Number(challenge.rewardValue).toLocaleString('id-ID') : challenge.rewardType.replace(/_/g, ' ')}\n\n🚀 Jangan lupa klaim reward Anda!\n\nKlaim sekarang: ${process.env.NEXT_PUBLIC_APP_URL}/affiliate/challenges/${challenge.id}`
              
              starsenderService.sendWhatsApp({
                to: waNumber,
                message: waMessage
              }).catch(err => {
                console.error('Failed to send completion WhatsApp:', err)
              })
            }
          }
          // Send milestone notification
          else if (achievedMilestone) {
            // Push notification for milestone
            notificationService.send({
              userId: user.id,
              type: 'AFFILIATE' as any,
              title: `🎯 Milestone ${achievedMilestone}% Tercapai!`,
              message: `Progress tantangan "${challenge.title}": ${newValue}/${targetValue} (${progressPercentage}%). Terus semangat!`,
              link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/challenges/${challenge.id}`,
              channels: ['pusher'],
              metadata: {
                challengeId: challenge.id,
                milestone: achievedMilestone,
                currentValue: newValue,
                targetValue: challenge.targetValue
              }
            }).catch(err => {
              console.error('Failed to send milestone notification:', err)
            })
          }
          // Send progress update email for significant progress (every 10%)
          else if (Math.floor(newProgress / 10) > Math.floor(oldProgress / 10)) {
            if (user.email) {
              sendChallengeProgressUpdateEmail({
                email: user.email,
                name: user.name || 'Affiliate',
                challengeName: challenge.title,
                targetValue: Number(challenge.targetValue),
                targetType: challenge.targetType.replace(/_/g, ' '),
                rewardValue: Number(challenge.rewardValue),
                rewardType: challenge.rewardType.replace(/_/g, ' '),
                currentValue: newValue,
                progressPercentage: progressPercentage,
                remainingValue: Math.max(0, targetValue - newValue)
              }).catch(err => {
                console.error('Failed to send progress update email:', err)
              })
            }
          }
        }
      } catch (notifErr) {
        console.error('Error sending challenge notifications:', notifErr)
      }
      
      console.log(`[Challenge] Updated progress for ${challenge.title}: ${newValue}/${targetValue} (${isCompleted ? 'COMPLETED' : 'in progress'})`)
    }
    
    return { success: true, updatedCount: activeProgress.length }
  } catch (error) {
    console.error('[Challenge] Error updating progress:', error)
    return { success: false, error }
  }
}

/**
 * Update click count untuk challenge dengan target CLICKS
 * Dipanggil saat ada klik pada affiliate link
 */
export async function updateChallengeClickProgress(affiliateId: string) {
  try {
    const now = new Date()
    
    // Cari challenge dengan target CLICKS yang diikuti affiliate
    const clickChallenges = await prisma.affiliateChallengeProgress.findMany({
      where: {
        affiliateId,
        completed: false,
        challenge: {
          isActive: true,
          targetType: 'CLICKS',
          startDate: { lte: now },
          endDate: { gte: now }
        }
      },
      include: {
        challenge: true
      }
    })
    
    for (const progress of clickChallenges) {
      const newValue = Number(progress.currentValue) + 1
      const targetValue = Number(progress.challenge.targetValue)
      const isCompleted = newValue >= targetValue
      
      await prisma.affiliateChallengeProgress.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('[Challenge] Error updating click progress:', error)
    return { success: false, error }
  }
}

/**
 * Get challenge statistics for an affiliate
 */
export async function getAffiliateChallengeStats(affiliateId: string) {
  const now = new Date()
  
  const [total, active, completed, pendingReward] = await Promise.all([
    prisma.affiliateChallengeProgress.count({
      where: { affiliateId }
    }),
    prisma.affiliateChallengeProgress.count({
      where: {
        affiliateId,
        completed: false,
        challenge: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      }
    }),
    prisma.affiliateChallengeProgress.count({
      where: { affiliateId, completed: true }
    }),
    prisma.affiliateChallengeProgress.count({
      where: { affiliateId, completed: true, rewardClaimed: false }
    })
  ])
  
  return { total, active, completed, pendingReward }
}
