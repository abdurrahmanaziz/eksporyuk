import { prisma } from './prisma'
import { sendPendingRevenueNotification } from './commission-notification-service'
import { renderBrandedTemplateBySlug } from './branded-template-engine'
import { sendEmail } from './integrations/mailketing'

/**
 * Configuration untuk pembagian revenue
 * - Affiliate: Sesuai affiliateCommissionRate di produk/membership
 * - Sisanya dibagi:
 *   - Admin: 15%
 *   - Founder: 60%
 *   - Co-Founder: 40%
 */
const REVENUE_CONFIG = {
  ADMIN_PERCENTAGE: 15,
  FOUNDER_PERCENTAGE: 60,
  COFOUNDER_PERCENTAGE: 40,
}

export interface CommissionCalculation {
  totalAmount: number
  affiliateCommission: number
  affiliatePercentage: number
  commissionType: 'PERCENTAGE' | 'FLAT'
  remainingAfterAffiliate: number
  adminFee: number
  founderShare: number
  cofounderShare: number
  breakdown: {
    affiliate: { amount: number; percentage: number; type: 'PERCENTAGE' | 'FLAT' }
    admin: { amount: number; percentage: number }
    founder: { amount: number; percentage: number }
    cofounder: { amount: number; percentage: number }
  }
}

/**
 * Calculate commission berdasarkan affiliateCommissionRate
 * Supports both PERCENTAGE and FLAT commission types
 */
export function calculateCommission(
  totalAmount: number,
  affiliateCommissionRate: number,
  commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE'
): CommissionCalculation {
  // Calculate affiliate commission based on type
  let affiliateCommission: number
  let affiliatePercentage: number
  
  if (commissionType === 'FLAT') {
    // FLAT: Fixed amount
    affiliateCommission = Math.min(affiliateCommissionRate, totalAmount) // Cap at total amount
    affiliatePercentage = (affiliateCommission / totalAmount) * 100 // Calculate equivalent percentage for display
  } else {
    // PERCENTAGE: Percentage of total
    affiliateCommission = (totalAmount * affiliateCommissionRate) / 100
    affiliatePercentage = affiliateCommissionRate
  }
  
  const remainingAfterAffiliate = totalAmount - affiliateCommission
  const adminFee = (remainingAfterAffiliate * REVENUE_CONFIG.ADMIN_PERCENTAGE) / 100
  const remainingForFounders = remainingAfterAffiliate - adminFee
  const founderShare = (remainingForFounders * REVENUE_CONFIG.FOUNDER_PERCENTAGE) / 100
  const cofounderShare = (remainingForFounders * REVENUE_CONFIG.COFOUNDER_PERCENTAGE) / 100
  
  return {
    totalAmount,
    affiliateCommission,
    affiliatePercentage,
    commissionType,
    remainingAfterAffiliate,
    adminFee,
    founderShare,
    cofounderShare,
    breakdown: {
      affiliate: { amount: affiliateCommission, percentage: affiliatePercentage, type: commissionType },
      admin: { amount: adminFee, percentage: REVENUE_CONFIG.ADMIN_PERCENTAGE },
      founder: { amount: founderShare, percentage: REVENUE_CONFIG.FOUNDER_PERCENTAGE },
      cofounder: { amount: cofounderShare, percentage: REVENUE_CONFIG.COFOUNDER_PERCENTAGE },
    }
  }
}

/**
 * Process commission untuk transaksi
 * - Affiliate: Langsung ke balance
 * - Admin/Founder/Co-Founder: Masuk balancePending + create PendingRevenue record
 */
