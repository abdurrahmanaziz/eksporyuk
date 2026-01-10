import { prisma } from './prisma'

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
      
      const newValue = Number(progress.currentValue) + incrementValue
      const targetValue = Number(challenge.targetValue)
      const isCompleted = newValue >= targetValue
      
      await prisma.affiliateChallengeProgress.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
      
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
