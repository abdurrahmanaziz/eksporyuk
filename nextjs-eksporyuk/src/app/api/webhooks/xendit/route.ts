import { NextRequest, NextResponse } from 'next/server'
import { xenditService } from '@/lib/xendit'
import { prisma } from '@/lib/prisma'
import { addUserToMailketingList, mailketing } from '@/lib/integrations/mailketing'
import { emailTemplates } from '@/lib/email-templates'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const rawBody = await request.text()
    const signature = request.headers.get('x-callback-token') || ''
    
    // Get webhook token from environment or database
    const { getXenditConfig } = await import('@/lib/integration-config')
    const config = await getXenditConfig()
    const webhookToken = config?.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_WEBHOOK_TOKEN
    
    // Verify webhook signature if token is configured
    if (webhookToken) {
      const isValid = xenditService.verifyWebhookSignature(webhookToken, rawBody, signature)
      if (!isValid) {
        console.error('[Xendit Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('[Xendit Webhook] No webhook token configured, skipping verification')
    }

    const body = JSON.parse(rawBody)
    console.log('[Xendit Webhook] Event received:', body.event || body.type, 'External ID:', body.external_id || body.reference_id)

    // Handle different webhook events
    const eventType = body.event || body.type || ''
    
    switch (eventType) {
      case 'invoice.paid':
        await handleInvoicePaid(body)
        break
      
      case 'invoice.expired':
        await handleInvoiceExpired(body)
        break
      
      case 'va.payment.complete':
      case 'payment_request.succeeded':
      case 'payment_request.captured':
        await handleVAPaymentComplete(body)
        break
      
      case 'ewallet.capture.completed':
        await handleEWalletPaymentComplete(body)
        break
      
      case 'payment_request.failed':
        await handlePaymentFailed(body)
        break
      
      default:
        console.log('[Xendit Webhook] Unhandled event:', eventType)
    }

    return NextResponse.json({ status: 'received' })

  } catch (error) {
    console.error('Xendit webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleInvoicePaid(data: any) {
  try {
    const { external_id, id: invoiceId, amount, payment_channel, payment_destination } = data
    
    // Find transaction by externalId
    const transaction = await prisma.transaction.findUnique({
      where: { externalId: external_id },
      include: { 
        user: true,
      }
    })

    if (!transaction) {
      console.error('Transaction not found for external_id:', external_id)
      return
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(),
        paymentMethod: payment_channel || 'ONLINE',
        reference: invoiceId,
        metadata: {
          ...(transaction.metadata as any),
          xenditPaymentChannel: payment_channel,
          xenditPaymentDestination: payment_destination,
          xenditPaidAmount: amount
        }
      }
    })

    // 🔔 NOTIFICATION TRIGGER: Transaction successful
    await notificationService.send({
      userId: transaction.userId,
      type: 'TRANSACTION_SUCCESS',
      title: 'Pembayaran Berhasil',
      message: `Pembayaran Anda sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil diproses`,
      transactionId: transaction.id,
      redirectUrl: `/transactions/${transaction.id}`,
      channels: ['pusher', 'onesignal', 'email'],
    })

    // Handle credit top-up for affiliate broadcast email
    const metadata = transaction.metadata as any
    const isCreditTopup = metadata?.type === 'CREDIT_TOPUP' || transaction.type === 'CREDIT_TOPUP'
    
    if (isCreditTopup && metadata) {
      const affiliateId = metadata.affiliateId
      const credits = metadata.credits

      if (affiliateId && credits) {
        console.log(`[Xendit Webhook] Processing credit top-up: ${credits} credits for affiliate ${affiliateId}`)

        // Get or create credit account
        let creditAccount = await prisma.affiliateCredit.findUnique({
          where: { affiliateId },
        })

        if (!creditAccount) {
          creditAccount = await prisma.affiliateCredit.create({
            data: {
              affiliateId,
              balance: 0,
              totalTopUp: 0,
              totalUsed: 0,
            },
          })
        }

        const balanceBefore = creditAccount.balance
        const balanceAfter = balanceBefore + credits

        // Create credit transaction
        await prisma.affiliateCreditTransaction.create({
          data: {
            creditId: creditAccount.id,
            affiliateId,
            type: 'TOPUP',
            amount: credits,
            balanceBefore,
            balanceAfter,
            description: `Top up ${credits} kredit via ${payment_channel || 'payment'}`,
            paymentId: invoiceId,
            referenceType: 'PAYMENT',
            referenceId: transaction.id,
            status: 'COMPLETED',
          },
        })

        // Update credit balance
        await prisma.affiliateCredit.update({
          where: { id: creditAccount.id },
          data: {
            balance: balanceAfter,
            totalTopUp: creditAccount.totalTopUp + credits,
          },
        })

        console.log(`[Xendit Webhook] ✅ Credit top-up successful: ${credits} credits added`)

        // Send notification to affiliate
        await notificationService.send({
          userId: transaction.userId,
          type: 'TRANSACTION_SUCCESS',
          title: 'Top Up Kredit Berhasil',
          message: `${credits} kredit berhasil ditambahkan ke akun Anda. Saldo: ${balanceAfter}`,
          redirectUrl: '/affiliate/credits',
          channels: ['pusher', 'onesignal', 'email'],
        })

        // 🔔 Send notification to ADMIN about credit sale
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        })

        for (const admin of admins) {
          await notificationService.send({
            userId: admin.id,
            type: 'TRANSACTION_SUCCESS',
            title: '💰 Penjualan Kredit Baru',
            message: `${transaction.user.name} membeli ${credits} kredit senilai Rp ${amount.toLocaleString('id-ID')}`,
            transactionId: transaction.id,
            redirectUrl: '/admin/affiliates/credits',
            channels: ['pusher', 'onesignal'],
          })
        }

        console.log(`[Xendit Webhook] ✅ Admin notifications sent for credit sale`)

        // Send email confirmation
        try {
          const { mailketing } = await import('@/lib/integrations/mailketing')
          await mailketing.sendEmail(transaction.user.email, {
            subject: '✅ Top Up Kredit Berhasil',
            body: `
              <p>Halo ${transaction.user.name},</p>
              <p>Top up kredit Anda telah berhasil diproses!</p>
              <p><strong>Detail Top Up:</strong></p>
              <ul>
                <li>Jumlah Kredit: ${credits}</li>
                <li>Saldo Sebelum: ${balanceBefore}</li>
                <li>Saldo Sekarang: ${balanceAfter}</li>
                <li>Total Dibayar: Rp ${amount.toLocaleString('id-ID')}</li>
              </ul>
              <p>Kredit sudah dapat digunakan untuk broadcast email ke leads Anda.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate/credits" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Lihat Saldo Kredit</a></p>
            `,
            fromName: 'EksporYuk',
          })
        } catch (emailError) {
          console.error('[Xendit Webhook] Error sending credit top-up email:', emailError)
        }
      }
    }

    // Handle membership creation/activation
    if (transaction.type === 'MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const membershipId = metadata.membershipId

      if (membershipId) {
        // Check if UserMembership already exists
        const existingUserMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            transactionId: transaction.id,
          },
        })

        if (!existingUserMembership) {
          // Get membership details to calculate end date
          const membership = await prisma.membership.findUnique({
            where: { id: membershipId }
          })

          if (membership) {
            // Fetch related data separately
            const [membershipGroups, membershipCourses, membershipProducts] = await Promise.all([
              prisma.membershipGroup.findMany({
                where: { membershipId }
              }),
              prisma.membershipCourse.findMany({
                where: { membershipId }
              }),
              prisma.membershipProduct.findMany({
                where: { membershipId }
              })
            ])

            // Fetch groups, courses, products details
            const groupIds = membershipGroups.map(mg => mg.groupId)
            const courseIds = membershipCourses.map(mc => mc.courseId)
            const productIds = membershipProducts.map(mp => mp.productId)

            const [groups, courses, products] = await Promise.all([
              groupIds.length > 0 ? prisma.group.findMany({
                where: { id: { in: groupIds } },
                select: { id: true, name: true }
              }) : [],
              courseIds.length > 0 ? prisma.course.findMany({
                where: { id: { in: courseIds } },
                select: { id: true, title: true }
              }) : [],
              productIds.length > 0 ? prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true }
              }) : []
            ])
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
            }

            // Create UserMembership
            await prisma.userMembership.create({
              data: {
                userId: transaction.userId,
                membershipId: membershipId,
                status: 'ACTIVE',
                isActive: true,
                activatedAt: now,
                startDate: now,
                endDate,
                price: transaction.amount,
                transactionId: transaction.id,
              },
            })

            // Add user to Mailketing list if configured
            if (membership.mailketingListId && membership.autoAddToList) {
              try {
                const listResult = await addUserToMailketingList(
                  transaction.user.email,
                  membership.mailketingListId,
                  {
                    name: transaction.user.name,
                    phone: transaction.user.phone || transaction.customerPhone || undefined,
                    purchaseType: 'membership',
                    purchaseItem: membership.name,
                    purchaseDate: now,
                    purchaseAmount: Number(transaction.amount)
                  }
                )

                if (listResult.success) {
                  // Update user's mailketingLists array
                  const currentLists = (transaction.user.mailketingLists as string[]) || []
                  if (!currentLists.includes(membership.mailketingListId)) {
                    await prisma.user.update({
                      where: { id: transaction.userId },
                      data: {
                        mailketingLists: [...currentLists, membership.mailketingListId]
                      }
                    })
                  }

                  console.log(`✅ User added to Mailketing list: ${membership.mailketingListName || membership.mailketingListId}`)
                } else {
                  console.error('❌ Failed to add user to Mailketing list:', listResult.message)
                }
              } catch (error) {
                console.error('❌ Error adding user to Mailketing list:', error)
              }
            }

            // Auto-join groups
            for (const mg of membership.membershipGroups) {
              await prisma.groupMember.create({
                data: {
                  groupId: mg.group.id,
                  userId: transaction.userId,
                  role: 'MEMBER'
                }
              }).catch(() => {}) // Ignore if already member
            }

            // Auto-enroll courses
            for (const mc of membership.membershipCourses) {
              await prisma.courseEnrollment.create({
                data: {
                  userId: transaction.userId,
                  courseId: mc.course.id
                }
              }).catch(() => {}) // Ignore if already enrolled
            }

            // Auto-grant products
            for (const mp of membership.membershipProducts) {
              await prisma.userProduct.create({
                data: {
                  userId: transaction.userId,
                  productId: mp.product.id,
                  transactionId: transaction.id,
                  purchaseDate: now,
                  price: 0 // Free as part of membership
                }
              }).catch(() => {}) // Ignore if already owned
            }

            console.log(`UserMembership created for user ${transaction.userId}, membership ${membershipId}`)
            console.log(`Auto-joined ${membership.membershipGroups.length} groups, ${membership.membershipCourses.length} courses, ${membership.membershipProducts.length} products`)

            // Send membership activation welcome email
            try {
              await mailketing.sendEmail({
                to: transaction.user.email,
                subject: `Selamat! Membership ${membership.name} Anda Aktif`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="margin: 0; font-size: 28px;">Membership Aktif!</h1>
                    </div>
                    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 16px;">Halo <strong>${transaction.user.name}</strong>,</p>
                      <p style="font-size: 16px;">Selamat! Membership <strong>${membership.name}</strong> Anda telah aktif.</p>
                      
                      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #374151;">Detail Membership:</h3>
                        <table style="width: 100%; font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Paket:</td>
                            <td style="text-align: right; font-weight: bold;">${membership.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Mulai:</td>
                            <td style="text-align: right;">${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Berakhir:</td>
                            <td style="text-align: right;">${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          </tr>
                        </table>
                      </div>

                      <p style="font-size: 16px;">Anda sekarang memiliki akses ke:</p>
                      <ul style="font-size: 14px; color: #4b5563;">
                        ${membership.membershipCourses.length > 0 ? `<li>${membership.membershipCourses.length} Kursus Premium</li>` : ''}
                        ${membership.membershipGroups.length > 0 ? `<li>${membership.membershipGroups.length} Grup Komunitas</li>` : ''}
                        ${membership.membershipProducts.length > 0 ? `<li>${membership.membershipProducts.length} Produk Digital</li>` : ''}
                        <li>Akses penuh ke fitur membership</li>
                      </ul>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/dashboard" 
                           style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                          Mulai Belajar Sekarang
                        </a>
                      </div>
                      
                      <p style="font-size: 14px; color: #6b7280;">Jika ada pertanyaan, hubungi kami via WhatsApp atau email.</p>
                      <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
                    </div>
                  </div>
                `,
                tags: ['membership', 'activation', 'welcome']
              })
              console.log(`[Xendit Webhook] Welcome email sent for membership activation: ${membership.name}`)
            } catch (emailError) {
              console.error('[Xendit Webhook] Error sending membership welcome email:', emailError)
            }
          }
        } else {
          // Update existing UserMembership to active
          await prisma.userMembership.update({
            where: { id: existingUserMembership.id },
            data: {
              status: 'ACTIVE',
              isActive: true,
              activatedAt: new Date(),
            },
          })

          console.log(`UserMembership activated for user ${transaction.userId}`)
        }
      }

      // Process revenue distribution
      const { processRevenueDistribution } = await import('@/lib/revenue-split')
      
      await processRevenueDistribution({
        amount: Number(transaction.amount),
        type: 'MEMBERSHIP',
        affiliateId: metadata.affiliateId,
        membershipId,
        transactionId: transaction.id
      })
      
      console.log(`Revenue distribution processed for membership purchase`)
    }

    // Handle course enrollment
    if (transaction.courseId && transaction.type === 'COURSE') {
      // Check if already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: transaction.courseId,
          userId: transaction.userId,
        },
      })

      if (!existingEnrollment) {
        // Get course details to check Mailketing configuration
        const course = await prisma.course.findUnique({
          where: { id: transaction.courseId }
        })

        // Create enrollment
        await prisma.courseEnrollment.create({
          data: {
            userId: transaction.userId,
            courseId: transaction.courseId,
            progress: 0,
            transactionId: transaction.id,
          },
        })

        console.log(`Course enrollment created for user ${transaction.userId}, course ${transaction.courseId}`)

        // 🔔 NOTIFICATION TRIGGER: Course enrollment (notify mentor/instructor)
        if (course && course.mentorId && course.mentorId !== transaction.userId) {
          await notificationService.send({
            userId: course.mentorId,
            type: 'COURSE_ENROLLED',
            title: 'Siswa Baru di Kursus Anda',
            message: `${transaction.user.name} telah mendaftar di kursus ${course.title}`,
            courseId: transaction.courseId,
            redirectUrl: `/courses/${transaction.courseId}/students`,
            channels: ['pusher', 'onesignal'],
          })
        }

        // Add user to Mailketing list if configured
        if (course && course.mailketingListId && course.autoAddToList) {
          try {
            const listResult = await addUserToMailketingList(
              transaction.user.email,
              course.mailketingListId,
              {
                name: transaction.user.name,
                phone: transaction.user.phone || transaction.customerPhone || undefined,
                purchaseType: 'course',
                purchaseItem: course.title,
                purchaseDate: new Date(),
                purchaseAmount: Number(transaction.amount)
              }
            )

            if (listResult.success) {
              // Update user's mailketingLists array
              const currentLists = (transaction.user.mailketingLists as string[]) || []
              if (!currentLists.includes(course.mailketingListId)) {
                await prisma.user.update({
                  where: { id: transaction.userId },
                  data: {
                    mailketingLists: [...currentLists, course.mailketingListId]
                  }
                })
              }

              console.log(`✅ User added to Mailketing list: ${course.mailketingListName || course.mailketingListId}`)
            } else {
              console.error('❌ Failed to add user to Mailketing list:', listResult.message)
            }
          } catch (error) {
            console.error('❌ Error adding user to Mailketing list:', error)
          }
        }
      }

      // Handle affiliate commission for course
      const metadata = transaction.metadata as any
      if (metadata?.affiliateId && metadata?.affiliateCommission) {
        try {
          let wallet = await prisma.wallet.findUnique({
            where: { userId: metadata.affiliateId }
          })
          if (!wallet) {
            wallet = await prisma.wallet.create({
              data: {
                userId: metadata.affiliateId,
                balance: 0,
                totalEarnings: 0,
                totalPayout: 0
              }
            })
          }
          
          await prisma.pendingRevenue.create({
            data: {
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: Number(metadata.affiliateCommission),
              type: 'AFFILIATE_COMMISSION',
              percentage: 10,
              status: 'APPROVED'
            }
          })
          console.log(`Affiliate commission created for course purchase`)
        } catch (error) {
          console.error('Error creating affiliate revenue for course:', error)
        }
      }
    }

    // Handle product purchase
    if (transaction.type === 'PRODUCT' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const productId = metadata.productId

      if (productId) {
        // Check if already purchased
        const existingPurchase = await prisma.userProduct.findFirst({
          where: {
            userId: transaction.userId,
            productId: productId,
          },
        })

        if (!existingPurchase) {
          // Get product details to check Mailketing configuration
          const product = await prisma.product.findUnique({
            where: { id: productId }
          })

          // Create user product
          await prisma.userProduct.create({
            data: {
              userId: transaction.userId,
              productId: productId,
              transactionId: transaction.id,
              purchaseDate: new Date(),
              price: transaction.amount,
              isActive: true,
            },
          })

          console.log(`User product created for user ${transaction.userId}, product ${productId}`)

          // Add user to Mailketing list if configured
          if (product && product.mailketingListId && product.autoAddToList) {
            try {
              const listResult = await addUserToMailketingList(
                transaction.user.email,
                product.mailketingListId,
                {
                  name: transaction.user.name,
                  phone: transaction.user.phone || transaction.customerPhone || undefined,
                  purchaseType: 'product',
                  purchaseItem: product.name,
                  purchaseDate: new Date(),
                  purchaseAmount: Number(transaction.amount)
                }
              )

              if (listResult.success) {
                // Update user's mailketingLists array
                const currentLists = (transaction.user.mailketingLists as string[]) || []
                if (!currentLists.includes(product.mailketingListId)) {
                  await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                      mailketingLists: [...currentLists, product.mailketingListId]
                    }
                  })
                }

                console.log(`✅ User added to Mailketing list: ${product.mailketingListName || product.mailketingListId}`)
              } else {
                console.error('❌ Failed to add user to Mailketing list:', listResult.message)
              }
            } catch (error) {
              console.error('❌ Error adding user to Mailketing list:', error)
            }
          }
        }
      }

      // Handle affiliate commission for product
      if (metadata?.affiliateId && metadata?.affiliateCommission) {
        try {
          let wallet = await prisma.wallet.findUnique({
            where: { userId: metadata.affiliateId }
          })
          if (!wallet) {
            wallet = await prisma.wallet.create({
              data: {
                userId: metadata.affiliateId,
                balance: 0,
                totalEarnings: 0,
                totalPayout: 0
              }
            })
          }
          
          await prisma.pendingRevenue.create({
            data: {
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: Number(metadata.affiliateCommission),
              type: 'AFFILIATE_COMMISSION',
              percentage: 10,
              status: 'APPROVED'
            }
          })
          console.log(`Affiliate commission created for product purchase`)
        } catch (error) {
          console.error('Error creating affiliate revenue for product:', error)
        }
      }
    }

    // Handle supplier membership activation
    if (transaction.type === 'SUPPLIER_MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const packageId = metadata.packageId || metadata.upgradeTo

      if (packageId) {
        // Get package details
        const supplierPackage = await prisma.supplierPackage.findUnique({
          where: { id: packageId }
        })

        if (supplierPackage) {
          // Calculate end date based on duration
          const now = new Date()
          let endDate: Date | null = null

          switch (supplierPackage.duration) {
            case 'MONTHLY':
              endDate = new Date(now)
              endDate.setMonth(endDate.getMonth() + 1)
              break
            case 'YEARLY':
              endDate = new Date(now)
              endDate.setFullYear(endDate.getFullYear() + 1)
              break
            case 'LIFETIME':
              endDate = null // Lifetime has no end date
              break
          }

          // Check if this is an upgrade (has upgradeFrom in metadata)
          const isUpgrade = !!metadata.upgradeFrom

          if (isUpgrade) {
            console.log(`🔄 Processing supplier membership UPGRADE for user ${transaction.userId}`)
            
            // Deactivate old membership(s)
            await prisma.supplierMembership.updateMany({
              where: { 
                userId: transaction.userId,
                isActive: true 
              },
              data: { isActive: false }
            })
          }

          // Find existing membership to update or create new
          const existingMembership = await prisma.supplierMembership.findFirst({
            where: { 
              userId: transaction.userId,
              packageId: packageId
            },
            orderBy: { startDate: 'desc' }
          })

          if (existingMembership && !isUpgrade) {
            // Update existing (renewal case)
            await prisma.supplierMembership.update({
              where: { id: existingMembership.id },
              data: {
                packageId: packageId,
                startDate: now,
                endDate: endDate,
                isActive: true,
                autoRenew: false,
                price: transaction.amount,
                paymentId: transaction.id,
                paymentMethod: transaction.paymentMethod || 'ONLINE'
              }
            })
            console.log(`✅ SupplierMembership renewed for user ${transaction.userId}, package ${supplierPackage.name}`)
          } else {
            // Create new (new signup or upgrade)
            await prisma.supplierMembership.create({
              data: {
                userId: transaction.userId,
                packageId: packageId,
                startDate: now,
                endDate: endDate,
                isActive: true,
                autoRenew: false,
                price: transaction.amount,
                paymentId: transaction.id,
                paymentMethod: transaction.paymentMethod || 'ONLINE'
              }
            })
            console.log(`✅ SupplierMembership ${isUpgrade ? 'upgraded' : 'activated'} for user ${transaction.userId}, package ${supplierPackage.name}`)
          }

          // Process revenue distribution for supplier membership
          const { processRevenueDistribution } = await import('@/lib/revenue-split')
          
          try {
            await processRevenueDistribution({
              amount: Number(transaction.amount),
              type: 'SUPPLIER',
              affiliateId: metadata.affiliateId,
              supplierPackageId: packageId,
              transactionId: transaction.id
            })
            
            console.log(`✅ Revenue distribution processed for supplier membership`)
          } catch (revenueError) {
            console.error('❌ Error processing revenue distribution:', revenueError)
          }

          // Get supplier profile for email
          const supplierProfile = await prisma.supplierProfile.findUnique({
            where: { userId: transaction.userId }
          })

          // Send appropriate email based on upgrade or new activation
          if (supplierProfile) {
            if (isUpgrade) {
              // Send upgrade email
              const { sendSupplierUpgradeEmail } = await import('@/lib/email/supplier-email')
              
              try {
                await sendSupplierUpgradeEmail({
                  email: transaction.user.email,
                  name: transaction.user.name,
                  companyName: supplierProfile.companyName,
                  oldPackage: metadata.fromPackageName || 'Free',
                  newPackage: supplierPackage.name,
                  amount: Number(transaction.amount),
                  endDate: endDate || new Date(),
                  dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/supplier/dashboard`
                })
                console.log(`✅ Upgrade confirmation email sent`)
              } catch (emailError) {
                console.error('❌ Error sending upgrade email:', emailError)
              }
            } else {
              // Send payment confirmation email for new signup
              const { sendSupplierPaymentConfirmation } = await import('@/lib/email/supplier-email')
              
              try {
                await sendSupplierPaymentConfirmation({
                  email: transaction.user.email,
                  name: transaction.user.name,
                  companyName: supplierProfile.companyName,
                  packageName: supplierPackage.name,
                  amount: Number(transaction.amount),
                  transactionId: transaction.id,
                  invoiceUrl: transaction.invoiceUrl || `${process.env.NEXT_PUBLIC_APP_URL}/transactions/${transaction.id}`,
                  endDate: endDate || new Date()
                })
                console.log(`✅ Payment confirmation email sent`)
              } catch (emailError) {
                console.error('❌ Error sending payment email:', emailError)
              }
            }
          }

          // 🔔 NOTIFICATION TRIGGER: Supplier membership activated
          await notificationService.send({
            userId: transaction.userId,
            type: 'TRANSACTION_SUCCESS',
            title: 'Supplier Membership Aktif',
            message: `Paket ${supplierPackage.name} Anda telah aktif. Selamat datang!`,
            transactionId: transaction.id,
            redirectUrl: '/supplier/dashboard',
            channels: ['pusher', 'onesignal', 'email'],
          })
        }
      }
    }

    // Send notification email/WhatsApp
    await sendPaymentNotification(transaction, 'success')

    console.log(`Payment successful for transaction ${external_id}`)

  } catch (error) {
    console.error('Error handling invoice paid:', error)
  }
}