export async function processTransactionCommission(
  transactionId: string,
  affiliateUserId: string | null,
  adminUserId: string,
  founderUserId: string,
  cofounderUserId: string,
  totalAmount: number,
  affiliateCommissionRate: number,
  commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE'
) {
  const commission = calculateCommission(totalAmount, affiliateCommissionRate, commissionType)
  
  try {
    // 1. Affiliate Commission (langsung ke balance)
    if (affiliateUserId && commission.affiliateCommission > 0) {
      const affiliateWallet = await prisma.wallet.upsert({
        where: { userId: affiliateUserId },
        create: {
          userId: affiliateUserId,
          balance: commission.affiliateCommission,
          balancePending: 0,
          totalEarnings: commission.affiliateCommission,
        },
        update: {
          balance: { increment: commission.affiliateCommission },
          totalEarnings: { increment: commission.affiliateCommission },
        },
      })
      
      const commissionDesc = commissionType === 'FLAT' 
        ? `Affiliate commission (Rp ${affiliateCommissionRate.toLocaleString('id-ID')} flat)`
        : `Affiliate commission (${affiliateCommissionRate}%)`
      
      await prisma.walletTransaction.create({
        data: {
          walletId: affiliateWallet.id,
          amount: commission.affiliateCommission,
          type: 'COMMISSION',
          description: commissionDesc,
          reference: transactionId,
        },
      })

      // Update affiliateProfile statistics for realtime sync
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: affiliateUserId },
        include: { user: true }
      })
      
      if (affiliateProfile) {
        await prisma.affiliateProfile.update({
          where: { userId: affiliateUserId },
          data: {
            totalEarnings: { increment: commission.affiliateCommission },
            totalConversions: { increment: 1 },
          },
        })
        
        // 🔥 CRITICAL: Create AffiliateConversion record for admin dashboard aggregation
        // This ensures admin page shows same data as user wallet
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateProfile.id,
            transactionId,
            commissionAmount: commission.affiliateCommission,
            commissionRate: affiliateCommissionRate,
            commissionType,
            paidOut: false, // Mark as not yet paid out (pending payout)
          },
        }).catch(err => {
          // Ignore if duplicate (transaction already has a conversion record)
          if (err.code !== 'P2002') {
            throw err
          }
        })

        // 📧 Send affiliate commission notification email
        try {
          const emailData = {
            userName: affiliateProfile.user?.name || 'Affiliate',
            commissionAmount: commission.affiliateCommission,
            commissionRate: affiliateCommissionRate,
            commissionType,
            totalEarnings: affiliateProfile.totalEarnings + commission.affiliateCommission,
            transactionId,
          }
          
          const renderedEmail = await renderBrandedTemplateBySlug('affiliate-commission-received', emailData, {
            userId: affiliateUserId,
            context: 'affiliate_commission_earned',
          })
          
          await sendEmail({
            recipient: affiliateProfile.user?.email || '',
            subject: renderedEmail.subject,
            content: renderedEmail.html,
          })
        } catch (error) {
          console.error('Error sending affiliate commission email:', error)
          // Don't throw - email failure shouldn't block commission processing
        }
      }
    }
    
    // 2. Admin Fee (ke balancePending)
    if (commission.adminFee > 0) {
      const adminWallet = await prisma.wallet.upsert({
        where: { userId: adminUserId },
        create: {
          userId: adminUserId,
          balance: 0,
          balancePending: commission.adminFee,
          totalEarnings: 0,
        },
        update: {
          balancePending: { increment: commission.adminFee },
        },
      })
      
      await prisma.pendingRevenue.create({
        data: {
          walletId: adminWallet.id,
          transactionId,
          amount: commission.adminFee,
          type: 'ADMIN_FEE',
          percentage: REVENUE_CONFIG.ADMIN_PERCENTAGE,
          status: 'PENDING',
        },
      })
      
      // 📧 Send admin fee pending email notification
      try {
        const adminUser = await prisma.user.findUnique({
          where: { id: adminUserId },
          select: { email: true, name: true }
        })
        
        if (adminUser?.email) {
          const { renderBrandedTemplateBySlug } = await import('@/lib/branded-template-engine')
          const emailTemplate = await renderBrandedTemplateBySlug('admin-fee-pending', {
            userName: adminUser.name || 'Admin',
            transactionId,
            amount: commission.adminFee,
          })
          
          if (emailTemplate) {
            await sendEmail({
              recipient: adminUser.email,
              subject: emailTemplate.subject,
              content: emailTemplate.html,
            })
          }
        }
      } catch (emailError) {
        console.error('Error sending admin fee email:', emailError)
      }
    }
    
    // 3. Founder Share (ke balancePending)
    if (commission.founderShare > 0) {
      const founderWallet = await prisma.wallet.upsert({
        where: { userId: founderUserId },
        create: {
          userId: founderUserId,
          balance: 0,
          balancePending: commission.founderShare,
          totalEarnings: 0,
        },
        update: {
          balancePending: { increment: commission.founderShare },
        },
      })
      
      await prisma.pendingRevenue.create({
        data: {
          walletId: founderWallet.id,
          transactionId,
          amount: commission.founderShare,
          type: 'FOUNDER_SHARE',
          percentage: REVENUE_CONFIG.FOUNDER_PERCENTAGE,
          status: 'PENDING',
        },
      })
      
      // 📧 Send founder share pending email notification
      try {
        const founderUser = await prisma.user.findUnique({
          where: { id: founderUserId },
          select: { email: true, name: true }
        })
        
        if (founderUser?.email) {
          const { renderBrandedTemplateBySlug } = await import('@/lib/branded-template-engine')
          const emailTemplate = await renderBrandedTemplateBySlug('founder-share-pending', {
            userName: founderUser.name || 'Founder',
            transactionId,
            amount: commission.founderShare,
          })
          
          if (emailTemplate) {
            await sendEmail({
              recipient: founderUser.email,
              subject: emailTemplate.subject,
              content: emailTemplate.html,
            })
          }
        }
      } catch (emailError) {
        console.error('Error sending founder share email:', emailError)
      }
    }
    
    // 4. Co-Founder Share (ke balancePending)
    if (commission.cofounderShare > 0) {
      const cofounderWallet = await prisma.wallet.upsert({
        where: { userId: cofounderUserId },
        create: {
          userId: cofounderUserId,
          balance: 0,
          balancePending: commission.cofounderShare,
          totalEarnings: 0,
        },
        update: {
          balancePending: { increment: commission.cofounderShare },
        },
      })
      
      await prisma.pendingRevenue.create({
        data: {
          walletId: cofounderWallet.id,
          transactionId,
          amount: commission.cofounderShare,
          type: 'COFOUNDER_SHARE',
          percentage: REVENUE_CONFIG.COFOUNDER_PERCENTAGE,
          status: 'PENDING',
        },
      })
      
      // 📧 Send co-founder share pending email notification
      try {
        const cofounderUser = await prisma.user.findUnique({
          where: { id: cofounderUserId },
          select: { email: true, name: true }
        })
        
        if (cofounderUser?.email) {
          const { renderBrandedTemplateBySlug } = await import('@/lib/branded-template-engine')
          const emailTemplate = await renderBrandedTemplateBySlug('cofounder-share-pending', {
            userName: cofounderUser.name || 'Co-Founder',
            transactionId,
            amount: commission.cofounderShare,
          })
          
          if (emailTemplate) {
            await sendEmail({
              recipient: cofounderUser.email,
              subject: emailTemplate.subject,
              content: emailTemplate.html,
            })
          }
        }
      } catch (emailError) {
        console.error('Error sending co-founder share email:', emailError)
      }
    }
    
    // 5. Update transaction dengan breakdown
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        affiliateShare: commission.affiliateCommission,
        companyFee: commission.adminFee,
        founderShare: commission.founderShare,
        coFounderShare: commission.cofounderShare,
      },
    })
    
    return { success: true, commission }
  } catch (error) {
    console.error('Error processing commission:', error)
    throw error
  }
}

