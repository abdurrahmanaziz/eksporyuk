import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'
import { getNextInvoiceNumber } from '@/lib/invoice-generator'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, mode = 'demo', affiliateCode } = body

    if (!type || !['membership', 'product', 'course'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    // Get admin user
    let adminUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!adminUser && session.user.email) {
      adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    }
    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find affiliate if provided
    let affiliate = null
    if (affiliateCode) {
      affiliate = await prisma.user.findFirst({
        where: { email: affiliateCode, role: 'AFFILIATE' }
      })
    }

    const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
    const invoiceNumber = await getNextInvoiceNumber()

    // MEMBERSHIP
    if (type === 'membership') {
      const membership = await prisma.membership.findFirst({ where: { isActive: true } })
      if (!membership) {
        return NextResponse.json({ error: 'No membership found' }, { status: 404 })
      }

      const amount = Number(membership.price)
      const commission = affiliate ? amount * 0.10 : 0

      if (mode === 'demo') {
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'SUCCESS',
            type: 'MEMBERSHIP',
            paymentProvider: 'DEMO',
            paidAt: new Date(),
            metadata: {
              membershipId: membership.id,
              duration: membership.duration,
              demoMode: true,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        const durationDays = membership.duration === 'ONE_MONTH' ? 30 :
                            membership.duration === 'THREE_MONTHS' ? 90 :
                            membership.duration === 'SIX_MONTHS' ? 180 :
                            membership.duration === 'TWELVE_MONTHS' ? 365 :
                            membership.duration === 'LIFETIME' ? 36500 : 30

        await prisma.userMembership.create({
          data: {
            userId: adminUser.id,
            membershipId: membership.id,
            transactionId: transaction.id,
            status: 'ACTIVE',
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
          }
        })

        if (affiliate && commission > 0) {
          let wallet = await prisma.wallet.findUnique({ where: { userId: affiliate.id } })
          if (!wallet) {
            wallet = await prisma.wallet.create({
              data: { userId: affiliate.id, balance: 0, totalEarnings: 0, totalPayout: 0 }
            })
          }
          await prisma.pendingRevenue.create({
            data: {
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: commission,
              type: 'AFFILIATE_COMMISSION',
              percentage: 10,
              status: 'PENDING'
            }
          })
        }

        return NextResponse.json({
          success: true,
          demoMode: true,
          message: `✅ [DEMO] Membership "${membership.name}" berhasil!${affiliate ? ` Komisi: Rp ${commission.toLocaleString('id-ID')}` : ''}`,
          transaction: { id: transaction.id, amount, membershipName: membership.name }
        })
      } else {
        // Xendit mode
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'PENDING',
            type: 'MEMBERSHIP',
            paymentProvider: 'XENDIT',
            metadata: {
              membershipId: membership.id,
              duration: membership.duration,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        const xenditInvoice = await xenditService.createInvoice({
          externalId: transaction.id,
          payerEmail: adminUser.email!,
          description: `Membership: ${membership.name}`,
          amount,
          currency: 'IDR',
          invoiceDuration: 86400,
          successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=true`,
          failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=false`,
          customerName: adminUser.name!,
          customerEmail: adminUser.email!,
          items: [{ name: `Membership: ${membership.name}`, quantity: 1, price: amount, category: 'Membership' }]
        })

        if (!xenditInvoice.success) {
          return NextResponse.json({ error: 'Xendit invoice failed', details: xenditInvoice.error }, { status: 500 })
        }

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditInvoice.data?.id,
            paymentUrl: xenditInvoice.data?.invoiceUrl
          }
        })

        return NextResponse.json({
          success: true,
          demoMode: false,
          message: `Invoice Xendit created for ${membership.name}`,
          paymentUrl: xenditInvoice.data?.invoiceUrl
        })
      }
    }

    // PRODUCT
    if (type === 'product') {
      const product = await prisma.product.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })

      // Use dummy if no product
      if (!product) {
        if (mode === 'demo') {
          const amount = 100000
          const commission = affiliate ? amount * 0.10 : 0

          const transaction = await prisma.transaction.create({
            data: {
              id: transactionId,
            invoiceNumber,
              userId: adminUser.id,
              amount,
              status: 'SUCCESS',
              type: 'PRODUCT',
              paymentProvider: 'DEMO',
              paidAt: new Date(),
              metadata: {
                productId: 'dummy',
                productName: 'Demo Product',
                demoMode: true,
                affiliateId: affiliate?.id,
                affiliateCommission: commission
              }
            }
          })

          if (affiliate && commission > 0) {
            let wallet = await prisma.wallet.findUnique({ where: { userId: affiliate.id } })
            if (!wallet) {
              wallet = await prisma.wallet.create({
                data: { userId: affiliate.id, balance: 0, totalEarnings: 0, totalPayout: 0 }
              })
            }
            await prisma.pendingRevenue.create({
              data: {
                walletId: wallet.id,
                transactionId: transaction.id,
                amount: commission,
                type: 'AFFILIATE_COMMISSION',
                percentage: 10,
                status: 'PENDING'
              }
            })
          }

          return NextResponse.json({
            success: true,
            demoMode: true,
            message: `✅ [DEMO] Produk "Demo Product" berhasil!${affiliate ? ` Komisi: Rp ${commission.toLocaleString('id-ID')}` : ''}`,
            transaction: { id: transaction.id, amount, productName: 'Demo Product' }
          })
        }
        return NextResponse.json({ error: 'No products found. Use DEMO mode.' }, { status: 404 })
      }

      const amount = Number(product.price)
      const commission = affiliate ? amount * 0.10 : 0

      if (mode === 'demo') {
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'SUCCESS',
            type: 'PRODUCT',
            paymentProvider: 'DEMO',
            paidAt: new Date(),
            metadata: {
              productId: product.id,
              demoMode: true,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        await prisma.userProduct.create({
          data: {
            userId: adminUser.id,
            productId: product.id,
            transactionId: transaction.id,
            purchaseDate: new Date(),
            price: amount,
            isActive: true
          }
        })

        if (affiliate && commission > 0) {
          let wallet = await prisma.wallet.findUnique({ where: { userId: affiliate.id } })
          if (!wallet) {
            wallet = await prisma.wallet.create({
              data: { userId: affiliate.id, balance: 0, totalEarnings: 0, totalPayout: 0 }
            })
          }
          await prisma.pendingRevenue.create({
            data: {
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: commission,
              type: 'AFFILIATE_COMMISSION',
              percentage: 10,
              status: 'PENDING'
            }
          })
        }

        return NextResponse.json({
          success: true,
          demoMode: true,
          message: `✅ [DEMO] Produk "${product.name}" berhasil!${affiliate ? ` Komisi: Rp ${commission.toLocaleString('id-ID')}` : ''}`,
          transaction: { id: transaction.id, amount, productName: product.name }
        })
      } else {
        // Xendit mode
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'PENDING',
            type: 'PRODUCT',
            paymentProvider: 'XENDIT',
            metadata: {
              productId: product.id,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        const xenditInvoice = await xenditService.createInvoice({
          externalId: transaction.id,
          payerEmail: adminUser.email!,
          description: `Product: ${product.name}`,
          amount,
          currency: 'IDR',
          invoiceDuration: 86400,
          successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=true`,
          failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=false`,
          customerName: adminUser.name!,
          customerEmail: adminUser.email!,
          items: [{ name: `Product: ${product.name}`, quantity: 1, price: amount, category: 'Product' }]
        })

        if (!xenditInvoice.success) {
          return NextResponse.json({ error: 'Xendit invoice failed' }, { status: 500 })
        }

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditInvoice.data?.id,
            paymentUrl: xenditInvoice.data?.invoiceUrl
          }
        })

        return NextResponse.json({
          success: true,
          demoMode: false,
          message: `Invoice Xendit created for ${product.name}`,
          paymentUrl: xenditInvoice.data?.invoiceUrl
        })
      }
    }

    // COURSE
    if (type === 'course') {
      const course = await prisma.course.findFirst({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' }
      })

      // Use dummy if no course
      if (!course) {
        if (mode === 'demo') {
          const amount = 500000
          const commission = affiliate ? amount * 0.10 : 0

          const transaction = await prisma.transaction.create({
            data: {
              id: transactionId,
            invoiceNumber,
              userId: adminUser.id,
              amount,
              status: 'SUCCESS',
              type: 'COURSE',
              paymentProvider: 'DEMO',
              paidAt: new Date(),
              metadata: {
                courseId: 'dummy',
                courseTitle: 'Demo Course',
                demoMode: true,
                affiliateId: affiliate?.id,
                affiliateCommission: commission
              }
            }
          })

          if (affiliate && commission > 0) {
            let wallet = await prisma.wallet.findUnique({ where: { userId: affiliate.id } })
            if (!wallet) {
              wallet = await prisma.wallet.create({
                data: { userId: affiliate.id, balance: 0, totalEarnings: 0, totalPayout: 0 }
              })
            }
            await prisma.pendingRevenue.create({
              data: {
                walletId: wallet.id,
                transactionId: transaction.id,
                amount: commission,
                type: 'AFFILIATE_COMMISSION',
                percentage: 10,
                status: 'PENDING'
              }
            })
          }

          return NextResponse.json({
            success: true,
            demoMode: true,
            message: `✅ [DEMO] Kelas "Demo Course" berhasil!${affiliate ? ` Komisi: Rp ${commission.toLocaleString('id-ID')}` : ''}`,
            transaction: { id: transaction.id, amount, courseTitle: 'Demo Course' }
          })
        }
        return NextResponse.json({ error: 'No courses found. Use DEMO mode.' }, { status: 404 })
      }

      const amount = Number(course.price)
      const commission = affiliate ? amount * 0.10 : 0

      if (mode === 'demo') {
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'SUCCESS',
            type: 'COURSE',
            paymentProvider: 'DEMO',
            paidAt: new Date(),
            metadata: {
              courseId: course.id,
              demoMode: true,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        await prisma.courseEnrollment.create({
          data: {
            userId: adminUser.id,
            courseId: course.id,
            transactionId: transaction.id,
            progress: 0
          }
        })

        if (affiliate && commission > 0) {
          let wallet = await prisma.wallet.findUnique({ where: { userId: affiliate.id } })
          if (!wallet) {
            wallet = await prisma.wallet.create({
              data: { userId: affiliate.id, balance: 0, totalEarnings: 0, totalPayout: 0 }
            })
          }
          await prisma.pendingRevenue.create({
            data: {
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: commission,
              type: 'AFFILIATE_COMMISSION',
              percentage: 10,
              status: 'PENDING'
            }
          })
        }

        return NextResponse.json({
          success: true,
          demoMode: true,
          message: `✅ [DEMO] Kelas "${course.title}" berhasil!${affiliate ? ` Komisi: Rp ${commission.toLocaleString('id-ID')}` : ''}`,
          transaction: { id: transaction.id, amount, courseTitle: course.title }
        })
      } else {
        // Xendit mode
        const transaction = await prisma.transaction.create({
          data: {
            id: transactionId,
            invoiceNumber,
            userId: adminUser.id,
            amount,
            status: 'PENDING',
            type: 'COURSE',
            paymentProvider: 'XENDIT',
            metadata: {
              courseId: course.id,
              affiliateId: affiliate?.id,
              affiliateCommission: commission
            }
          }
        })

        const xenditInvoice = await xenditService.createInvoice({
          externalId: transaction.id,
          payerEmail: adminUser.email!,
          description: `Course: ${course.title}`,
          amount,
          currency: 'IDR',
          invoiceDuration: 86400,
          successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=true`,
          failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/integrations?success=false`,
          customerName: adminUser.name!,
          customerEmail: adminUser.email!,
          items: [{ name: `Course: ${course.title}`, quantity: 1, price: amount, category: 'Course' }]
        })

        if (!xenditInvoice.success) {
          return NextResponse.json({ error: 'Xendit invoice failed' }, { status: 500 })
        }

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditInvoice.data?.id,
            paymentUrl: xenditInvoice.data?.invoiceUrl
          }
        })

        return NextResponse.json({
          success: true,
          demoMode: false,
          message: `Invoice Xendit created for ${course.title}`,
          paymentUrl: xenditInvoice.data?.invoiceUrl
        })
      }
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Test transaction error:', error)
    return NextResponse.json({
      error: 'Failed to create test transaction',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
