import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { starsenderService } from '@/lib/starsender'
import { sendBrandedEmail } from '@/lib/email-template-helper'
import { notificationService } from '@/lib/services/notificationService'
import { pusherService } from '@/lib/pusher'
import { onesignal } from '@/lib/integrations/onesignal'
import { getXenditConfig } from '@/lib/integration-config'
import Xendit from 'xendit-node'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { transactionIds, action } = await request.json()

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction IDs required' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let shouldSendNotification = false

    switch (action) {
      case 'SUCCESS':
      case 'payment_confirmed':
        updateData = { status: 'SUCCESS', paidAt: new Date() }
        shouldSendNotification = true
        break
      case 'PENDING':
      case 'await_payment':
        updateData = { status: 'PENDING' }
        break
      case 'FAILED':
      case 'cancel':
        updateData = { status: 'FAILED' }
        shouldSendNotification = true
        break
      case 'RESEND_NOTIFICATION':
        // Will handle notification sending below
        shouldSendNotification = true
        break
      case 'order_processing':
        updateData = { status: 'SUCCESS', metadata: { orderStatus: 'processing' } }
        break
      case 'shipping':
        updateData = { status: 'SUCCESS', metadata: { orderStatus: 'shipping' } }
        break
      case 'done':
        updateData = { status: 'SUCCESS', metadata: { orderStatus: 'completed' } }
        break
      case 'refund':
        updateData = { status: 'REFUNDED' }
        break
      case 'resend_notification':
        shouldSendNotification = true
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update transactions if needed (skip if only resending notification)
    if (Object.keys(updateData).length > 0 && action !== 'RESEND_NOTIFICATION') {
      await prisma.transaction.updateMany({
        where: {
          id: {
            in: transactionIds
          }
        },
        data: updateData
      })

      // If status is FAILED, cancel Xendit invoices
      if (action === 'FAILED' || action === 'cancel') {
        const xenditConfig = await getXenditConfig()
        if (xenditConfig) {
          const xendit = new Xendit({ secretKey: xenditConfig.XENDIT_SECRET_KEY })
          const { Invoice } = xendit
          
          const transactions = await prisma.transaction.findMany({
            where: { id: { in: transactionIds } },
            select: { id: true, externalId: true }
          })
          
          for (const tx of transactions) {
            if (tx.externalId) {
              try {
                await Invoice.expireInvoice({ invoiceId: tx.externalId })
                console.log(`✓ Xendit invoice ${tx.externalId} expired for transaction ${tx.id}`)
              } catch (error: any) {
                console.error(`✗ Failed to expire Xendit invoice ${tx.externalId}:`, error.message)
              }
            }
          }
        }
      }

      // If status is SUCCESS, activate access for each transaction
      if (action === 'SUCCESS' || action === 'payment_confirmed') {
        // Get transactions (no relations in schema)
        const transactions = await prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
        })
        
        // Get membership transactions for all
        const membershipTxs = await prisma.membershipTransaction.findMany({
          where: { transactionId: { in: transactionIds } },
        })
        const membershipIds = [...new Set(membershipTxs.map(mt => mt.membershipId))]
        const memberships = await prisma.membership.findMany({
          where: { id: { in: membershipIds } },
        })
        const membershipMap = new Map(memberships.map(m => [m.id, m]))
        const membershipTxMap = new Map(membershipTxs.map(mt => [mt.transactionId, mt]))
        
        // Get products and courses
        const productIds = [...new Set(transactions.filter(t => t.productId).map(t => t.productId!))]
        const courseIds = [...new Set(transactions.filter(t => t.courseId).map(t => t.courseId!))]
        const products = productIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : []
        const courses = courseIds.length > 0 ? await prisma.course.findMany({ where: { id: { in: courseIds } } }) : []
        const productMap = new Map(products.map(p => [p.id, p]))
        const courseMap = new Map(courses.map(c => [c.id, c]))

        for (const tx of transactions) {
          try {
            // 1. Activate Membership Access
            const membershipTx = membershipTxMap.get(tx.id)
            if (tx.type === 'MEMBERSHIP' && membershipTx) {
              const membership = membershipMap.get(membershipTx.membershipId)
              if (membership) {
                const durationMap: Record<string, number> = {
                  'ONE_MONTH': 30,
                  'THREE_MONTHS': 90,
                  'SIX_MONTHS': 180,
                  'TWELVE_MONTHS': 365,
                  'LIFETIME': 36500
                }
                
                const days = durationMap[membership.duration] || 30
                const startDate = new Date()
                const endDate = new Date()
                endDate.setDate(endDate.getDate() + days)

                await prisma.userMembership.upsert({
                  where: {
                    userId_membershipId: {
                      userId: tx.userId,
                      membershipId: membership.id
                    }
                  },
                  create: {
                    userId: tx.userId,
                    membershipId: membership.id,
                    startDate,
                    endDate,
                    isActive: true
                  },
                  update: {
                    startDate,
                    endDate,
                    isActive: true
                  }
                })

                console.log(`✓ Activated membership ${membership.name} for user ${tx.userId}`)
              }
            }

            // 2. Enroll in Course
            if (tx.type === 'COURSE' && tx.courseId) {
              // Check if enrollment exists
              const existingEnrollment = await prisma.courseEnrollment.findFirst({
                where: {
                  userId: tx.userId,
                  courseId: tx.courseId
                }
              })

              if (!existingEnrollment) {
                await prisma.courseEnrollment.create({
                  data: {
                    userId: tx.userId,
                    courseId: tx.courseId,
                    progress: 0,
                    completed: false,
                    transactionId: tx.id
                  }
                })
              }

              console.log(`✓ Enrolled user ${tx.userId} in course ${tx.courseId}`)
            }

            // 3. Grant Product Access
            if (tx.type === 'PRODUCT' && tx.productId) {
              await prisma.userProduct.upsert({
                where: {
                  userId_productId: {
                    userId: tx.userId,
                    productId: tx.productId
                  }
                },
                create: {
                  userId: tx.userId,
                  productId: tx.productId,
                  price: tx.amount,
                  transactionId: tx.id,
                  purchaseDate: new Date()
                },
                update: {
                  price: tx.amount,
                  transactionId: tx.id,
                  purchaseDate: new Date()
                }
              })

              console.log(`✓ Granted product access ${productMap.get(tx.productId)?.name} for user ${tx.userId}`)
            }

            // 4. Send In-App Notification
            const membershipTxNotif = membershipTxMap.get(tx.id)
            const membershipNotif = membershipTxNotif ? membershipMap.get(membershipTxNotif.membershipId) : null
            await notificationService.send({
              userId: tx.userId,
              type: 'TRANSACTION',
              title: 'Pembayaran Dikonfirmasi',
              message: `Pembayaran untuk ${
                membershipNotif?.name || 
                productMap.get(tx.productId || '')?.name || 
                courseMap.get(tx.courseId || '')?.title || 
                'transaksi'
              } telah dikonfirmasi. Akses Anda sudah aktif!`,
              link: tx.type === 'COURSE' ? `/courses/${tx.courseId}` : '/dashboard'
            })

          } catch (error) {
            console.error(`Error activating access for transaction ${tx.id}:`, error)
          }
        }
      }
    }

    // Send comprehensive notifications if needed
    if (shouldSendNotification) {
      // Get transactions (no relations in schema)
      const notifTransactions = await prisma.transaction.findMany({
        where: { id: { in: transactionIds } },
      })
      
      // Get related data with manual lookups
      const notifUserIds = [...new Set(notifTransactions.map(t => t.userId))]
      const notifUsers = await prisma.user.findMany({ where: { id: { in: notifUserIds } } })
      const notifUserMap = new Map(notifUsers.map(u => [u.id, u]))
      
      const notifMembershipTxs = await prisma.membershipTransaction.findMany({
        where: { transactionId: { in: transactionIds } },
      })
      const notifMembershipIds = [...new Set(notifMembershipTxs.map(mt => mt.membershipId))]
      const notifMemberships = notifMembershipIds.length > 0 ? await prisma.membership.findMany({
        where: { id: { in: notifMembershipIds } },
      }) : []
      const notifMembershipMap = new Map(notifMemberships.map(m => [m.id, m]))
      const notifMembershipTxMap = new Map(notifMembershipTxs.map(mt => [mt.transactionId, mt]))
      
      const notifProductIds = [...new Set(notifTransactions.filter(t => t.productId).map(t => t.productId!))]
      const notifCourseIds = [...new Set(notifTransactions.filter(t => t.courseId).map(t => t.courseId!))]
      const notifProducts = notifProductIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: notifProductIds } } }) : []
      const notifCourses = notifCourseIds.length > 0 ? await prisma.course.findMany({ where: { id: { in: notifCourseIds } } }) : []
      const notifProductMap = new Map(notifProducts.map(p => [p.id, p]))
      const notifCourseMap = new Map(notifCourses.map(c => [c.id, c]))

      let successCount = 0
      let failedCount = 0

      for (const transaction of notifTransactions) {
        try {
          // Determine transaction status and type
          const currentStatus = transaction.status
          let targetStatus = currentStatus
          
          if (action === 'SUCCESS' || action === 'payment_confirmed') {
            targetStatus = 'SUCCESS'
          } else if (action === 'PENDING' || action === 'await_payment') {
            targetStatus = 'PENDING'
          } else if (action === 'FAILED' || action === 'cancel') {
            targetStatus = 'FAILED'
          }

          // Get transaction details
          let itemName = ''
          let transactionType = ''
          let accessMessage = ''
          
          const membershipTxN = notifMembershipTxMap.get(transaction.id)
          const membershipN = membershipTxN ? notifMembershipMap.get(membershipTxN.membershipId) : null
          const productN = transaction.productId ? notifProductMap.get(transaction.productId) : null
          const courseN = transaction.courseId ? notifCourseMap.get(transaction.courseId) : null
          const userN = notifUserMap.get(transaction.userId)
          
          if (membershipN) {
            itemName = membershipN.name
            transactionType = 'Membership'
            accessMessage = 'Akses membership Anda sudah aktif! Silakan login ke dashboard untuk mulai belajar.'
          } else if (productN) {
            itemName = productN.name
            transactionType = 'Product'
            accessMessage = 'Product Anda sudah tersedia di dashboard!'
          } else if (courseN) {
            itemName = courseN.title
            transactionType = 'Course'
            accessMessage = 'Anda sudah terdaftar di course ini. Selamat belajar!'
          }

          const formattedAmount = `Rp ${Number(transaction.amount).toLocaleString('id-ID')}`
          const userName = userN?.name || 'Member'
          const userEmail = userN?.email || ''
          const userPhone = userN?.whatsapp || userN?.phone || ''

          // === 1. EMAIL NOTIFICATION (Using BrandedTemplate) ===
          try {
            let emailTemplateSlug = ''
            const emailVariables: Record<string, string> = {
              userName,
              invoiceNumber: transaction.invoiceNumber || transaction.id.slice(0, 8).toUpperCase(),
              transactionType,
              itemName,
              amount: formattedAmount,
              transactionDate: new Date(transaction.createdAt).toLocaleString('id-ID', {
                dateStyle: 'long',
                timeStyle: 'short'
              }),
              paymentMethod: transaction.paymentMethod || 'Xendit Payment Gateway',
              dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`
            }

            if (targetStatus === 'SUCCESS') {
              emailTemplateSlug = 'transaction-success'
              emailVariables.accessMessage = accessMessage
            } else if (targetStatus === 'PENDING') {
              emailTemplateSlug = 'transaction-pending'
              emailVariables.expiryDate = transaction.expiredAt 
                ? new Date(transaction.expiredAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
                : '24 jam dari sekarang'
              emailVariables.paymentInstructions = 'Silakan transfer ke nomor Virtual Account yang tertera pada halaman pembayaran.'
              emailVariables.paymentUrl = `${process.env.NEXTAUTH_URL}/checkout/payment/${transaction.id}`
            } else if (targetStatus === 'FAILED') {
              emailTemplateSlug = 'transaction-failed'
              emailVariables.cancelDate = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
              emailVariables.cancelReason = 'Transaksi dibatalkan oleh admin atau pembayaran tidak diterima dalam batas waktu'
              emailVariables.retryUrl = `${process.env.NEXTAUTH_URL}/memberships`
            }

            if (emailTemplateSlug && userEmail) {
              await sendBrandedEmail(userEmail, emailTemplateSlug, emailVariables)
              console.log(`✅ Email (${emailTemplateSlug}) sent to ${userEmail}`)
            }
          } catch (emailError: any) {
            console.error(`❌ Email error for transaction ${transaction.id}:`, emailError.message)
          }

          // === 2. IN-APP NOTIFICATION ===
          try {
            let notifTitle = ''
            let notifMessage = ''
            let notifLink = '/dashboard'

            if (targetStatus === 'SUCCESS') {
              notifTitle = '✅ Pembayaran Berhasil'
              notifMessage = `Pembayaran untuk ${itemName} telah dikonfirmasi. Akses Anda sudah aktif!`
            } else if (targetStatus === 'PENDING') {
              notifTitle = '⏳ Menunggu Pembayaran'
              notifMessage = `Transaksi ${itemName} menunggu pembayaran. Silakan selesaikan pembayaran Anda.`
              notifLink = `/checkout/payment/${transaction.id}`
            } else if (targetStatus === 'FAILED') {
              notifTitle = '❌ Transaksi Dibatalkan'
              notifMessage = `Transaksi ${itemName} telah dibatalkan. Anda dapat mencoba lagi kapan saja.`
              notifLink = '/memberships'
            }

            await notificationService.send({
              userId: transaction.userId,
              type: 'TRANSACTION',
              title: notifTitle,
              message: notifMessage,
              link: notifLink
            })
            console.log(`✅ In-app notification sent to user ${transaction.userId}`)
          } catch (notifError: any) {
            console.error(`❌ In-app notification error:`, notifError.message)
          }

          // === 3. PUSHER REAL-TIME UPDATE ===
          try {
            await pusherService.notifyUser(transaction.userId, 'transaction-update', {
              transactionId: transaction.id,
              status: targetStatus,
              itemName,
              amount: formattedAmount,
              message: targetStatus === 'SUCCESS' 
                ? 'Pembayaran berhasil!' 
                : targetStatus === 'PENDING' 
                ? 'Menunggu pembayaran' 
                : 'Transaksi dibatalkan',
              timestamp: new Date().toISOString()
            })
            console.log(`✅ Pusher notification sent to user-${transaction.userId}`)
          } catch (pusherError: any) {
            console.error(`❌ Pusher error:`, pusherError.message)
          }

          // === 4. ONESIGNAL PUSH NOTIFICATION ===
          try {
            let pushHeading = ''
            let pushContent = ''
            let pushUrl = `${process.env.NEXTAUTH_URL}/dashboard`

            if (targetStatus === 'SUCCESS') {
              pushHeading = '✅ Pembayaran Berhasil'
              pushContent = `${itemName} - ${formattedAmount} telah dikonfirmasi!`
            } else if (targetStatus === 'PENDING') {
              pushHeading = '⏳ Menunggu Pembayaran'
              pushContent = `Segera selesaikan pembayaran untuk ${itemName}`
              pushUrl = `${process.env.NEXTAUTH_URL}/checkout/payment/${transaction.id}`
            } else if (targetStatus === 'FAILED') {
              pushHeading = '❌ Transaksi Dibatalkan'
              pushContent = `Transaksi ${itemName} telah dibatalkan`
              pushUrl = `${process.env.NEXTAUTH_URL}/memberships`
            }

            await onesignal.sendToUser(transaction.userId, {
              headings: { en: pushHeading, id: pushHeading },
              contents: { en: pushContent, id: pushContent },
              url: pushUrl,
              data: {
                transactionId: transaction.id,
                status: targetStatus,
                type: 'transaction_update'
              }
            })
            console.log(`✅ OneSignal push sent to user ${transaction.userId}`)
          } catch (pushError: any) {
            console.error(`❌ OneSignal error:`, pushError.message)
          }

          // === 5. WHATSAPP NOTIFICATION (Optional) ===
          if (userPhone) {
            try {
              let waMessage = ''
              
              if (targetStatus === 'SUCCESS') {
                waMessage = `Halo *${userName}*! 🎉\n\nPembayaran Anda untuk *${itemName}* senilai *${formattedAmount}* telah dikonfirmasi!\n\nAkses Anda sudah aktif. Silakan login ke dashboard:\n${process.env.NEXTAUTH_URL}/dashboard\n\nTerima kasih!\n\n_EksporYuk Team_`
              } else if (targetStatus === 'PENDING') {
                waMessage = `Halo *${userName}*,\n\n⏳ Transaksi Anda untuk *${itemName}* senilai *${formattedAmount}* sedang menunggu pembayaran.\n\nMohon segera selesaikan pembayaran agar akses dapat diaktifkan.\n\nLihat detail: ${process.env.NEXTAUTH_URL}/checkout/payment/${transaction.id}\n\n_EksporYuk Team_`
              } else if (targetStatus === 'FAILED') {
                waMessage = `Halo *${userName}*,\n\n❌ Transaksi Anda untuk *${itemName}* telah dibatalkan.\n\nAnda dapat mencoba kembali kapan saja di:\n${process.env.NEXTAUTH_URL}/memberships\n\nJika ada pertanyaan, silakan hubungi support kami.\n\n_EksporYuk Team_`
              }

              await starsenderService.sendWhatsApp({
                to: userPhone,
                message: waMessage
              })
              console.log(`✅ WhatsApp sent to ${userPhone}`)
            } catch (waError: any) {
              console.error(`❌ WhatsApp error:`, waError.message)
            }
          }

          successCount++
          
          // Rate limit: 500ms antara notifikasi
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error: any) {
          failedCount++
          console.error(`❌ Error sending notifications for transaction ${transaction.id}:`, error.message)
        }
      }

      console.log(`\n📊 Notification Summary: ${successCount} sukses, ${failedCount} gagal\n`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${transactionIds.length} transaction(s)`,
      affectedCount: transactionIds.length
    })

  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
