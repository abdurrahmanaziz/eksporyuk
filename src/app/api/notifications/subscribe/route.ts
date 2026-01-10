/**
 * POST /api/notifications/subscribe
 * Subscribe to notifications for a target (group, course, event)
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { notificationService } from '@/lib/services/notificationService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { subscriptionType, targetId, preferences } = body
    
    if (!subscriptionType || !targetId) {
      return NextResponse.json(
        { error: 'subscriptionType and targetId required' },
        { status: 400 }
      )
    }
    
    const result = await notificationService.subscribe(
      session.user.id,
      subscriptionType,
      targetId,
      preferences
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Subscribed successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] Subscribe notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const subscriptionType = searchParams.get('subscriptionType')
    const targetId = searchParams.get('targetId')
    
    if (!subscriptionType || !targetId) {
      return NextResponse.json(
        { error: 'subscriptionType and targetId required' },
        { status: 400 }
      )
    }
    
    const result = await notificationService.unsubscribe(
      session.user.id,
      subscriptionType,
      targetId
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Unsubscribed successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] Unsubscribe notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
