import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/users/[id]/change-role - Add role to user (can have multiple roles)
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
    const { role, action } = body // action: 'add' or 'remove'

    const validRoles = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true,
        userRoles: {
          select: { role: true }
        }
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Don't allow changing own admin role
    if (id === session.user.id && role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Tidak bisa mengubah role admin sendiri' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      // Check if role already exists
      const existingRole = await prisma.userRole.findUnique({
        where: {
          userId_role: {
            userId: id,
            role: role,
          }
        }
      })

      if (existingRole) {
        return NextResponse.json(
          { error: 'User sudah memiliki role ini' },
          { status: 400 }
        )
      }

      // Add role to UserRole table
      await prisma.userRole.create({
        data: {
          userId: id,
          role: role,
        }
      })

      // If this is a higher role than current primary role, update it
      const rolePriority: Record<string, number> = {
        'ADMIN': 5,
        'MENTOR': 4,
        'AFFILIATE': 3,
        'MEMBER_PREMIUM': 2,
        'MEMBER_FREE': 1,
      }

      if (rolePriority[role] > rolePriority[user.role]) {
        await prisma.user.update({
          where: { id },
          data: { role },
        })
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'ADD_ROLE',
          entity: 'User',
          entityId: id,
          metadata: {
            targetUserEmail: user.email,
            targetUserName: user.name,
            roleAdded: role,
            addedBy: session.user.id,
          },
        },
      })

      // Send notification email for new role
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
        const roleInfo: Record<string, { title: string; description: string; dashboardUrl: string }> = {
          'MENTOR': {
            title: 'Mentor',
            description: 'Anda sekarang dapat membuat kursus, mengelola siswa, dan mendapatkan penghasilan dari kursus Anda.',
            dashboardUrl: `${appUrl}/mentor/dashboard`
          },
          'AFFILIATE': {
            title: 'Affiliate',
            description: 'Anda sekarang dapat mempromosikan produk dan membership, serta mendapatkan komisi dari setiap penjualan.',
            dashboardUrl: `${appUrl}/affiliate/dashboard`
          },
          'MEMBER_PREMIUM': {
            title: 'Member Premium',
            description: 'Anda sekarang memiliki akses ke semua fitur premium termasuk kursus eksklusif dan komunitas.',
            dashboardUrl: `${appUrl}/dashboard`
          },
          'ADMIN': {
            title: 'Administrator',
            description: 'Anda sekarang memiliki akses penuh ke panel admin.',
            dashboardUrl: `${appUrl}/admin`
          }
        }

        if (roleInfo[role]) {
          await mailketing.sendEmail({
            to: user.email,
            subject: `Selamat! Anda Sekarang ${roleInfo[role].title} di EksporYuk`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 28px;">Role Baru Ditambahkan!</h1>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px;">Halo <strong>${user.name}</strong>,</p>
                  <p style="font-size: 16px;">Selamat! Anda telah ditambahkan sebagai <strong>${roleInfo[role].title}</strong> di EksporYuk.</p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">${roleInfo[role].description}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${roleInfo[role].dashboardUrl}" 
                       style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Akses Dashboard ${roleInfo[role].title}
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
                </div>
              </div>
            `,
            tags: ['role-change', role.toLowerCase()]
          })
          console.log(`[CHANGE_ROLE] Notification email sent for role ${role} to ${user.email}`)
        }
      } catch (emailError) {
        console.error('[CHANGE_ROLE] Error sending notification email:', emailError)
        // Don't fail the role change if email fails
      }

      return NextResponse.json({
        success: true,
        message: `Role ${role} berhasil ditambahkan`,
      })
    } else if (action === 'remove') {
      // Remove role from UserRole table
      await prisma.userRole.deleteMany({
        where: {
          userId: id,
          role: role,
        }
      })

      // If removed role is current primary role, downgrade to next available
      if (user.role === role) {
        const remainingRoles = await prisma.userRole.findMany({
          where: { userId: id },
          select: { role: true },
          orderBy: { createdAt: 'desc' },
        })

        const rolePriority: Record<string, number> = {
          'ADMIN': 5,
          'MENTOR': 4,
          'AFFILIATE': 3,
          'MEMBER_PREMIUM': 2,
          'MEMBER_FREE': 1,
        }

        let highestRole = 'MEMBER_FREE'
        for (const r of remainingRoles) {
          if (rolePriority[r.role] > rolePriority[highestRole]) {
            highestRole = r.role
          }
        }

        await prisma.user.update({
          where: { id },
          data: { role: highestRole as any },
        })
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'REMOVE_ROLE',
          entity: 'User',
          entityId: id,
          metadata: {
            targetUserEmail: user.email,
            targetUserName: user.name,
            roleRemoved: role,
            removedBy: session.user.id,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: `Role ${role} berhasil dihapus`,
      })
    } else {
      return NextResponse.json(
        { error: 'Action tidak valid. Gunakan add atau remove' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error changing role:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah role' },
      { status: 500 }
    )
  }
}
