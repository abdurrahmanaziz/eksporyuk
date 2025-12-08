import { prisma } from './prisma'
import { Prisma } from '@prisma/client'
import { notificationService } from './services/notificationService'
import { starsenderService } from './starsender'

/**
 * Revenue Split Configuration
 * - Affiliate: 30% flat
 * - Company (Admin): 15%
 * - Remaining: 55% split to Founder (60%) & Co-Founder (40%)
 */

interface RevenueSplitResult {
  affiliate: number
  company: number
  founder: number
  coFounder: number
  mentor?: number
  total: number
  breakdown: string[]
}

interface SplitOptions {
  amount: number
  type: 'MEMBERSHIP' | 'COURSE' | 'PRODUCT' | 'EVENT' | 'SUPPLIER'
  affiliateId?: string
  membershipId?: string
  courseId?: string
  productId?: string
  eventId?: string
  eventCreatorId?: string
  mentorId?: string
  mentorCommissionPercent?: number
  transactionId?: string
  supplierPackageId?: string
}

/**
 * Calculate revenue split based on transaction type
 */
export async function calculateRevenueSplit(
  options: SplitOptions
): Promise<RevenueSplitResult> {
  const { 
    amount, 
    type, 
    affiliateId, 
    courseId, 
    mentorId,
    mentorCommissionPercent 
  } = options

  let breakdown: string[] = []
  let remaining = amount

  // Step 1: Affiliate Commission - Get from Membership/Product/Event/Course/Supplier settings
  let affiliateAmount = 0
  if (affiliateId) {
    let commissionType = 'PERCENTAGE'
    let commissionRate = 30
    
    // Get commission settings from membership, product, event, course, or supplier package
    if (type === 'MEMBERSHIP' && options.membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: options.membershipId },
        select: { commissionType: true, affiliateCommissionRate: true }
      })
      if (membership) {
        commissionType = membership.commissionType || 'PERCENTAGE'
        commissionRate = Number(membership.affiliateCommissionRate) || 30
      }
    } else if (type === 'PRODUCT' && options.productId) {
      const product = await prisma.product.findUnique({
        where: { id: options.productId },
        select: { commissionType: true, affiliateCommissionRate: true }
      })
      if (product) {
        commissionType = product.commissionType || 'PERCENTAGE'
        commissionRate = Number(product.affiliateCommissionRate) || 30
      }
    } else if (type === 'EVENT' && options.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: options.eventId },
        select: { commissionType: true, commissionRate: true }
      })
      if (event) {
        commissionType = event.commissionType || 'PERCENTAGE'
        commissionRate = Number(event.commissionRate) || 30
      }
    } else if (type === 'COURSE' && options.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: options.courseId },
        select: { commissionType: true, affiliateCommissionRate: true }
      })
      if (course) {
        commissionType = course.commissionType || 'PERCENTAGE'
        commissionRate = Number(course.affiliateCommissionRate) || 30
      }
    } else if (type === 'SUPPLIER' && options.supplierPackageId) {
      const supplierPackage = await prisma.supplierPackage.findUnique({
        where: { id: options.supplierPackageId },
        select: { commissionType: true, affiliateCommissionRate: true }
      })
      if (supplierPackage) {
        commissionType = supplierPackage.commissionType || 'PERCENTAGE'
        commissionRate = Number(supplierPackage.affiliateCommissionRate) || 30
      }
    }
    
    // Calculate based on type
    if (commissionType === 'FLAT') {
      affiliateAmount = commissionRate // Fixed amount
      breakdown.push(`Affiliate (Flat): Rp ${affiliateAmount.toLocaleString('id-ID')}`)
    } else {
      affiliateAmount = amount * (commissionRate / 100)
      breakdown.push(`Affiliate (${commissionRate}%): Rp ${affiliateAmount.toLocaleString('id-ID')}`)
    }
    
    remaining -= affiliateAmount
  }

  // Step 2: Check if this is a Mentor course OR Event creator commission
  let mentorAmount = 0
  let eventCreatorCommissionPercent = 0
  
  if (type === 'COURSE' && mentorId && mentorCommissionPercent) {
    // Get mentor info
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { isFounder: true, isCoFounder: true }
    })

    // COURSE COMMISSION FLOW:
    // 1. Harga Course (misal 500rb)
    // 2. Dikurangi Affiliate Commission (dari affiliateCommissionRate course) - sudah dihitung di step 1
    // 3. Sisa dikurangi Mentor Commission % (mentorCommissionPercent)
    // 4. Sisanya untuk Ekspor Yuk (masuk ke company, bukan split founder/cofounder)
    
    // Only apply mentor commission if NOT founder/co-founder
    if (mentor && !mentor.isFounder && !mentor.isCoFounder) {
      // Mentor gets % from REMAINING after affiliate
      mentorAmount = remaining * (mentorCommissionPercent / 100)
      remaining = remaining - mentorAmount
      breakdown.push(`Mentor (${mentorCommissionPercent}% dari sisa): Rp ${mentorAmount.toLocaleString('id-ID')}`)
      breakdown.push(`Ekspor Yuk (sisanya): Rp ${remaining.toLocaleString('id-ID')}`)
      
      // For COURSE type, remaining goes to company (Ekspor Yuk), no founder/cofounder split
      return {
        affiliate: affiliateAmount,
        company: remaining, // All remaining goes to company (Ekspor Yuk)
        founder: 0,
        coFounder: 0,
        mentor: mentorAmount,
        total: amount,
        breakdown
      }
    } else {
      // Mentor is founder/co-founder, no separate mentor commission
      // All remaining goes to company
      breakdown.push(`Ekspor Yuk (mentor adalah founder): Rp ${remaining.toLocaleString('id-ID')}`)
      return {
        affiliate: affiliateAmount,
        company: remaining,
        founder: 0,
        coFounder: 0,
        mentor: 0,
        total: amount,
        breakdown
      }
    }
  } else if (type === 'EVENT' && options.eventCreatorId && options.eventId) {
    // For paid events, event creator gets a commission
    // Default: 70% to event creator, rest split with company/founder/cofounder
    const event = await prisma.event.findUnique({
      where: { id: options.eventId },
      select: { creatorId: true, commissionType: true, commissionRate: true }
    })
    
    if (event && event.creatorId === options.eventCreatorId) {
      // Calculate event creator commission
      // commissionRate on Event model represents % that goes to creator
      const creatorCommissionRate = Number(event.commissionRate) || 70
      eventCreatorCommissionPercent = creatorCommissionRate
      mentorAmount = amount * (eventCreatorCommissionPercent / 100)
      remaining = amount - mentorAmount - affiliateAmount // Subtract affiliate first
      breakdown.push(`Event Creator (${eventCreatorCommissionPercent}%): Rp ${mentorAmount.toLocaleString('id-ID')}`)
    }
  }

  // Step 3: Company Fee (15% of remaining)
  const companyAmount = remaining * 0.15
  remaining -= companyAmount
  breakdown.push(`Perusahaan (15%): Rp ${companyAmount.toLocaleString('id-ID')}`)

  // Step 4: Split remaining to Founder & Co-Founder
  const founderAmount = remaining * 0.60 // 60%
  const coFounderAmount = remaining * 0.40 // 40%
  breakdown.push(`Founder (60%): Rp ${founderAmount.toLocaleString('id-ID')}`)
  breakdown.push(`Co-Founder (40%): Rp ${coFounderAmount.toLocaleString('id-ID')}`)

  return {
    affiliate: affiliateAmount,
    company: companyAmount,
    founder: founderAmount,
    coFounder: coFounderAmount,
    mentor: mentorAmount,
    total: amount,
    breakdown
  }
}

