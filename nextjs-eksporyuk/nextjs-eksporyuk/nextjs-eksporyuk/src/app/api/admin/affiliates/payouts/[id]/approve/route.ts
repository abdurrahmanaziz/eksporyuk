import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/affiliates/payouts/[id]/approve
 * 
 * Approve payout request and update wallet balance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get payout request
    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    // 3. Check if already processed
    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Payout already processed' },
        { status: 400 }
      )
    }

    // 4. Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payout.userId },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // 5. Check if wallet has sufficient balance
    if (wallet.balance < payout.amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient balance. Wallet balance: ${wallet.balance}, Payout amount: ${payout.amount}` 
        },
        { status: 400 }
      )
    }

    // 6. Process payout in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payout status
      const updatedPayout = await tx.payout.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: session.user.id,
        },
      })

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          balance: {
            decrement: payout.amount,
          },
          totalPayout: {
            increment: payout.amount,
          },
        },
      })

      // Create wallet transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: payout.amount,
          description: `Payout approved - ${payout.bankName} ${payout.accountNumber}`,
          status: 'COMPLETED',
          metadata: {
            payoutId: payout.id,
            approvedBy: session.user.id,
            bankName: payout.bankName,
            accountNumber: payout.accountNumber,
            accountName: payout.accountName,
          },
        },
      })

      return { updatedPayout, updatedWallet }
    })

    // 7. Send approval email
    try {
      await mailketing.sendEmail({
        to: payout.user.email,
        subject: '✅ Payout Anda Telah Disetujui',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">✅ Payout Disetujui!</h1>
            <p>Halo ${payout.user.name},</p>
            
            <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin-top: 0;">Informasi Payout</h3>
              <p><strong>Amount:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(payout.amount))}</p>
              <p><strong>Bank:</strong> ${payout.bankName}</p>
              <p><strong>Nomor Rekening:</strong> ${payout.accountNumber}</p>
              <p><strong>Nama Rekening:</strong> ${payout.accountName}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">APPROVED</span></p>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>📌 Catatan:</strong> Dana akan ditransfer ke rekening Anda dalam 1-3 hari kerja.
              </p>
            </div>

            <p>Terima kasih atas partisipasi Anda dalam program affiliate kami!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate/wallet" 
                 style="background: linear-gradient(to right, #ea580c, #dc2626); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Lihat Wallet
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Tim Ekspor Yuk
            </p>
          </div>
        `,
        tags: ['payout', 'approval', 'admin-action'],
      })
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the request if email fails
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Payout approved successfully',
      payout: result.updatedPayout,
      wallet: result.updatedWallet,
    })

  } catch (error) {
    console.error('Error approving payout:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
