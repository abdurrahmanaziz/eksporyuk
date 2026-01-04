import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// This endpoint handles payment confirmations/webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, status, paymentMethod, reference } = body

    if (!transactionId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        membership: true,
        user: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 })
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: status.toUpperCase() as any,
        paymentMethod: paymentMethod || transaction.paymentMethod || 'ONLINE',
        paidAt: status.toLowerCase() === 'success' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    // If payment successful, activate membership
    if (status.toLowerCase() === 'success') {
      const userMembership = await prisma.userMembership.findFirst({
        where: { transactionId: transaction.id }
      })
      
      if (userMembership) {
        // Query membership separately
        const membership = await prisma.membership.findUnique({
          where: { id: userMembership.membershipId }
        })

        await prisma.userMembership.update({
          where: { id: userMembership.id },
          data: {
            isActive: true,
            activatedAt: new Date()
          }
        })

        // Send welcome email for membership activation
        if (membership) {
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
                  <p style="font-size: 16px;">Anda sekarang memiliki akses ke semua fitur membership.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/dashboard" 
                       style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Mulai Belajar Sekarang
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
                </div>
              </div>
            `,
            tags: ['membership', 'activation']
          })
            console.log('[Payments] Welcome email sent for membership:', membership.name)
          } catch (emailError) {
            console.error('[Payments] Error sending welcome email:', emailError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const transactionId = url.searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID required' 
      }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        coupon: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 })
    }

    // Get membership if exists
    const membership = await prisma.userMembership.findFirst({
      where: { transactionId: transaction.id }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: Number(transaction.amount),
        type: transaction.type,
        customerName: transaction.user.name,
        customerEmail: transaction.user.email,
        createdAt: transaction.createdAt,
        paidAt: transaction.paidAt,
        membership: membership ? {
          isActive: membership.isActive,
          endDate: membership.endDate
        } : null
      }
    })

  } catch (error) {
    console.error('Get payment status error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}