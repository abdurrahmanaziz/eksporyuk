import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { getXenditConfig } from '@/lib/integration-config'
import { validatePaymentAmount } from '@/lib/payment-methods'

// GET - Debug checkout configuration
export async function GET() {
  console.log('[Debug Checkout] === START ===')
  
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: {}
  }
  
  try {
    // Step 1: Check session
    console.log('[Debug Checkout] Step 1: Checking session...')
    const session = await getServerSession(authOptions)
    results.steps.session = {
      success: !!session?.user,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
    }

    // Step 2: Check settings
    console.log('[Debug Checkout] Step 2: Checking settings...')
    const settings = await prisma.settings.findFirst()
    results.steps.settings = {
      success: !!settings,
      paymentMinAmount: settings?.paymentMinAmount || null,
      paymentMaxAmount: settings?.paymentMaxAmount || null,
      paymentExpiryHours: settings?.paymentExpiryHours || null,
    }

    // Step 3: Check payment validation
    console.log('[Debug Checkout] Step 3: Testing payment validation...')
    const validation = await validatePaymentAmount(50000)
    results.steps.paymentValidation = {
      success: validation.valid,
      error: validation.error || null,
    }

    // Step 4: Check Xendit config
    console.log('[Debug Checkout] Step 4: Checking Xendit config...')
    const xenditConfig = await getXenditConfig()
    const xenditKey = xenditConfig?.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY || ''
    const isPlaceholderKey = !xenditKey || 
      xenditKey.toUpperCase().includes('PASTE') || 
      xenditKey.toUpperCase().includes('YOUR_KEY') || 
      xenditKey.toUpperCase().includes('XXX') ||
      xenditKey.length < 20
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    results.steps.xendit = {
      hasDbConfig: !!xenditConfig,
      hasEnvKey: !!process.env.XENDIT_SECRET_KEY,
      keyLength: xenditKey?.length || 0,
      keyPreview: xenditKey ? `${xenditKey.slice(0, 10)}...` : 'none',
      isPlaceholder: isPlaceholderKey,
      isDevelopment,
      willUseMock: isPlaceholderKey && isDevelopment,
    }

    // Step 5: Check affiliate profile (if logged in)
    if (session?.user?.id) {
      console.log('[Debug Checkout] Step 5: Checking affiliate profile...')
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: { select: { name: true, email: true } }
        }
      })
      results.steps.affiliate = {
        success: !!affiliate,
        affiliateId: affiliate?.id || null,
        userName: affiliate?.user?.name || null,
      }

      // Step 6: Check existing credits
      if (affiliate) {
        const credit = await prisma.affiliateCredit.findUnique({
          where: { affiliateId: affiliate.id }
        })
        results.steps.credits = {
          success: !!credit,
          balance: credit?.balance || 0,
          totalTopUp: credit?.totalTopUp || 0,
        }
      }
    }

    results.allPassed = Object.values(results.steps).every((s: any) => s.success !== false)
    
    console.log('[Debug Checkout] Results:', JSON.stringify(results, null, 2))
    
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[Debug Checkout] Error:', error.message)
    results.error = error.message
    results.stack = error.stack
    return NextResponse.json(results, { status: 500 })
  }
}
