import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { starsenderService } from '@/lib/starsender'
import { sendEmail } from '@/lib/email'
import { notificationService } from '@/lib/services/notificationService'
import { createBrandedEmailAsync } from '@/lib/branded-template-engine'

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

      // If status is SUCCESS, activate access for each transaction
      if (action === 'SUCCESS' || action === 'payment_confirmed') {
        const transactions = await prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
          include: {
            user: true,
            membership: { include: { membership: true } },
            product: true,
            course: true
          }
        })

        for (const tx of transactions) {
          try {
            // 1. Activate Membership Access
            if (tx.type === 'MEMBERSHIP' && tx.membership) {
              const membership = tx.membership.membership
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

            // 3. Grant Product Access (if digital product)
            if (tx.type === 'PRODUCT' && tx.product?.isDigital && tx.productId) {
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
                  purchasedAt: new Date()
                },
                update: {
                  purchasedAt: new Date()
                }
              })

              console.log(`✓ Granted product access ${tx.product.name} for user ${tx.userId}`)
            }

            // 4. Send In-App Notification
            await notificationService.send({
              userId: tx.userId,
              type: 'TRANSACTION',
              title: 'Pembayaran Dikonfirmasi',
              message: `Pembayaran untuk ${
                tx.membership?.membership.name || 
                tx.product?.name || 
                tx.course?.title || 
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

    // Send notifications if needed
    if (shouldSendNotification) {
      const transactions = await prisma.transaction.findMany({
        where: {
          id: {
            in: transactionIds
          }
        },
        include: {
          user: true,
          membership: {
            include: {
              membership: true
            }
          },
          product: true,
          course: true
        }
      })

      let successCount = 0
      let failedCount = 0

      // Send WhatsApp notifications
      for (const transaction of transactions) {
        try {
          // Get product/membership name
          let productName = ''
          if (transaction.membership?.membership) {
            productName = transaction.membership.membership.name
          } else if (transaction.product) {
            productName = transaction.product.name
          } else if (transaction.course) {
            productName = transaction.course.title
          }

          // Create notification message based on action
          let message = ''
          if (action === 'SUCCESS' || action === 'payment_confirmed') {
            message = `Halo ${transaction.user?.name || 'Bapak/Ibu'},\n\nPembayaran Anda untuk *${productName}* senilai *Rp ${Number(transaction.amount).toLocaleString('id-ID')}* telah dikonfirmasi!\n\nTerima kasih telah bergabung bersama kami. 🎉\n\nSalam,\nEksporYuk`
          } else if (action === 'RESEND_NOTIFICATION') {
            if (transaction.status === 'PENDING') {
              message = `Halo ${transaction.user?.name || 'Bapak/Ibu'},\n\n*Reminder Pembayaran*\n\nAnda memiliki transaksi pending untuk *${productName}* senilai *Rp ${Number(transaction.amount).toLocaleString('id-ID')}*.\n\nMohon segera lakukan pembayaran agar order Anda dapat diproses.\n\nTerima kasih!\n\nSalam,\nEksporYuk`
            } else if (transaction.status === 'SUCCESS') {
              message = `Halo ${transaction.user?.name || 'Bapak/Ibu'},\n\nPembayaran Anda untuk *${productName}* senilai *Rp ${Number(transaction.amount).toLocaleString('id-ID')}* telah dikonfirmasi!\n\nTerima kasih telah bergabung bersama kami. 🎉\n\nSalam,\nEksporYuk`
            }
          }

          if (message) {
            const phone = transaction.user?.whatsapp || transaction.user?.phone || ''
            
            if (!phone) {
              console.warn(`No phone number for transaction ${transaction.id}`)
              failedCount++
              continue
            }

            // Send via Starsender (WhatsApp)
            const result = await starsenderService.sendWhatsApp({
              to: phone,
              message
            })

            if (result.success) {
              successCount++
              console.log(`✓ WhatsApp sent to ${phone} for transaction ${transaction.id}`)
            } else {
              failedCount++
              console.error(`✗ Failed to send WhatsApp to ${phone}: ${result.error}`)
            }

            // Also send Email Notification
            try {
              const emailSubject = action === 'SUCCESS' || action === 'payment_confirmed'
                ? `Pembayaran Dikonfirmasi - ${productName}`
                : `Reminder Pembayaran - ${productName}`
              
              const emailContent = action === 'SUCCESS' || action === 'payment_confirmed' ? `
Halo ${transaction.user?.name || 'Bapak/Ibu'},

Pembayaran Anda untuk ${productName} senilai Rp ${Number(transaction.amount).toLocaleString('id-ID')} telah dikonfirmasi!

✓ Akses Anda Sudah Aktif
Anda dapat langsung menggunakan layanan yang telah Anda beli.

Terima kasih telah bergabung bersama kami. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.
              ` : `
Halo ${transaction.user?.name || 'Bapak/Ibu'},

Anda memiliki transaksi pending untuk ${productName} senilai Rp ${Number(transaction.amount).toLocaleString('id-ID')}.

⚠️ Menunggu Pembayaran
Mohon segera lakukan pembayaran agar order Anda dapat diproses.

Terima kasih atas perhatiannya.
              `

              // Use branded email template
              const emailHtml = await createBrandedEmailAsync(
                emailSubject,
                emailContent,
                action === 'SUCCESS' || action === 'payment_confirmed' ? 'Akses Dashboard' : 'Bayar Sekarang',
                action === 'SUCCESS' || action === 'payment_confirmed' 
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
                  : `${process.env.NEXT_PUBLIC_APP_URL}/transactions/${transaction.id}`,
                {
                  name: transaction.user?.name || '',
                  email: transaction.user?.email || '',
                  invoice: transaction.invoiceNumber || transaction.id.slice(0, 8).toUpperCase()
                }
              )

              await sendEmail({
                to: transaction.user?.email || '',
                subject: emailSubject,
                html: emailHtml
              })

              console.log(`✓ Email sent to ${transaction.user?.email}`)
            } catch (emailError) {
              console.error(`✗ Failed to send email:`, emailError)
            }

            // Rate limit: wait 1 second between messages
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          failedCount++
          console.error('Error sending notification for transaction:', transaction.id, error)
        }
      }

      console.log(`Notification summary: ${successCount} sent, ${failedCount} failed`)
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
