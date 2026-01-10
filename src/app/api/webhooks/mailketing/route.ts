/**
 * Mailketing Webhook Handler
 * Tracks email delivery, open, click, bounce events in realtime
 * Route: /api/webhooks/mailketing
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  markEmailDelivered,
  markEmailOpened,
  markEmailClicked,
  markEmailBounced,
  markEmailAsSpam
} from '@/lib/email-tracking-service'

/**
 * POST /api/webhooks/mailketing
 * 
 * Receives webhook events from Mailketing:
 * - delivery: Email delivered to server
 * - open: Email opened by recipient
 * - click: Link clicked in email
 * - bounce: Email bounced (hard or soft)
 * - spam: Email reported as spam
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook token (add to env variables)
    const token = request.headers.get('x-mailketing-token')
    if (token !== process.env.MAILKETING_WEBHOOK_TOKEN) {
      console.warn('❌ Invalid Mailketing webhook token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { event, data } = body

    console.log(`📧 Mailketing webhook: ${event}`, data)

    switch (event) {
      case 'delivery':
        await handleDelivery(data)
        break

      case 'open':
        await handleOpen(data)
        break

      case 'click':
        await handleClick(data)
        break

      case 'bounce':
        await handleBounce(data)
        break

      case 'spam':
        await handleSpam(data)
        break

      default:
        console.warn(`Unknown Mailketing event: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Mailketing webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle delivery event
 * Email successfully delivered to recipient's mail server
 */
async function handleDelivery(data: any) {
  try {
    const { message_id, email, timestamp } = data

    if (!message_id || !email) {
      console.warn('❌ Missing required fields in delivery event:', data)
      return
    }

    await markEmailDelivered(
      message_id,
      timestamp ? new Date(timestamp) : new Date()
    )

    console.log(`✅ Email delivered: ${email}`)
  } catch (error) {
    console.error('Error handling delivery event:', error)
  }
}

/**
 * Handle open event
 * Email opened by recipient
 */
async function handleOpen(data: any) {
  try {
    const { tracking_id, email, ip_address, user_agent, timestamp } = data

    if (!tracking_id) {
      console.warn('❌ Missing tracking_id in open event:', data)
      return
    }

    await markEmailOpened(
      tracking_id,
      ip_address,
      user_agent
    )

    console.log(`👁️  Email opened: ${email}`)
  } catch (error) {
    console.error('Error handling open event:', error)
  }
}

/**
 * Handle click event
 * Link clicked in email by recipient
 */
async function handleClick(data: any) {
  try {
    const { tracking_id, email, url, ip_address, user_agent, timestamp } = data

    if (!tracking_id) {
      console.warn('❌ Missing tracking_id in click event:', data)
      return
    }

    await markEmailClicked(
      tracking_id,
      url,
      ip_address,
      user_agent
    )

    console.log(`🔗 Email clicked: ${email} → ${url}`)
  } catch (error) {
    console.error('Error handling click event:', error)
  }
}

/**
 * Handle bounce event
 * Email bounced (hard or soft bounce)
 */
async function handleBounce(data: any) {
  try {
    const { message_id, email, bounce_type, bounce_reason } = data

    if (!message_id) {
      console.warn('❌ Missing message_id in bounce event:', data)
      return
    }

    const bounceType = (bounce_type || 'HARD').toUpperCase() as 'HARD' | 'SOFT'
    const reason = bounce_reason || 'Unknown bounce reason'

    await markEmailBounced(
      message_id,
      reason,
      bounceType
    )

    console.log(`📬 Email bounced (${bounceType}): ${email} - ${reason}`)
  } catch (error) {
    console.error('Error handling bounce event:', error)
  }
}

/**
 * Handle spam report event
 * Recipient marked email as spam
 */
async function handleSpam(data: any) {
  try {
    const { tracking_id, email, complaint_type } = data

    if (!tracking_id) {
      console.warn('❌ Missing tracking_id in spam event:', data)
      return
    }

    await markEmailAsSpam(tracking_id)

    console.log(`🚨 Email marked as spam: ${email} (${complaint_type || 'complaint'})`)
  } catch (error) {
    console.error('Error handling spam event:', error)
  }
}
