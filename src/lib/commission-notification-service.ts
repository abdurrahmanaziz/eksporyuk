/**
 * Commission Notification Service
 * Menangani semua notifikasi email/WhatsApp terkait komisi
 * Untuk: Affiliate, Mentor, Event Creator, Admin, Founder, Co-Founder
 * 
 * ✨ NEW: Real-time email tracking dengan EmailNotificationLog
 */

import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/services/starsenderService'
import {
  createEmailLog,
  markEmailFailed
} from '@/lib/email-tracking-service'

interface CommissionNotificationParams {
  type: 'AFFILIATE' | 'MENTOR' | 'EVENT_CREATOR' | 'ADMIN' | 'FOUNDER' | 'COFOUNDER'
  userId: string
  userName?: string
  userEmail?: string
  userPhone?: string
  commissionAmount: number
  commissionType: 'FLAT' | 'PERCENTAGE'
  commissionRate: number
  productPrice?: number
  productName?: string
  transactionId?: string
  metadata?: Record<string, any>
}

interface PendingRevenueNotificationParams {
  type: 'PENDING_CREATED' | 'APPROVED' | 'REJECTED'
  userId: string
  userName?: string
  userEmail?: string
  amount: number
  revenueType: 'ADMIN_FEE' | 'FOUNDER_SHARE' | 'COFOUNDER_SHARE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADJUSTED'
  adjustmentNote?: string
  transactionId?: string
}

interface CommissionSettingsChangeParams {
  itemType: 'MEMBERSHIP' | 'PRODUCT'
  itemName: string
  itemId: string
  previousCommissionType: 'FLAT' | 'PERCENTAGE'
  previousRate: number
  newCommissionType: 'FLAT' | 'PERCENTAGE'
  newRate: number
  equivalentPercentage: string
  changedBy: string
}

/**
 * Send commission notification to user (Affiliate, Mentor, Event Creator)
 */