/**
 * Approve pending revenue - pindahkan dari balancePending ke balance
 */
export async function approvePendingRevenue(
  pendingRevenueId: string,
  approvedBy: string,
  adjustedAmount?: number,
  adjustmentNote?: string
) {
  const pendingRevenue = await prisma.pendingRevenue.findUnique({
    where: { id: pendingRevenueId },
    include: { wallet: { include: { user: true } } },
  })
  
  if (!pendingRevenue) throw new Error('Pending revenue not found')
  if (pendingRevenue.status !== 'PENDING') throw new Error('Already processed')
  
  const finalAmount = adjustedAmount ?? parseFloat(pendingRevenue.amount.toString())
  const originalAmount = parseFloat(pendingRevenue.amount.toString())
  
  await prisma.$transaction(async (tx) => {
    await tx.pendingRevenue.update({
      where: { id: pendingRevenueId },
      data: {
        status: adjustedAmount ? 'ADJUSTED' : 'APPROVED',
        adjustedAmount: adjustedAmount ?? undefined,
        adjustmentNote,
        approvedBy,
        approvedAt: new Date(),
      },
    })
    
    await tx.wallet.update({
      where: { id: pendingRevenue.walletId },
      data: {
        balancePending: { decrement: originalAmount },
        balance: { increment: finalAmount },
        totalEarnings: { increment: finalAmount },
      },
    })
    
    await tx.walletTransaction.create({
      data: {
        walletId: pendingRevenue.walletId,
        amount: finalAmount,
        type: 'CREDIT',
        description: `Approved ${pendingRevenue.type}${adjustedAmount ? ` (adjusted)` : ''}`,
        reference: pendingRevenue.transactionId,
      },
    })
  })
  
  // 📧 Send notification email to user
  try {
    await sendPendingRevenueNotification({
      type: 'APPROVED',
      userId: pendingRevenue.wallet.userId,
      userName: pendingRevenue.wallet.user?.name,
      userEmail: pendingRevenue.wallet.user?.email,
      amount: finalAmount,
      revenueType: pendingRevenue.type as 'ADMIN_FEE' | 'FOUNDER_SHARE' | 'COFOUNDER_SHARE',
      status: 'APPROVED',
      transactionId: pendingRevenue.transactionId || undefined,
    })
  } catch (error) {
    console.error('Error sending approval notification:', error)
    // Don't throw - notification failure shouldn't block the approval
  }
  
  return { success: true, originalAmount, finalAmount, adjusted: adjustedAmount !== undefined }
}