async function handleInvoiceExpired(data: any) {
  try {
    const { external_id } = data
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: external_id }
    })

    if (!transaction) return

    const currentMetadata = transaction.metadata as any || {}
    
    await prisma.transaction.update({
      where: { id: external_id },
      data: {
        status: 'FAILED',
        expiredAt: new Date(),
        metadata: {
          ...currentMetadata,
          expiredAt: new Date().toISOString(),
          expiredReason: 'Invoice expired'
        }
      }
    })

    console.log(`Invoice expired for transaction ${external_id}`)

  } catch (error) {
    console.error('Error handling invoice expired:', error)
  }
}

async function handleVAPaymentComplete(data: any) {
  try {
    // Support both old VA API and new PaymentRequest API
    const external_id = data.external_id || data.reference_id
    const payment_id = data.payment_id || data.id
    const amount = data.amount || data.captured_amount
    const bank_code = data.bank_code || data.payment_method?.virtual_account?.channel_code
    
    console.log('[Xendit Webhook] Processing VA payment:', { external_id, payment_id, bank_code })
    
    const transaction = await prisma.transaction.findUnique({
      where: { externalId: external_id },
      include: { 
        user: true,
      }
    })

    if (!transaction) {
      console.error('[Xendit Webhook] Transaction not found:', external_id)
      return
    }

    const currentMetadata = transaction.metadata as any || {}

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(),
        paymentMethod: bank_code ? `VA_${bank_code}` : 'VIRTUAL_ACCOUNT',
        reference: payment_id,
        metadata: {
          ...currentMetadata,
          xenditVABankCode: bank_code,
          xenditVAAmount: amount,
          xenditPaymentId: payment_id,
        }
      }
    })

    console.log('[Xendit Webhook] ✅ Transaction updated to SUCCESS:', transaction.id)

    // Process membership activation (same logic as handleInvoicePaid)
    if (transaction.type === 'MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const membershipId = metadata.membershipId

      if (membershipId) {
        const existingUserMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            transactionId: transaction.id,
          },
        })

        if (!existingUserMembership) {
          const membership = await prisma.membership.findUnique({
            where: { id: membershipId }
          })

          if (membership) {
            // Fetch related data separately  
            const [membershipGroupsVA, membershipCoursesVA, membershipProductsVA] = await Promise.all([
              prisma.membershipGroup.findMany({
                where: { membershipId }
              }),
              prisma.membershipCourse.findMany({
                where: { membershipId }
              }),
              prisma.membershipProduct.findMany({
                where: { membershipId }
              })
            ])

            // Fetch groups, courses, products details
            const groupIdsVA = membershipGroupsVA.map(mg => mg.groupId)
            const courseIdsVA = membershipCoursesVA.map(mc => mc.courseId)
            const productIdsVA = membershipProductsVA.map(mp => mp.productId)

            const [groupsVA, coursesVA, productsVA] = await Promise.all([
              groupIdsVA.length > 0 ? prisma.group.findMany({
                where: { id: { in: groupIdsVA } },
                select: { id: true, name: true }
              }) : [],
              courseIdsVA.length > 0 ? prisma.course.findMany({
                where: { id: { in: courseIdsVA } },
                select: { id: true, title: true }
              }) : [],
              productIdsVA.length > 0 ? prisma.product.findMany({
                where: { id: { in: productIdsVA } },
                select: { id: true, name: true }
              }) : []
            ])
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
            }

            await prisma.userMembership.create({
              data: {
                userId: transaction.userId,
                membershipId: membershipId,
                status: 'ACTIVE',
                isActive: true,
                activatedAt: now,
                startDate: now,
                endDate,
                price: transaction.amount,
                transactionId: transaction.id,
              },
            })

            console.log('[Xendit Webhook] ✅ UserMembership created:', membershipId)

            // Auto-join groups, courses, products (same as handleInvoicePaid)
            for (const mg of membership.membershipGroups) {
              await prisma.groupMember.create({
                data: {
                  groupId: mg.group.id,
                  userId: transaction.userId,
                  role: 'MEMBER'
                }
              }).catch(() => {})
            }

            for (const mc of membership.membershipCourses) {
              await prisma.courseEnrollment.create({
                data: {
                  userId: transaction.userId,
                  courseId: mc.course.id
                }
              }).catch(() => {})
            }

            for (const mp of membership.membershipProducts) {
              await prisma.userProduct.create({
                data: {
                  userId: transaction.userId,
                  productId: mp.product.id,
                  transactionId: transaction.id,
                  purchaseDate: now,
                  price: 0
                }
              }).catch(() => {})
            }

            // Add to Mailketing list
            if (membership.mailketingListId && membership.autoAddToList) {
              try {
                const listResult = await addUserToMailketingList(
                  transaction.user.email,
                  membership.mailketingListId,
                  {
                    name: transaction.user.name,
                    phone: transaction.user.phone || transaction.customerPhone || undefined,
                    purchaseType: 'membership',
                    purchaseItem: membership.name,
                    purchaseDate: now,
                    purchaseAmount: Number(transaction.amount)
                  }
                )

                if (listResult.success) {
                  const currentLists = (transaction.user.mailketingLists as string[]) || []
                  if (!currentLists.includes(membership.mailketingListId)) {
                    await prisma.user.update({
                      where: { id: transaction.userId },
                      data: {
                        mailketingLists: [...currentLists, membership.mailketingListId]
                      }
                    })
                  }
                  console.log('[Xendit Webhook] ✅ User added to Mailketing list')
                }
              } catch (error) {
                console.error('[Xendit Webhook] ❌ Mailketing error:', error)
              }
            }
          }
        } else {
          await prisma.userMembership.update({
            where: { id: existingUserMembership.id },
            data: {
              status: 'ACTIVE',
              isActive: true,
              activatedAt: new Date(),
            },
          })
          console.log('[Xendit Webhook] ✅ UserMembership activated')
        }
      }

      // Process revenue distribution
      const { processRevenueDistribution } = await import('@/lib/revenue-split')
      await processRevenueDistribution({
        amount: Number(transaction.amount),
        type: 'MEMBERSHIP',
        affiliateId: metadata.affiliateId,
        membershipId,
        transactionId: transaction.id
      })
    }

    // ============================================
    // Handle PRODUCT purchase via VA Payment
    // ============================================
    if (transaction.type === 'PRODUCT' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const productId = metadata.productId

      if (productId) {
        // Check if already purchased
        const existingPurchase = await prisma.userProduct.findFirst({
          where: {
            userId: transaction.userId,
            productId: productId,
          },
        })

        if (!existingPurchase) {
          // Get product details
          const product = await prisma.product.findUnique({
            where: { id: productId }
          })

          // Create user product
          await prisma.userProduct.create({
            data: {
              userId: transaction.userId,
              productId: productId,
              transactionId: transaction.id,
              purchaseDate: new Date(),
              price: transaction.amount,
              isActive: true,
            },
          })

          console.log('[Xendit Webhook] ✅ UserProduct created for VA payment:', productId)

          // Add user to Mailketing list if configured
          if (product && product.mailketingListId && product.autoAddToList) {
            try {
              const listResult = await addUserToMailketingList(
                transaction.user.email,
                product.mailketingListId,
                {
                  name: transaction.user.name,
                  phone: transaction.user.phone || transaction.customerPhone || undefined,
                  purchaseType: 'product',
                  purchaseItem: product.name,
                  purchaseDate: new Date(),
                  purchaseAmount: Number(transaction.amount)
                }
              )

              if (listResult.success) {
                const currentLists = (transaction.user.mailketingLists as string[]) || []
                if (!currentLists.includes(product.mailketingListId)) {
                  await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                      mailketingLists: [...currentLists, product.mailketingListId]
                    }
                  })
                }
                console.log('[Xendit Webhook] ✅ User added to product Mailketing list')
              }
            } catch (error) {
              console.error('[Xendit Webhook] ❌ Mailketing error for product:', error)
            }
          }

          // 🔔 Send notification
          await notificationService.send({
            userId: transaction.userId,
            type: 'TRANSACTION_SUCCESS',
            title: 'Pembelian Produk Berhasil',
            message: `Produk "${product?.name || 'Digital Product'}" sudah dapat diakses`,
            transactionId: transaction.id,
            redirectUrl: `/dashboard/products`,
            channels: ['pusher', 'onesignal', 'email'],
          })
        }
      }

      // Handle affiliate commission for product
      if (metadata?.affiliateId) {
        try {
          // Process revenue distribution for product
          const { processRevenueDistribution } = await import('@/lib/revenue-split')
          await processRevenueDistribution({
            amount: Number(transaction.amount),
            type: 'PRODUCT',
            affiliateId: metadata.affiliateId,
            productId: productId,
            transactionId: transaction.id
          })
          console.log('[Xendit Webhook] ✅ Revenue distribution processed for product')
        } catch (error) {
          console.error('[Xendit Webhook] ❌ Error processing product revenue:', error)
        }
      }
    }

    // ============================================
    // Handle COURSE purchase via VA Payment
    // ============================================
    if (transaction.type === 'COURSE' && transaction.courseId) {
      // Check if already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: transaction.courseId,
          userId: transaction.userId,
        },
      })

      if (!existingEnrollment) {
        const course = await prisma.course.findUnique({
          where: { id: transaction.courseId }
        })

        // Create enrollment
        await prisma.courseEnrollment.create({
          data: {
            userId: transaction.userId,
            courseId: transaction.courseId,
            progress: 0,
            transactionId: transaction.id,
          },
        })

        console.log('[Xendit Webhook] ✅ CourseEnrollment created for VA payment:', transaction.courseId)

        // Notify mentor
        if (course && course.mentorId && course.mentorId !== transaction.userId) {
          await notificationService.send({
            userId: course.mentorId,
            type: 'COURSE_ENROLLED',
            title: 'Siswa Baru di Kursus Anda',
            message: `${transaction.user.name} telah mendaftar di kursus ${course.title}`,
            courseId: transaction.courseId,
            redirectUrl: `/courses/${transaction.courseId}/students`,
            channels: ['pusher', 'onesignal'],
          })
        }

        // Add to Mailketing list
        if (course && course.mailketingListId && course.autoAddToList) {
          try {
            const listResult = await addUserToMailketingList(
              transaction.user.email,
              course.mailketingListId,
              {
                name: transaction.user.name,
                phone: transaction.user.phone || transaction.customerPhone || undefined,
                purchaseType: 'course',
                purchaseItem: course.title,
                purchaseDate: new Date(),
                purchaseAmount: Number(transaction.amount)
              }
            )

            if (listResult.success) {
              const currentLists = (transaction.user.mailketingLists as string[]) || []
              if (!currentLists.includes(course.mailketingListId)) {
                await prisma.user.update({
                  where: { id: transaction.userId },
                  data: {
                    mailketingLists: [...currentLists, course.mailketingListId]
                  }
                })
              }
              console.log('[Xendit Webhook] ✅ User added to course Mailketing list')
            }
          } catch (error) {
            console.error('[Xendit Webhook] ❌ Mailketing error for course:', error)
          }
        }
      }

      // Handle affiliate commission for course
      const metadata = transaction.metadata as any
      if (metadata?.affiliateId) {
        try {
          const { processRevenueDistribution } = await import('@/lib/revenue-split')
          await processRevenueDistribution({
            amount: Number(transaction.amount),
            type: 'COURSE',
            affiliateId: metadata.affiliateId,
            courseId: transaction.courseId,
            transactionId: transaction.id
          })
          console.log('[Xendit Webhook] ✅ Revenue distribution processed for course')
        } catch (error) {
          console.error('[Xendit Webhook] ❌ Error processing course revenue:', error)
        }
      }
    }

    // ============================================
    // Handle EVENT TICKET PURCHASE
    // ============================================
    if (transaction.type === 'EVENT' && transaction.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: transaction.eventId },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      if (event) {
        // Check if EventRSVP already exists
        const existingRsvp = await prisma.eventRSVP.findFirst({
          where: {
            eventId: transaction.eventId,
            userId: transaction.userId,
            transactionId: transaction.id
          }
        })

        if (!existingRsvp) {
          // Create EventRSVP for paid event
          await prisma.eventRSVP.create({
            data: {
              eventId: transaction.eventId,
              userId: transaction.userId,
              status: 'GOING',
              transactionId: transaction.id,
              isPaid: true,
              paidAt: new Date(),
              attended: false
            }
          })

          console.log(`[Xendit Webhook] ✅ Event RSVP created for user ${transaction.userId} to event ${transaction.eventId}`)
        }

        // 🔔 NOTIFICATION: Event ticket purchase confirmation
        await notificationService.send({
          userId: transaction.userId,
          type: 'EVENT_TICKET_PURCHASED',
          title: '✅ Tiket Event Terkonfirmasi!',
          message: `Tiket Anda untuk ${event.title} telah dikonfirmasi. Event pada ${new Date(event.startDate).toLocaleDateString('id-ID')}`,
          eventId: transaction.eventId,
          redirectUrl: `/events/${transaction.eventId}`,
          channels: ['pusher', 'onesignal', 'email'],
        })

        // Send email confirmation with event details
        try {
          const { mailketing } = await import('@/lib/integrations/mailketing')
          await mailketing.sendEmail(transaction.user.email, {
            subject: `✅ Tiket Event Terkonfirmasi: ${event.title}`,
            body: `
              <h2>Tiket Event Anda Terkonfirmasi!</h2>
              <p>Halo ${transaction.user.name},</p>
              <p>Terima kasih telah membeli tiket untuk acara kami.</p>
              
              <h3>Detail Event:</h3>
              <ul>
                <li><strong>Judul:</strong> ${event.title}</li>
                <li><strong>Tanggal:</strong> ${new Date(event.startDate).toLocaleDateString('id-ID')} ${new Date(event.startDate).toLocaleTimeString('id-ID')}</li>
                <li><strong>Lokasi:</strong> ${event.location || 'Online'}</li>
                ${event.meetingUrl ? `<li><strong>Link Meeting:</strong> <a href="${event.meetingUrl}">Klik di sini</a></li>` : ''}
              </ul>
              
              <h3>Pembayaran:</h3>
              <ul>
                <li>Jumlah Tiket: 1</li>
                <li>Harga Tiket: Rp ${Math.round(parseFloat(event.price?.toString() || '0')).toLocaleString('id-ID')}</li>
                <li>Total Dibayar: Rp ${Math.round(Number(transaction.amount)).toLocaleString('id-ID')}</li>
              </ul>
              
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Lihat Detail Event</a></p>
              
              <p>Jangan lupa untuk hadir tepat waktu!</p>
            `,
            fromName: 'EksporYuk',
          })
        } catch (emailError) {
          console.error('[Xendit Webhook] Error sending event ticket email:', emailError)
        }

        // 🔔 NOTIFICATION: Notify event creator of ticket sale
        if (event.creator) {
          await notificationService.send({
            userId: event.creator.id,
            type: 'EVENT_TICKET_SOLD',
            title: '🎉 Penjualan Tiket Baru!',
            message: `${transaction.user.name} membeli tiket untuk event ${event.title}`,
            eventId: transaction.eventId,
            redirectUrl: `/admin/events/${transaction.eventId}`,
            channels: ['pusher', 'onesignal'],
          })
        }

        // Process revenue distribution for event
        try {
          const { processRevenueDistribution } = await import('@/lib/revenue-split')
          await processRevenueDistribution({
            amount: Number(transaction.amount),
            type: 'EVENT',
            affiliateId: transaction.affiliateId,
            eventId: transaction.eventId,
            eventCreatorId: event.creator?.id,
            transactionId: transaction.id
          })
          console.log('[Xendit Webhook] ✅ Revenue distribution processed for event')
        } catch (error) {
          console.error('[Xendit Webhook] ❌ Error processing event revenue:', error)
        }
      }
    }

    // ============================================
    // Handle CREDIT_TOPUP via VA Payment
    // ============================================
    if (transaction.type === 'CREDIT_TOPUP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const affiliateId = metadata.affiliateId
      const credits = metadata.credits

      if (affiliateId && credits) {
        console.log(`[Xendit Webhook] Processing credit top-up via VA: ${credits} credits for affiliate ${affiliateId}`)

        // Get or create credit account
        let creditAccount = await prisma.affiliateCredit.findUnique({
          where: { affiliateId },
        })

        if (!creditAccount) {
          creditAccount = await prisma.affiliateCredit.create({
            data: {
              affiliateId,
              balance: 0,
              totalTopUp: 0,
              totalUsed: 0,
            },
          })
        }

        const balanceBefore = creditAccount.balance
        const balanceAfter = balanceBefore + credits

        // Create credit transaction
        await prisma.affiliateCreditTransaction.create({
          data: {
            creditId: creditAccount.id,
            affiliateId,
            type: 'TOPUP',
            amount: credits,
            balanceBefore,
            balanceAfter,
            description: `Top up ${credits} kredit via VA Payment`,
            paymentId: transaction.reference || transaction.id,
            referenceType: 'PAYMENT',
            referenceId: transaction.id,
            status: 'COMPLETED',
          },
        })

        // Update credit balance
        await prisma.affiliateCredit.update({
          where: { id: creditAccount.id },
          data: {
            balance: balanceAfter,
            totalTopUp: creditAccount.totalTopUp + credits,
          },
        })

        console.log(`[Xendit Webhook] ✅ Credit top-up via VA successful: ${credits} credits added`)

        // Send notification
        await notificationService.send({
          userId: transaction.userId,
          type: 'TRANSACTION_SUCCESS',
          title: 'Top Up Kredit Berhasil',
          message: `${credits} kredit berhasil ditambahkan ke akun Anda. Saldo: ${balanceAfter}`,
          redirectUrl: '/affiliate/credits',
          channels: ['pusher', 'onesignal', 'email'],
        })
      }
    }

    await sendPaymentNotification(transaction, 'success')

  } catch (error) {
    console.error('[Xendit Webhook] Error handling VA payment:', error)
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const external_id = data.external_id || data.reference_id
    const failure_reason = data.failure_reason || data.failure_code
    
    console.log('[Xendit Webhook] Processing payment failed:', { external_id, failure_reason })
    
    const transaction = await prisma.transaction.findUnique({
      where: { externalId: external_id }
    })

    if (!transaction) {
      console.error('[Xendit Webhook] Transaction not found:', external_id)
      return
    }

    const currentMetadata = transaction.metadata as any || {}
    
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...currentMetadata,
          failureReason: failure_reason,
          failedAt: new Date().toISOString()
        }
      }
    })

    console.log('[Xendit Webhook] ❌ Transaction marked as FAILED:', transaction.id)

  } catch (error) {
    console.error('[Xendit Webhook] Error handling payment failed:', error)
  }
}