export async function sendCommissionNotification(
  params: CommissionNotificationParams
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        phone: true,
      }
    })

    if (!user) {
      console.error(`User not found: ${params.userId}`)
      return
    }

    const email = params.userEmail || user.email
    const phone = params.userPhone || user.whatsapp || user.phone
    const name = params.userName || user.name

    // Determine title and message based on type
    let title = ''
    let message = ''
    let redirectUrl = ''
    let templateSlug = ''

    switch (params.type) {
      case 'AFFILIATE':
        title = '💰 Komisi Affiliate Baru Diterima!'
        message = `Selamat! Anda mendapat komisi sebesar Rp ${params.commissionAmount.toLocaleString('id-ID')} dari penjualan ${params.productName || 'produk'}.`
        redirectUrl = '/affiliate/earnings'
        templateSlug = 'affiliate-commission-received'
        break
      case 'MENTOR':
        title = '💰 Komisi Mentor Diterima!'
        message = `Selamat! Anda mendapat komisi mentor sebesar Rp ${params.commissionAmount.toLocaleString('id-ID')} dari penjualan kelas.`
        redirectUrl = '/dashboard/earnings'
        templateSlug = 'mentor-commission-received'
        break
      case 'EVENT_CREATOR':
        title = '💰 Penjualan Tiket Event!'
        message = `Selamat! Event Anda terjual! Anda menerima Rp ${params.commissionAmount.toLocaleString('id-ID')} dari penjualan tiket.`
        redirectUrl = '/dashboard/earnings'
        templateSlug = 'event-creator-commission'
        break
      case 'ADMIN':
        title = '💼 Admin Fee Diterima'
        message = `Fee admin sebesar Rp ${params.commissionAmount.toLocaleString('id-ID')} (${params.commissionRate}% dari transaksi) masuk ke akun Anda.`
        redirectUrl = '/admin/wallets'
        templateSlug = 'admin-fee-commission'
        break
      case 'FOUNDER':
        title = '💼 Revenue Share Founder'
        message = `Anda menerima revenue share sebesar Rp ${params.commissionAmount.toLocaleString('id-ID')} (60% dari sisa revenue).`
        redirectUrl = '/admin/wallets'
        templateSlug = 'founder-commission-received'
        break
      case 'COFOUNDER':
        title = '💼 Revenue Share Co-Founder'
        message = `Anda menerima revenue share sebesar Rp ${params.commissionAmount.toLocaleString('id-ID')} (40% dari sisa revenue).`
        redirectUrl = '/admin/wallets'
        templateSlug = 'cofounder-commission-received'
        break
    }

    // 📧 Create email tracking log
    try {
      await createEmailLog({
        templateSlug,
        templateCategory: 'AFFILIATE',
        recipientId: user.id,
        recipientEmail: email,
        recipientName: name,
        recipientRole: params.type,
        subject: title,
        variables: {
          userName: name,
          commissionAmount: `Rp ${params.commissionAmount.toLocaleString('id-ID')}`,
          productName: params.productName,
          commissionType: params.commissionType,
          commissionRate: params.commissionRate
        },
        sourceType: 'COMMISSION',
        transactionId: params.transactionId,
        metadata: {
          commissionType: params.commissionType,
          commissionRate: params.commissionRate,
          ...params.metadata
        }
      })
    } catch (error) {
      console.error('Error creating email log:', error)
    }

    // Send via notification service (Pusher + OneSignal + Email)
    await notificationService.send({
      userId: params.userId,
      type: 'GENERAL' as any,
      title,
      message,
      link: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}${redirectUrl}`,
      channels: ['pusher', 'onesignal', 'email'],
      metadata: {
        commissionAmount: params.commissionAmount,
        commissionType: params.commissionType,
        commissionRate: params.commissionRate,
        productName: params.productName,
        transactionId: params.transactionId,
        ...params.metadata
      }
    })

    // Send WhatsApp notification if available
    if (phone && starsenderService.isConfigured()) {
      const waMessage = formatWhatsAppMessage(params.type, name, params.commissionAmount, params.productName)
      await starsenderService.sendWhatsApp({
        to: phone,
        message: waMessage
      }).catch(err => console.error('WhatsApp send error:', err))
    }

    console.log(`✅ Commission notification sent to ${params.type}: ${user.email}`)
  } catch (error) {
    console.error('Error sending commission notification:', error)
  }
}

/**
 * Send pending revenue notification (untuk admin dan founders)
 */
export async function sendPendingRevenueNotification(
  params: PendingRevenueNotificationParams
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        phone: true,
      }
    })

    if (!user) {
      console.error(`User not found: ${params.userId}`)
      return
    }

    const email = params.userEmail || user.email
    const phone = params.userPhone || user.whatsapp || user.phone
    const name = params.userName || user.name
    const revenueTypeLabel = {
      'ADMIN_FEE': 'Admin Fee',
      'FOUNDER_SHARE': 'Revenue Share Founder',
      'COFOUNDER_SHARE': 'Revenue Share Co-Founder'
    }[params.revenueType]

    let title = ''
    let message = ''
    let redirectUrl = '/admin/pending-revenue'
    let templateSlug = ''

    switch (params.type) {
      case 'PENDING_CREATED':
        title = `📋 ${revenueTypeLabel} Pending`
        message = `${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} menunggu approval. Cek di pending revenue untuk detail.`
        templateSlug = 'pending-revenue-created'
        break
      case 'APPROVED':
        title = `✅ ${revenueTypeLabel} Disetujui`
        message = `${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} telah disetujui dan ditransfer ke saldo Anda.`
        redirectUrl = '/admin/wallets'
        templateSlug = 'pending-revenue-approved'
        break
      case 'REJECTED':
        title = `❌ ${revenueTypeLabel} Ditolak`
        message = `${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} telah ditolak.${params.adjustmentNote ? ` Alasan: ${params.adjustmentNote}` : ''}`
        templateSlug = 'pending-revenue-rejected'
        break
    }

    // 📧 Create email tracking log
    try {
      await createEmailLog({
        templateSlug,
        templateCategory: 'TRANSACTION',
        recipientId: user.id,
        recipientEmail: email,
        recipientName: name,
        recipientRole: params.revenueType === 'ADMIN_FEE' ? 'ADMIN' : 'FOUNDER',
        subject: title,
        variables: {
          userName: name,
          amount: `Rp ${params.amount.toLocaleString('id-ID')}`,
          adjustmentNote: params.adjustmentNote
        },
        sourceType: 'TRANSACTION',
        transactionId: params.transactionId,
        metadata: {
          revenueType: params.revenueType,
          status: params.status
        }
      })
    } catch (error) {
      console.error('Error creating email log:', error)
    }

    // Send via notification service
    await notificationService.send({
      userId: params.userId,
      type: 'GENERAL' as any,
      title,
      message,
      link: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}${redirectUrl}`,
      channels: ['pusher', 'onesignal', 'email'],
      metadata: {
        amount: params.amount,
        revenueType: params.revenueType,
        status: params.status,
        transactionId: params.transactionId,
      }
    })

    // Send WhatsApp notification
    if (phone && starsenderService.isConfigured()) {
      let waMessage = ''
      if (params.type === 'PENDING_CREATED') {
        waMessage = `📋 *${revenueTypeLabel} Menunggu Approval*\n\nHalo ${name}!\n\n${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} sudah masuk sistem dan menunggu approval. Cek aplikasi untuk detail.\n\n⏳ Status: Pending`
      } else if (params.type === 'APPROVED') {
        waMessage = `✅ *${revenueTypeLabel} Disetujui*\n\nHalo ${name}!\n\n${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} telah disetujui!\n\n✨ Dana sudah masuk ke saldo Anda. Terima kasih! 🙏`
      } else {
        waMessage = `❌ *${revenueTypeLabel} Ditolak*\n\nHalo ${name}!\n\n${revenueTypeLabel} sebesar Rp ${params.amount.toLocaleString('id-ID')} telah ditolak.${params.adjustmentNote ? `\n\n📝 Alasan: ${params.adjustmentNote}` : ''}`
      }

      await starsenderService.sendWhatsApp({
        to: phone,
        message: waMessage
      }).catch(err => console.error('WhatsApp send error:', err))
    }

    console.log(`✅ Pending revenue notification sent: ${params.type} to ${email}`)
  } catch (error) {
    console.error('Error sending pending revenue notification:', error)
  }
}