/**
 * Reject pending revenue
 */
export async function rejectPendingRevenue(
  pendingRevenueId: string,
  approvedBy: string,
  note: string
) {
  const pendingRevenue = await prisma.pendingRevenue.findUnique({
    where: { id: pendingRevenueId },
    include: { wallet: { include: { user: true } } },
  })
  
  if (!pendingRevenue) throw new Error('Pending revenue not found')
  if (pendingRevenue.status !== 'PENDING') throw new Error('Already processed')
  
  const amount = parseFloat(pendingRevenue.amount.toString())
  
  await prisma.$transaction(async (tx) => {
    await tx.pendingRevenue.update({
      where: { id: pendingRevenueId },
      data: {
        status: 'REJECTED',
        adjustmentNote: note,
        approvedBy,
        approvedAt: new Date(),
      },
    })
    
    await tx.wallet.update({
      where: { id: pendingRevenue.walletId },
      data: {
        balancePending: { decrement: amount },
      },
    })
  })
  
  // 📧 Send notification email to user
  try {
    await sendPendingRevenueNotification({
      type: 'REJECTED',
      userId: pendingRevenue.wallet.userId,
      userName: pendingRevenue.wallet.user?.name,
      userEmail: pendingRevenue.wallet.user?.email,
      amount,
      revenueType: pendingRevenue.type as 'ADMIN_FEE' | 'FOUNDER_SHARE' | 'COFOUNDER_SHARE',
      status: 'REJECTED',
      adjustmentNote: note,
      transactionId: pendingRevenue.transactionId || undefined,
    })
  } catch (error) {
    console.error('Error sending rejection notification:', error)
    // Don't throw - notification failure shouldn't block the rejection
  }
  
  return { success: true, rejectedAmount: amount }
}

// Keep legacy functions for backward compatibility
export async function updateWallet(
  userId: string,
  amount: number,
  type: 'COMMISSION' | 'PAYOUT' | 'REFUND' | 'ADJUSTMENT',
  transactionId: string,
  description: string
) {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId } })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalPayout: 0
        }
      })
    }

    const newBalance = Number(wallet.balance) + amount
    const newTotalEarnings = type === 'COMMISSION' 
      ? Number(wallet.totalEarnings) + amount 
      : wallet.totalEarnings
    const newTotalPayout = type === 'PAYOUT'
      ? Number(wallet.totalPayout) + Math.abs(amount)
      : wallet.totalPayout

    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalEarnings: newTotalEarnings,
        totalPayout: newTotalPayout
      }
    })

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        description,
        reference: transactionId
      }
    })

    return { success: true, newBalance }
  } catch (error) {
    console.error('Update wallet error:', error)
    throw error
  }
}

/**
 * Process payout request
 */
export async function processPayout(
  userId: string,
  amount: number,
  method: string,
  accountDetails: any
) {
  try {
    // 1. Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      throw new Error('Wallet not found')
    }

    // 2. Check balance
    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient balance')
    }

    // 3. Create payout request
    const payout = await prisma.payout.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'PENDING',
        method,
        accountDetails
      }
    })

    // 4. Deduct from wallet (hold until approved)
    await updateWallet(
      userId,
      -amount,
      'PAYOUT',
      payout.id,
      `Payout request via ${method}`
    )

    return {
      success: true,
      payout
    }
  } catch (error) {
    console.error('Process payout error:', error)
    throw error
  }
}

/**
 * Get user wallet summary
 */
export async function getWalletSummary(userId: string) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!wallet) {
      return {
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0,
        transactions: [],
        payouts: []
      }
    }

    return {
      balance: Number(wallet.balance),
      balancePending: Number(wallet.balancePending),
      totalEarnings: Number(wallet.totalEarnings),
      totalPayout: Number(wallet.totalPayout),
      transactions: wallet.transactions,
      payouts: wallet.payouts
    }
  } catch (error) {
    console.error('Get wallet summary error:', error)
    throw error
  }
}

/**
 * Get affiliate commission from link code (manual lookups for production)
 */
export async function getAffiliateFromCode(code: string) {
  try {
    const link = await prisma.affiliateLink.findFirst({
      where: {
        OR: [
          { code },
          { shortCode: code }
        ]
      }
    })

    if (!link) {
      return null
    }

    // Manual lookup for affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: link.userId }
    })

    return {
      affiliateId: link.userId,
      commissionRate: affiliateProfile?.commissionRate || 10
    }
  } catch (error) {
    console.error('Get affiliate from code error:', error)
    return null
  }
}
