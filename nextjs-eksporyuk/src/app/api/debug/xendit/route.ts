import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        paymentEnableXendit: true,
      },
    })

    const hasXenditSecretKey = !!process.env.XENDIT_SECRET_KEY
    const hasXenditWebhookToken = !!process.env.XENDIT_WEBHOOK_TOKEN
    const isXenditEnabledInDB = settings?.paymentEnableXendit !== false

    const xenditEnabled = hasXenditSecretKey && hasXenditWebhookToken && isXenditEnabledInDB

    return NextResponse.json({
      debug: {
        hasXenditSecretKey,
        hasXenditWebhookToken,
        isXenditEnabledInDB,
        xenditEnabled,
        paymentEnableXenditValue: settings?.paymentEnableXendit
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}