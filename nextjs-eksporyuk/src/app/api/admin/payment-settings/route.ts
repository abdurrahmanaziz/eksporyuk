import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment settings from database
    const settings = await prisma.settings.findFirst({
      select: {
        paymentBankAccounts: true,
        paymentXenditChannels: true,
        paymentEnableManual: true,
        paymentEnableXendit: true,
        paymentSandboxMode: true,
        paymentAutoActivation: true,
        paymentExpiryHours: true,
        paymentMinAmount: true,
        paymentMaxAmount: true,
      }
    })

    // Parse JSON data from database
    let bankAccounts = []
    let xenditChannels = []

    try {
      if (settings?.paymentBankAccounts) {
        bankAccounts = typeof settings.paymentBankAccounts === 'string' 
          ? JSON.parse(settings.paymentBankAccounts)
          : settings.paymentBankAccounts
      }
    } catch (e) {
      console.error('[Payment Settings] Error parsing bankAccounts:', e)
    }

    try {
      if (settings?.paymentXenditChannels) {
        xenditChannels = typeof settings.paymentXenditChannels === 'string'
          ? JSON.parse(settings.paymentXenditChannels)
          : settings.paymentXenditChannels
      }
    } catch (e) {
      console.error('[Payment Settings] Error parsing xenditChannels:', e)
    }

    // Use defaults if empty
    if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
      bankAccounts = []
    }

    if (!Array.isArray(xenditChannels) || xenditChannels.length === 0) {
      xenditChannels = getDefaultXenditChannels()
    }

    // Default values if no settings exist
    const defaultSettings = {
      paymentEnableManual: true,
      paymentEnableXendit: true,
      paymentSandboxMode: false,
      paymentAutoActivation: true,
      paymentExpiryHours: 72,
      paymentMinAmount: 10000,
      paymentMaxAmount: 100000000,
    }

    const responseData = {
      success: true,
      bankAccounts,
      xenditChannels,
      settings: {
        enableManualBank: settings?.paymentEnableManual ?? defaultSettings.paymentEnableManual,
        enableXendit: settings?.paymentEnableXendit ?? defaultSettings.paymentEnableXendit,
        sandboxMode: settings?.paymentSandboxMode ?? defaultSettings.paymentSandboxMode,
        autoActivation: settings?.paymentAutoActivation ?? defaultSettings.paymentAutoActivation,
        paymentExpiryHours: settings?.paymentExpiryHours ?? defaultSettings.paymentExpiryHours,
        minAmount: settings?.paymentMinAmount ?? defaultSettings.paymentMinAmount,
        maxAmount: settings?.paymentMaxAmount ?? defaultSettings.paymentMaxAmount,
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Payment Settings] Error fetching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bankAccounts, xenditChannels, settings } = body

    // Upsert settings
    const existingSettings = await prisma.settings.findFirst()

    const updateData = {
      paymentBankAccounts: bankAccounts || [],
      paymentXenditChannels: xenditChannels || [],
      paymentEnableManual: settings?.enableManualBank ?? true,
      paymentEnableXendit: settings?.enableXendit ?? true,
      paymentSandboxMode: settings?.sandboxMode ?? false,
      paymentAutoActivation: settings?.autoActivation ?? true,
      paymentExpiryHours: settings?.paymentExpiryHours ?? settings?.expiryHours ?? 72,
      paymentMinAmount: settings?.minAmount ?? 10000,
      paymentMaxAmount: settings?.maxAmount ?? 100000000,
    }

    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData
      })
    } else {
      await prisma.settings.create({
        data: updateData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully'
    })
  } catch (error) {
    console.error('[Payment Settings] Error saving:', error)
    return NextResponse.json(
      { error: 'Failed to save payment settings' },
      { status: 500 }
    )
  }
}

function getDefaultXenditChannels() {
  return [
    // Virtual Account
    { code: 'BCA', name: 'Bank Central Asia (BCA)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'MANDIRI', name: 'Bank Mandiri', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'CIMB', name: 'CIMB Niaga', type: 'bank_transfer', icon: '🏦', isActive: false },
    { code: 'PERMATA', name: 'Bank Permata', type: 'bank_transfer', icon: '🏦', isActive: false },
    { code: 'SAHABAT_SAMPOERNA', name: 'Bank Sahabat Sampoerna', type: 'bank_transfer', icon: '🏦', isActive: false },
    
    // E-Wallet
    { code: 'OVO', name: 'OVO', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'DANA', name: 'DANA', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'GOPAY', name: 'GoPay', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', icon: '💳', isActive: false },
    { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', icon: '💳', isActive: false },
    { code: 'ASTRAPAY', name: 'AstraPay', type: 'ewallet', icon: '💳', isActive: false },
    { code: 'JENIUSPAY', name: 'Jenius Pay', type: 'ewallet', icon: '💳', isActive: false },
    
    // QRIS
    { code: 'QRIS', name: 'QRIS (Scan QR)', type: 'qris', icon: '📱', isActive: true },
    
    // Retail
    { code: 'ALFAMART', name: 'Alfamart', type: 'retail', icon: '🏪', isActive: true },
    { code: 'INDOMARET', name: 'Indomaret', type: 'retail', icon: '🏪', isActive: true },
    
    // Cardless Credit / PayLater
    { code: 'KREDIVO', name: 'Kredivo', type: 'cardless_credit', icon: '💰', isActive: false },
    { code: 'AKULAKU', name: 'Akulaku', type: 'cardless_credit', icon: '💰', isActive: false },
  ]
}
