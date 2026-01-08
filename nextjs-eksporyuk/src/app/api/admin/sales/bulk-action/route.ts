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
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')
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

      // If status is SUCCESS, activate access for each transaction (FULL ACTIVATION like single confirm)
      if (action === 'SUCCESS' || action === 'payment_confirmed') {
        // Get transactions
        const transactions = await prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
        })

        for (const tx of transactions) {
          try {
            // ===== HANDLE MEMBERSHIP ACTIVATION (Same as single confirm) =====
            if (tx.type === 'MEMBERSHIP') {
              // Get membershipId from transaction field OR metadata
              const metadata = tx.metadata as any
              const membershipId = tx.membershipId || metadata?.membershipId

              if (membershipId) {
                const membership = await prisma.membership.findUnique({ 
                  where: { id: membershipId } 
                })

                if (membership) {
                  // Calculate end date based on duration
                  const now = new Date()
                  let endDate = new Date(now)
                  
                  switch (membership.duration) {
                    case 'ONE_MONTH':
                      endDate.setMonth(endDate.getMonth() + 1)
                      break
                    case 'THREE_MONTHS':
                      endDate.setMonth(endDate.getMonth() + 3)
                      break
                    case 'SIX_MONTHS':
                      endDate.setMonth(endDate.getMonth() + 6)
                      break
                    case 'TWELVE_MONTHS':
                      endDate.setFullYear(endDate.getFullYear() + 1)
                      break
                    case 'LIFETIME':
                      endDate.setFullYear(endDate.getFullYear() + 100)
                      break
                    default:
                      const durationValue = typeof membership.duration === 'number' ? membership.duration : 365
                      endDate = new Date(Date.now() + durationValue * 24 * 60 * 60 * 1000)
                  }

                  // 🔒 DEACTIVATE OLD MEMBERSHIPS - User can only have 1 active membership
                  await prisma.userMembership.updateMany({
                    where: { 
                      userId: tx.userId,
                      isActive: true
                    },
                    data: { 
                      isActive: false,
                      status: 'EXPIRED'
                    }
                  })
                  console.log(`[Bulk Confirm] ✅ Deactivated old memberships for user ${tx.userId}`)

                  // 🔒 CANCEL OTHER PENDING MEMBERSHIP TRANSACTIONS
                  const cancelledTransactions = await prisma.transaction.updateMany({
                    where: {
                      userId: tx.userId,
                      type: 'MEMBERSHIP',
                      status: 'PENDING',
                      id: { not: tx.id }
                    },
                    data: {
                      status: 'CANCELLED',
                    }
                  })
                  
                  if (cancelledTransactions.count > 0) {
                    console.log(`[Bulk Confirm] ✅ Auto-cancelled ${cancelledTransactions.count} pending membership transactions`)
                  }

                  // Check if UserMembership already exists for this transaction
                  let userMembership = await prisma.userMembership.findUnique({
                    where: { transactionId: tx.id },
                  })

                  if (userMembership) {
                    // UPDATE existing UserMembership
                    await prisma.userMembership.update({
                      where: { id: userMembership.id },
                      data: {
                        status: 'ACTIVE',
                        isActive: true,
                        startDate: now,
                        endDate,
                        activatedAt: now,
                        updatedAt: now
                      }
                    })
                    console.log(`[Bulk Confirm] ✅ Updated existing UserMembership to ACTIVE`)
                  } else {
                    // CREATE new UserMembership
                    userMembership = await prisma.userMembership.create({
                      data: {
                        id: `um_${tx.id}`,
                        userId: tx.userId,
                        membershipId: membershipId,
                        transactionId: tx.id,
                        status: 'ACTIVE',
                        isActive: true,
                        startDate: now,
                        endDate,
                        activatedAt: now,
                        price: tx.amount
                      }
                    })
                    console.log(`[Bulk Confirm] ✅ Created NEW UserMembership for transaction ${tx.id}`)
                  }

                  // Update user role to MEMBER_PREMIUM
                  await prisma.user.update({
                    where: { id: tx.userId },
                    data: { role: 'MEMBER_PREMIUM' }
                  })
                  console.log(`[Bulk Confirm] ✅ User role upgraded to MEMBER_PREMIUM`)

                  // ===== AUTO-JOIN GROUPS =====
                  const membershipGroups = await prisma.membershipGroup.findMany({
                    where: { membershipId: membership.id }
                  })

                  for (const mg of membershipGroups) {
                    try {
                      const existingMember = await prisma.groupMember.findUnique({
                        where: {
                          groupId_userId: {
                            groupId: mg.groupId,
                            userId: tx.userId
                          }
                        }
                      })

                      if (!existingMember) {
                        await prisma.groupMember.create({
                          data: {
                            id: createId(),
                            groupId: mg.groupId,
                            userId: tx.userId,
                            role: 'MEMBER'
                          }
                        })
                        console.log(`[Bulk Confirm] ✅ User ${tx.userId} added to group ${mg.groupId}`)
                      }
                    } catch (groupError) {
                      console.error(`[Bulk Confirm] Error adding user to group:`, groupError)
                    }
                  }

                  // ===== AUTO-ENROLL COURSES =====
                  const membershipCourses = await prisma.membershipCourse.findMany({
                    where: { membershipId: membership.id }
                  })

                  for (const mc of membershipCourses) {
                    try {
                      const existingEnrollment = await prisma.courseEnrollment.findFirst({
                        where: {
                          courseId: mc.courseId,
                          userId: tx.userId
                        }
                      })

                      if (!existingEnrollment) {
                        await prisma.courseEnrollment.create({
                          data: {
                            id: createId(),
                            courseId: mc.courseId,
                            userId: tx.userId,
                            updatedAt: new Date()
                          }
                        })
                        console.log(`[Bulk Confirm] ✅ User ${tx.userId} enrolled in course ${mc.courseId}`)
                      }
                    } catch (courseError) {
                      console.error(`[Bulk Confirm] Error enrolling user in course:`, courseError)
                    }
                  }

                  // ===== AUTO-GRANT PRODUCTS =====
                  const membershipProducts = await prisma.membershipProduct.findMany({
                    where: { membershipId: membership.id }
                  })

                  for (const mp of membershipProducts) {
                    try {
                      const existingProduct = await prisma.userProduct.findFirst({
                        where: {
                          productId: mp.productId,
                          userId: tx.userId
                        }
                      })

                      if (!existingProduct) {
                        await prisma.userProduct.create({
                          data: {
                            userId: tx.userId,
                            productId: mp.productId,
                            transactionId: tx.id,
                            purchaseDate: new Date(),
                            price: 0 // Free as part of membership
                          }
                        })
                        console.log(`[Bulk Confirm] ✅ User ${tx.userId} granted product ${mp.productId}`)
                      }
                    } catch (productError) {
                      console.error(`[Bulk Confirm] Error granting product:`, productError)
                    }
                  }

                  console.log(`[Bulk Confirm] ✅ Membership ${membership.name} fully activated for user ${tx.userId}`)
                }
              }
            }

            // 2. Enroll in Course (for COURSE type transactions)
            if (tx.type === 'COURSE' && tx.courseId) {
              const existingEnrollment = await prisma.courseEnrollment.findFirst({
                where: {
                  userId: tx.userId,
                  courseId: tx.courseId
                }
              })

              if (!existingEnrollment) {
                await prisma.courseEnrollment.create({
                  data: {
                    id: createId(),
                    userId: tx.userId,
                    courseId: tx.courseId,
                    progress: 0,
                    completed: false,
                    transactionId: tx.id,
                    updatedAt: new Date()
                  }
                })
              }

              console.log(`✓ Enrolled user ${tx.userId} in course ${tx.courseId}`)
            }

            // 3. Grant Product Access
            if (tx.type === 'PRODUCT' && tx.productId) {
              // Check if user product exists
              const existingUserProduct = await prisma.userProduct.findFirst({
                where: {
                  userId: tx.userId,
                  productId: tx.productId
                }
              })

              if (existingUserProduct) {
                await prisma.userProduct.update({
                  where: { id: existingUserProduct.id },
                  data: {
                    price: tx.amount,
                    transactionId: tx.id,
                    purchaseDate: new Date(),
                    updatedAt: new Date()
                  }
                })
              } else {
                await prisma.userProduct.create({
                  data: {
                    id: createId(),
                    userId: tx.userId,
                    productId: tx.productId,
                    price: tx.amount,
                    transactionId: tx.id,
                    purchaseDate: new Date(),
                    updatedAt: new Date()
                  }
                })
              }

              console.log(`✓ Granted product access ${productMap.get(tx.productId)?.name} for user ${tx.userId}`)
            }

            // 4. Send In-App Notification
            const userMembershipNotif = userMembershipMap.get(tx.id)
            const membershipNotif = userMembershipNotif ? membershipMap.get((userMembershipNotif as any).membershipId) : null
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
      
      const notifUserMemberships = await prisma.userMembership.findMany({
        where: { transactionId: { in: transactionIds } },
      })
      const notifMembershipIds = [...new Set(notifUserMemberships.map((um: any) => um.membershipId).filter(Boolean))]
      const notifMemberships = notifMembershipIds.length > 0 ? await prisma.membership.findMany({
        where: { id: { in: notifMembershipIds as string[] } },
      }) : []
      const notifMembershipMap = new Map(notifMemberships.map(m => [m.id, m]))
      const notifUserMembershipMap = new Map(notifUserMemberships.map((um: any) => [um.transactionId, um]))
      
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
          
          const notifUserMembership = notifUserMembershipMap.get(transaction.id)
          const membershipN = notifUserMembership ? notifMembershipMap.get((notifUserMembership as any).membershipId) : null
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