async function handleEWalletPaymentComplete(data: any) {
  try {
    const { reference_id, capture_amount, channel_code } = data
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: reference_id },
      include: { 
        membership: true,
        user: true,
      }
    })

    if (!transaction) return

    const currentMetadata = transaction.metadata as any || {}

    await prisma.transaction.update({
      where: { id: reference_id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(),
        paymentMethod: `EWALLET_${channel_code}`,
        reference: data.id,
        metadata: {
          ...currentMetadata,
          xenditEWalletChannel: channel_code,
          xenditCaptureAmount: capture_amount
        }
      }
    })

    console.log('[Xendit Webhook] ✅ E-Wallet payment SUCCESS:', transaction.id)

    // ============================================
    // Handle MEMBERSHIP via E-Wallet
    // ============================================
    if (transaction.membership) {
      await prisma.userMembership.update({
        where: { id: transaction.membership.id },
        data: {
          status: 'ACTIVE',
          isActive: true,
          activatedAt: new Date()
        }
      })
      console.log('[Xendit Webhook] ✅ Membership activated via E-Wallet')
    }

    // ============================================
    // Handle PRODUCT via E-Wallet
    // ============================================
    if (transaction.type === 'PRODUCT' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const productId = metadata.productId

      if (productId) {
        const existingPurchase = await prisma.userProduct.findFirst({
          where: {
            userId: transaction.userId,
            productId: productId,
          },
        })

        if (!existingPurchase) {
          const product = await prisma.product.findUnique({
            where: { id: productId }
          })

          await prisma.userProduct.create({
            data: {
              userId: transaction.userId,
              productId: productId,
              transactionId: transaction.id,
              purchaseDate: new Date(),
              price: transaction.amount,
              isActive: true,
            },
          })

          console.log('[Xendit Webhook] ✅ UserProduct created via E-Wallet:', productId)

          // Add to Mailketing list
          if (product && product.mailketingListId && product.autoAddToList && transaction.user) {
            try {
              const listResult = await addUserToMailketingList(
                transaction.user.email,
                product.mailketingListId,
                {
                  name: transaction.user.name,
                  purchaseType: 'product',
                  purchaseItem: product.name,
                  purchaseDate: new Date(),
                  purchaseAmount: Number(transaction.amount)
                }
              )

              if (listResult.success) {
                const currentLists = (transaction.user.mailketingLists as string[]) || []
                if (!currentLists.includes(product.mailketingListId)) {
                  await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                      mailketingLists: [...currentLists, product.mailketingListId]
                    }
                  })
                }
              }
            } catch (error) {
              console.error('[Xendit Webhook] ❌ Mailketing error:', error)
            }
          }

          // Notification
          await notificationService.send({
            userId: transaction.userId,
            type: 'TRANSACTION_SUCCESS',
            title: 'Pembelian Produk Berhasil',
            message: `Produk "${product?.name || 'Digital Product'}" sudah dapat diakses`,
            transactionId: transaction.id,
            redirectUrl: `/dashboard/products`,
            channels: ['pusher', 'onesignal', 'email'],
          })
        }
      }

      // Affiliate commission
      if (metadata?.affiliateId) {
        try {
          const { processRevenueDistribution } = await import('@/lib/revenue-split')
          await processRevenueDistribution({
            amount: Number(transaction.amount),
            type: 'PRODUCT',
            affiliateId: metadata.affiliateId,
            productId: productId,
            transactionId: transaction.id
          })
        } catch (error) {
          console.error('[Xendit Webhook] ❌ Product revenue error:', error)
        }
      }
    }

    // ============================================
    // Handle COURSE via E-Wallet
    // ============================================
    if (transaction.type === 'COURSE' && transaction.courseId) {
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: transaction.courseId,
          userId: transaction.userId,
        },
      })

      if (!existingEnrollment) {
        await prisma.courseEnrollment.create({
          data: {
            userId: transaction.userId,
            courseId: transaction.courseId,
            progress: 0,
            transactionId: transaction.id,
          },
        })
        console.log('[Xendit Webhook] ✅ CourseEnrollment created via E-Wallet')
      }
    }

    // ============================================
    // Handle CREDIT_TOPUP via E-Wallet
    // ============================================
    if (transaction.type === 'CREDIT_TOPUP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const affiliateId = metadata.affiliateId
      const credits = metadata.credits

      if (affiliateId && credits) {
        let creditAccount = await prisma.affiliateCredit.findUnique({
          where: { affiliateId },
        })

        if (!creditAccount) {
          creditAccount = await prisma.affiliateCredit.create({
            data: {
              affiliateId,
              balance: 0,
              totalTopUp: 0,
              totalUsed: 0,
            },
          })
        }

        const balanceBefore = creditAccount.balance
        const balanceAfter = balanceBefore + credits

        await prisma.affiliateCreditTransaction.create({
          data: {
            creditId: creditAccount.id,
            affiliateId,
            type: 'TOPUP',
            amount: credits,
            balanceBefore,
            balanceAfter,
            description: `Top up ${credits} kredit via E-Wallet`,
            paymentId: data.id,
            referenceType: 'PAYMENT',
            referenceId: transaction.id,
            status: 'COMPLETED',
          },
        })

        await prisma.affiliateCredit.update({
          where: { id: creditAccount.id },
          data: {
            balance: balanceAfter,
            totalTopUp: creditAccount.totalTopUp + credits,
          },
        })

        console.log(`[Xendit Webhook] ✅ Credit top-up via E-Wallet: ${credits} credits`)

        await notificationService.send({
          userId: transaction.userId,
          type: 'TRANSACTION_SUCCESS',
          title: 'Top Up Kredit Berhasil',
          message: `${credits} kredit berhasil ditambahkan. Saldo: ${balanceAfter}`,
          redirectUrl: '/affiliate/credits',
          channels: ['pusher', 'onesignal', 'email'],
        })
      }
    }

    await sendPaymentNotification(transaction, 'success')

  } catch (error) {
    console.error('Error handling eWallet payment:', error)
  }
}

