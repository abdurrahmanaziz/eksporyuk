import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/affiliates/payouts/[id]/reject
 * 
 * Reject payout request
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

    // 2. Get rejection reason from request body
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // 3. Get payout request
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

    // 4. Check if already processed
    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Payout already processed' },
        { status: 400 }
      )
    }

    // 5. Update payout status
    const updatedPayout = await prisma.payout.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: session.user.id,
        notes: reason.trim(),
      },
    })

    // 6. Log the rejection
    console.log('Payout Rejected:', {
      payoutId: params.id,
      userId: payout.userId,
      amount: payout.amount,
      rejectedBy: session.user.id,
      rejectedAt: new Date(),
      reason: reason.trim(),
    })

    // 7. Send rejection email
    try {
      await mailketing.sendEmail({
        to: payout.user.email,
        subject: 'Update Permintaan Payout Anda',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Update Permintaan Payout</h1>
            <p>Halo ${payout.user.name},</p>
            
            <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Payout Tidak Disetujui</h3>
              <p>Mohon maaf, permintaan payout Anda <strong>tidak dapat diproses</strong> saat ini.</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <p style="margin: 0;"><strong>Detail Payout:</strong></p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(payout.amount))}</p>
                <p style="margin: 5px 0;"><strong>Bank:</strong> ${payout.bankName} - ${payout.accountNumber}</p>
                <p style="margin: 5px 0;"><strong>Nama Rekening:</strong> ${payout.accountName}</p>
              </div>

              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <p style="margin: 0;"><strong>Alasan Penolakan:</strong></p>
                <p style="margin: 10px 0 0 0; color: #666;">${reason.trim()}</p>
              </div>
            </div>

            <h3>Apa yang Bisa Dilakukan?</h3>
            <ul>
              <li>Periksa kembali informasi bank yang Anda berikan</li>
              <li>Pastikan saldo wallet Anda mencukupi</li>
              <li>Hubungi tim support jika memerlukan klarifikasi</li>
              <li>Ajukan permintaan payout baru setelah memperbaiki masalah</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate/wallet" 
                 style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Lihat Wallet
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Balance Anda tetap tersimpan di wallet dan dapat digunakan untuk permintaan payout berikutnya.<br>
              Tim Ekspor Yuk
            </p>
          </div>
        `,
        tags: ['payout', 'rejection', 'admin-action'],
      })
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
      // Don't fail the request if email fails
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Payout rejected successfully',
      payout: updatedPayout,
    })

  } catch (error) {
    console.error('Error rejecting payout:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