/**
 * Process transaction and distribute revenue to wallets
 */
export async function processRevenueDistribution(
  options: SplitOptions
): Promise<void> {
  const split = await calculateRevenueSplit(options)

  // Get Founder & Co-Founder
  const founder = await prisma.user.findFirst({
    where: { isFounder: true },
    select: { id: true }
  })

  const coFounder = await prisma.user.findFirst({
    where: { isCoFounder: true },
    select: { id: true }
  })

  // Get Admin (for company wallet)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true }
  })

  // Update wallets in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Affiliate wallet
    if (options.affiliateId && split.affiliate > 0) {
      await tx.wallet.upsert({
        where: { userId: options.affiliateId },
        create: {
          userId: options.affiliateId,
          balance: split.affiliate,
          totalEarnings: split.affiliate
        },
        update: {
          balance: { increment: split.affiliate },
          totalEarnings: { increment: split.affiliate }
        }
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: options.affiliateId,
          amount: split.affiliate,
          type: 'COMMISSION',
          status: 'SUCCESS',
          description: `Komisi Affiliate - ${options.type}`
        }
      })

      // 🔔 SEND COMMISSION NOTIFICATION TO AFFILIATE
      try {
        const affiliateUser = await tx.user.findUnique({
          where: { id: options.affiliateId },
          select: { name: true, whatsapp: true, phone: true }
        })

        // Send multi-channel notification
        await notificationService.send({
          userId: options.affiliateId,
          type: 'AFFILIATE' as any,
          title: '💰 Komisi Baru Diterima!',
          message: `Selamat! Anda mendapat komisi sebesar Rp ${split.affiliate.toLocaleString('id-ID')} dari penjualan ${options.type}.`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/earnings`,
          channels: ['pusher', 'onesignal', 'email'],
          metadata: {
            commissionAmount: split.affiliate,
            type: options.type,
            transactionId: options.transactionId,
          }
        })

        // Send WhatsApp notification
        const waNumber = affiliateUser?.whatsapp || affiliateUser?.phone
        if (waNumber && starsenderService.isConfigured()) {
          await starsenderService.sendWhatsApp({
            to: waNumber,
            message: `💰 *Komisi Baru!*\n\nHalo ${affiliateUser?.name || 'Partner'}!\n\nSelamat, Anda mendapat komisi:\n\n📦 *Tipe:* ${options.type}\n💵 *Jumlah:* Rp ${split.affiliate.toLocaleString('id-ID')}\n\nKomisi sudah masuk ke saldo Anda. Terus semangat! 🚀\n\nCek saldo: ${process.env.NEXT_PUBLIC_APP_URL}/affiliate/earnings`
          })
        }
      } catch (notifError) {
        console.error('Error sending commission notification:', notifError)
        // Don't throw - notification failure shouldn't block the transaction
      }
    }

    // 2. Mentor/Event Creator wallet (if applicable)
    const mentorOrCreatorId = options.type === 'EVENT' ? options.eventCreatorId : options.mentorId
    const mentorOrCreatorType = options.type === 'EVENT' ? 'Event Creator' : 'Mentor'
    
    if (mentorOrCreatorId && split.mentor && split.mentor > 0) {
      await tx.wallet.upsert({
        where: { userId: mentorOrCreatorId },
        create: {
          userId: mentorOrCreatorId,
          balance: split.mentor,
          totalEarnings: split.mentor
        },
        update: {
          balance: { increment: split.mentor },
          totalEarnings: { increment: split.mentor }
        }
      })

      await tx.transaction.create({
        data: {
          userId: mentorOrCreatorId,
          amount: split.mentor,
          type: 'COMMISSION',
          status: 'SUCCESS',
          description: `Komisi ${mentorOrCreatorType} - ${options.type}`,
          eventId: options.type === 'EVENT' ? options.eventId : undefined
        }
      })

      // 🔔 SEND COMMISSION NOTIFICATION TO MENTOR/EVENT CREATOR
      try {
        const user = await tx.user.findUnique({
          where: { id: mentorOrCreatorId },
          select: { name: true, whatsapp: true, phone: true }
        })

        // Determine message based on type
        const isMentor = options.type === 'COURSE'
        const title = isMentor ? '💰 Komisi Mentor Diterima!' : '💰 Penjualan Tiket Event!'
        const message = isMentor 
          ? `Selamat! Anda mendapat komisi mentor sebesar Rp ${split.mentor.toLocaleString('id-ID')} dari penjualan kelas.`
          : `Selamat! Event Anda terjual! Anda menerima Rp ${split.mentor.toLocaleString('id-ID')} dari penjualan tiket.`

        // Send multi-channel notification
        await notificationService.send({
          userId: mentorOrCreatorId,
          type: 'GENERAL' as any,
          title,
          message,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/earnings`,
          channels: ['pusher', 'onesignal', 'email'],
          metadata: {
            commissionAmount: split.mentor,
            type: options.type,
            transactionId: options.transactionId,
            eventId: options.eventId,
          }
        })

        // Send WhatsApp notification
        const waNumber = user?.whatsapp || user?.phone
        if (waNumber && starsenderService.isConfigured()) {
          const waMessage = isMentor
            ? `💰 *Komisi Mentor!*\n\nHalo ${user?.name || 'Mentor'}!\n\nSelamat, Anda mendapat komisi mentor:\n\n📚 *Tipe:* ${options.type}\n💵 *Jumlah:* Rp ${split.mentor.toLocaleString('id-ID')}\n\nKomisi sudah masuk ke saldo Anda. 🚀`
            : `💰 *Penjualan Event!*\n\nHalo ${user?.name || 'Host'}!\n\nSelamat! Ada yang membeli tiket event Anda:\n\n🎉 *Penerimaan:* Rp ${split.mentor.toLocaleString('id-ID')}\n\nUang sudah masuk ke saldo Anda. Terima kasih! 🙏`
          
          await starsenderService.sendWhatsApp({
            to: waNumber,
            message: waMessage
          })
        }
      } catch (notifError) {
        console.error(`Error sending ${mentorOrCreatorType} commission notification:`, notifError)
      }
    }

    // 3. Company (Admin) wallet
    if (admin && split.company > 0) {
      await tx.wallet.upsert({
        where: { userId: admin.id },
        create: {
          userId: admin.id,
          balance: split.company,
          totalEarnings: split.company
        },
        update: {
          balance: { increment: split.company },
          totalEarnings: { increment: split.company }
        }
      })

      await tx.transaction.create({
        data: {
          userId: admin.id,
          amount: split.company,
          type: 'COMMISSION',
          status: 'SUCCESS',
          description: `Fee Perusahaan - ${options.type}`
        }
      })
    }

    // 4. Founder wallet
    if (founder && split.founder > 0) {
      await tx.wallet.upsert({
        where: { userId: founder.id },
        create: {
          userId: founder.id,
          balance: split.founder,
          totalEarnings: split.founder
        },
        update: {
          balance: { increment: split.founder },
          totalEarnings: { increment: split.founder }
        }
      })

      await tx.transaction.create({
        data: {
          userId: founder.id,
          amount: split.founder,
          type: 'COMMISSION',
          status: 'SUCCESS',
          description: `Revenue Share Founder (60%) - ${options.type}`
        }
      })
    }

    // 5. Co-Founder wallet
    if (coFounder && split.coFounder > 0) {
      await tx.wallet.upsert({
        where: { userId: coFounder.id },
        create: {
          userId: coFounder.id,
          balance: split.coFounder,
          totalEarnings: split.coFounder
        },
        update: {
          balance: { increment: split.coFounder },
          totalEarnings: { increment: split.coFounder }
        }
      })

      await tx.transaction.create({
        data: {
          userId: coFounder.id,
          amount: split.coFounder,
          type: 'COMMISSION',
          status: 'SUCCESS',
          description: `Revenue Share Co-Founder (40%) - ${options.type}`
        }
      })
    }

    // Create revenue split log
    await tx.activityLog.create({
      data: {
        userId: admin?.id || 'system',
        action: 'REVENUE_SPLIT',
        entityType: 'transaction',
        entityId: options.transactionId || 'unknown',
        metadata: split as any
      }
    })
  })
}

/**
 * Get revenue statistics for dashboard
 */
export async function getRevenueStats(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  const now = new Date()
  let startDate = new Date()

  switch (period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      startDate.setDate(now.getDate() - 7)
      break
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      status: 'SUCCESS',
      createdAt: {
        gte: startDate
      }
    },
    select: {
      amount: true,
      type: true,
      createdAt: true
    }
  })

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const byType = transactions.reduce((acc, t) => {
    const type = t.type
    acc[type] = (acc[type] || 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  return {
    total,
    byType,
    count: transactions.length,
    period
  }
}
