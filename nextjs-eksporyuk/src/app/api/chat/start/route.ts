/**
 * POST /api/chat/start
 * Start or get direct chat with another user
 * 
 * Restrictions:
 * - Free suppliers cannot receive chat (only premium suppliers can)
 * - Only premium suppliers can receive chat from members
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { chatService } from '@/lib/services/chatService'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { recipientId } = body
    
    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId required' },
        { status: 400 }
      )
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Try to check if recipient is a supplier with chat restrictions
    try {
      const recipientSupplier = await prisma.supplierProfile.findUnique({
        where: { userId: recipientId },
        include: {
          membership: {
            include: { package: true }
          }
        }
      })

      // If recipient is a supplier, check if they're on a premium plan that allows chat
      if (recipientSupplier && recipientSupplier.membership?.package) {
        const membershipFeatures = recipientSupplier.membership.package.features as any
        const chatEnabled = membershipFeatures?.chatEnabled === true

        if (!chatEnabled) {
          return NextResponse.json(
            {
              error: 'Supplier ini tidak menerima pesan langsung',
              code: 'SUPPLIER_CHAT_DISABLED',
              message: 'Supplier ini menggunakan paket Free dan tidak bisa menerima pesan. Upgrade ke Premium untuk mengaktifkan chat.',
              upgradeUrl: '/pricing/supplier'
            },
            { status: 403 }
          )
        }

        // Check monthly chat quota
        const maxChatsPerMonth = membershipFeatures?.maxChatsPerMonth ?? -1
        if (maxChatsPerMonth !== -1) {
          // Get the start of current month
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          // Count chats this month (new rooms created with this supplier)
          const chatCountThisMonth = await prisma.chatRoom.count({
            where: {
              type: 'DIRECT',
              createdAt: { gte: startOfMonth },
              participants: {
                some: { userId: recipientId }
              }
            }
          })

          if (chatCountThisMonth >= maxChatsPerMonth) {
            return NextResponse.json(
              {
                error: 'Kuota chat supplier sudah habis bulan ini',
                code: 'SUPPLIER_CHAT_QUOTA_EXCEEDED',
                message: `Supplier ini sudah mencapai batas ${maxChatsPerMonth} chat per bulan. Silakan coba lagi bulan depan.`,
                maxChatsPerMonth,
                currentCount: chatCountThisMonth,
              },
              { status: 403 }
            )
          }
        }
      }
    } catch (supplierCheckError) {
      // If supplier check fails, continue anyway (non-suppliers can chat)
      console.log('[API] Supplier check skipped:', supplierCheckError)
    }
    
    console.log('[API] Creating/getting room for:', { userId: session.user.id, recipientId })
    const room = await chatService.getOrCreateDirectRoom(session.user.id, recipientId)
    console.log('[API] Room created/found:', room?.id)
    
    return NextResponse.json({
      success: true,
      room
    })
  } catch (error: any) {
    console.error('[API] Start chat error:', error?.message || error)
    console.error('[API] Start chat error stack:', error?.stack)
    console.error('[API] Start chat full error:', JSON.stringify(error, null, 2))
    // Return actual error for debugging
    return NextResponse.json(
      { 
        error: error?.message || 'Tidak dapat memulai chat. Silakan coba lagi.', 
        success: false,
        details: error?.code || error?.name || 'Unknown error'
      },
      { status: 400 }
    )
  }
}