async function sendPaymentNotification(transaction: any, status: 'success' | 'failed') {
  try {
    if (status === 'success') {
      console.log(`📧 Sending success emails to ${transaction.customerEmail}`)
      
      // Get item name based on transaction type
      let itemName = 'Item'
      if (transaction.type === 'MEMBERSHIP' && transaction.membership) {
        itemName = transaction.membership.name
      } else if (transaction.type === 'PRODUCT' && transaction.product) {
        itemName = transaction.product.name
      } else if (transaction.type === 'COURSE' && transaction.course) {
        itemName = transaction.course.title
      }

      // 1. Send payment success email
      const paymentEmailData = emailTemplates.paymentSuccess({
        userName: transaction.customerName || 'Member',
        amount: Number(transaction.amount),
        invoiceNumber: transaction.id,
        paymentMethod: transaction.paymentMethod || 'Online Payment',
        transactionDate: new Date(transaction.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        itemName: itemName
      })

      await mailketing.sendEmail({
        to: transaction.customerEmail,
        subject: paymentEmailData.subject,
        html: paymentEmailData.html,
        tags: ['payment', 'success', transaction.type.toLowerCase()]
      })

      // 2. Send membership activation email if it's a membership purchase
      if (transaction.type === 'MEMBERSHIP' && transaction.membership) {
        const membershipEmailData = emailTemplates.membershipActivation({
          userName: transaction.customerName || 'Member',
          membershipName: transaction.membership.name,
          membershipDuration: transaction.membership.duration || 'Lifetime',
          startDate: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          endDate: transaction.endDate 
            ? new Date(transaction.endDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : null,
          price: Number(transaction.amount),
          invoiceNumber: transaction.id,
          benefitsList: [
            '🎓 Akses ke semua kursus premium',
            '👥 Bergabung dengan komunitas eksklusif',
            '📊 Database buyer & supplier internasional',
            '📄 Template dokumen ekspor lengkap',
            '💬 Konsultasi gratis dengan mentor ahli'
          ]
        })

        await mailketing.sendEmail({
          to: transaction.customerEmail,
          subject: membershipEmailData.subject,
          html: membershipEmailData.html,
          tags: ['membership', 'activation']
        })
      }

      console.log('✅ Success emails sent')

      // Optional: Send WhatsApp message
      if (transaction.customerWhatsapp) {
        const message = `✅ Pembayaran berhasil!\n\nTransaction ID: ${transaction.id}\nAmount: Rp ${transaction.amount.toLocaleString('id-ID')}\n\nTerima kasih telah bergabung dengan Ekspor Yuk! Cek email untuk detail lengkap.`
        
        // TODO: Integrate WhatsApp API (Starsender)
        // await sendWhatsAppMessage(transaction.customerWhatsapp, message)
        console.log('📱 WhatsApp notification queued:', transaction.customerWhatsapp)
      }

    } else {
      console.log(`❌ Payment failed for transaction ${transaction.id}`)
      // TODO: Send payment failed email (optional)
    }

  } catch (error) {
    console.error('❌ Error sending notification:', error)
  }
}