/**
 * Send commission settings change notification to admins
 */
export async function sendCommissionSettingsChangeNotification(
  params: CommissionSettingsChangeParams
) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        phone: true,
      }
    })

    if (admins.length === 0) {
      console.log('No admins found for notification')
      return
    }

    const title = `⚙️ Commission Settings Updated - ${params.itemName}`
    const message = `${params.itemType} "${params.itemName}" commission settings telah berubah:\n\nDari: ${params.previousCommissionType} ${params.previousCommissionType === 'FLAT' ? `Rp ${params.previousRate.toLocaleString('id-ID')}` : `${params.previousRate}%`}\nMenjadi: ${params.newCommissionType} ${params.newCommissionType === 'FLAT' ? `Rp ${params.newRate.toLocaleString('id-ID')}` : `${params.newRate}%`}\n\nDiubah oleh: ${params.changedBy}`

    // Send to all admins
    for (const admin of admins) {
      try {
        // 📧 Create email tracking log
        try {
          await createEmailLog({
            templateSlug: 'commission-settings-changed',
            templateCategory: 'SYSTEM',
            recipientId: admin.id,
            recipientEmail: admin.email,
            recipientName: admin.name,
            recipientRole: 'ADMIN',
            subject: title,
            variables: {
              itemName: params.itemName,
              itemType: params.itemType,
              previousCommissionType: params.previousCommissionType,
              previousRate: `${params.previousRate}${params.previousCommissionType === 'FLAT' ? '' : '%'}`,
              newCommissionType: params.newCommissionType,
              newRate: `${params.newRate}${params.newCommissionType === 'FLAT' ? '' : '%'}`,
              changedBy: params.changedBy
            },
            sourceType: 'SETTINGS_CHANGE',
            sourceId: params.itemId,
            metadata: {
              itemType: params.itemType,
              previousCommissionType: params.previousCommissionType,
              newCommissionType: params.newCommissionType,
              changedBy: params.changedBy
            }
          })
        } catch (error) {
          console.error('Error creating email log:', error)
        }

        await notificationService.send({
          userId: admin.id,
          type: 'GENERAL' as any,
          title,
          message,
          link: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}/admin/commission-settings`,
          channels: ['pusher', 'onesignal', 'email'],
          metadata: {
            itemType: params.itemType,
            itemId: params.itemId,
            previousCommissionType: params.previousCommissionType,
            previousRate: params.previousRate,
            newCommissionType: params.newCommissionType,
            newRate: params.newRate,
            changedBy: params.changedBy,
          }
        })

        // Send WhatsApp if available
        const phone = admin.whatsapp || admin.phone
        if (phone && starsenderService.isConfigured()) {
          const waMessage = `⚙️ *Commission Settings Updated*\n\n${params.itemType}: ${params.itemName}\n\n📊 Dari: ${params.previousCommissionType} ${params.previousCommissionType === 'FLAT' ? `Rp ${params.previousRate.toLocaleString('id-ID')}` : `${params.previousRate}%`}\n➡️ Ke: ${params.newCommissionType} ${params.newCommissionType === 'FLAT' ? `Rp ${params.newRate.toLocaleString('id-ID')}` : `${params.newRate}%`}\n\n👤 Diubah oleh: ${params.changedBy}`
          
          await starsenderService.sendWhatsApp({
            to: phone,
            message: waMessage
          }).catch(err => console.error('WhatsApp send error:', err))
        }
      } catch (error) {
        console.error(`Error sending notification to admin ${admin.id}:`, error)
      }
    }

    console.log(`✅ Commission settings change notification sent to ${admins.length} admins`)
  } catch (error) {
    console.error('Error sending commission settings notification:', error)
  }
}

/**
 * Format WhatsApp message based on commission type
 */
function formatWhatsAppMessage(
  type: string,
  userName: string,
  amount: number,
  productName?: string
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()
  switch (type) {
    case 'AFFILIATE':
      return `💰 *Komisi Affiliate Baru!*\n\nHalo ${userName}!\n\nSelamat, Anda mendapat komisi:\n\n💵 *Jumlah:* Rp ${amount.toLocaleString('id-ID')}\n📦 *Produk:* ${productName || 'Produk'}\n\n✨ Komisi sudah masuk ke saldo Anda. Terus semangat! 🚀\n\nCek saldo: ${appUrl}/affiliate/earnings`
    case 'MENTOR':
      return `💰 *Komisi Mentor!*\n\nHalo ${userName}!\n\nSelamat, Anda mendapat komisi mentor:\n\n💵 *Jumlah:* Rp ${amount.toLocaleString('id-ID')}\n📚 *Dari:* Penjualan Kelas\n\n✨ Komisi sudah masuk ke saldo Anda. Terima kasih! 🙏`
    case 'EVENT_CREATOR':
      return `💰 *Penjualan Event!*\n\nHalo ${userName}!\n\nSelamat! Ada yang membeli tiket event Anda:\n\n💵 *Penerimaan:* Rp ${amount.toLocaleString('id-ID')}\n🎉 *Event:* ${productName || 'Event Anda'}\n\n✨ Dana sudah masuk ke saldo Anda. Terima kasih! 🙏`
    case 'ADMIN':
      return `💼 *Admin Fee Diterima*\n\nHalo ${userName}!\n\nAdmin fee sebesar Rp ${amount.toLocaleString('id-ID')} telah masuk ke akun Anda.\n\n💵 Status: ✅ Diterima`
    case 'FOUNDER':
      return `💼 *Revenue Share Founder*\n\nHalo ${userName}!\n\nAnda menerima revenue share sebesar:\n\n💵 *Rp ${amount.toLocaleString('id-ID')}* (60% dari sisa revenue)\n\n✨ Terima kasih atas dukungan Anda! 🙏`
    case 'COFOUNDER':
      return `💼 *Revenue Share Co-Founder*\n\nHalo ${userName}!\n\nAnda menerima revenue share sebesar:\n\n💵 *Rp ${amount.toLocaleString('id-ID')}* (40% dari sisa revenue)\n\n✨ Terima kasih atas dukungan Anda! 🙏`
    default:
      return `💰 Notification about Rp ${amount.toLocaleString('id-ID')}`
  }
}