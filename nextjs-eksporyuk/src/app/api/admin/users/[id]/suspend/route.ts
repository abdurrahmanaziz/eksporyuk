import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/users/[id]/suspend - Suspend/unsuspend user with reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, reason } = body // action: 'suspend' or 'unsuspend'

    // Don't allow suspending yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Tidak bisa suspend akun sendiri' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Don't allow suspending other admins
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Tidak bisa suspend admin lain' },
        { status: 400 }
      )
    }

    if (action === 'suspend') {
      if (!reason) {
        return NextResponse.json(
          { error: 'Alasan suspend harus diisi' },
          { status: 400 }
        )
      }

      // Suspend user
      await prisma.user.update({
        where: { id },
        data: {
          isSuspended: true,
          isActive: false,
          suspendReason: reason,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'SUSPEND_USER',
          entity: 'User',
          entityId: id,
          metadata: {
            targetUserEmail: user.email,
            targetUserName: user.name,
            reason,
            suspendedBy: session.user.id,
          },
        },
      })

      // Notify user about suspension via email
      await notificationService.send({
        userId: id,
        type: 'SYSTEM' as any,
        title: '⚠️ Akun Anda Disuspend',
        message: `Akun Anda telah disuspend. Alasan: ${reason}. Hubungi admin untuk informasi lebih lanjut.`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        channels: ['email', 'whatsapp'],
        metadata: { reason, suspendedBy: session.user.id }
      })

      return NextResponse.json({
        success: true,
        message: 'User berhasil disuspend',
      })
    } else if (action === 'unsuspend') {
      // Unsuspend user
      await prisma.user.update({
        where: { id },
        data: {
          isSuspended: false,
          isActive: true,
          suspendReason: null,
          suspendedAt: null,
          suspendedBy: null,
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'UNSUSPEND_USER',
          entity: 'User',
          entityId: id,
          metadata: {
            targetUserEmail: user.email,
            targetUserName: user.name,
            unsuspendedBy: session.user.id,
          },
        },
      })

      // Notify user about reactivation
      await notificationService.send({
        userId: id,
        type: 'SYSTEM' as any,
        title: '✅ Akun Anda Aktif Kembali',
        message: 'Selamat! Akun Anda telah diaktifkan kembali. Anda bisa melanjutkan aktivitas di platform EksporYuk.',
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        channels: ['pusher', 'onesignal', 'email'],
        metadata: { unsuspendedBy: session.user.id }
      })

      return NextResponse.json({
        success: true,
        message: 'User berhasil diaktifkan kembali',
      })
    } else {
      return NextResponse.json(
        { error: 'Action tidak valid. Gunakan suspend atau unsuspend' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: 'Gagal memproses suspend' },
      { status: 500 }
    )
  }
}
