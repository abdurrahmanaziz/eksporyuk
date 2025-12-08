import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to get default logo URL
const getDefaultLogoUrl = (code: string) => {
  const baseUrl = '/images/payment-logos'
  
  const logos: { [key: string]: string } = {
    // Banks
    'BCA': `${baseUrl}/bca.svg`,
    'MANDIRI': `${baseUrl}/mandiri.svg`,
    'BNI': `${baseUrl}/bni.svg`,
    'BRI': `${baseUrl}/bri.svg`,
    'BSI': `${baseUrl}/bsi.svg`,
    'CIMB': `${baseUrl}/cimb.svg`,
    'PERMATA': `${baseUrl}/permata.svg`,
    'SAHABAT_SAMPOERNA': `${baseUrl}/sahabat-sampoerna.svg`,
    
    // E-Wallets
    'OVO': `${baseUrl}/ovo.svg`,
    'DANA': `${baseUrl}/dana.svg`,
    'GOPAY': `${baseUrl}/gopay.svg`,
    'LINKAJA': `${baseUrl}/linkaja.svg`,
    'SHOPEEPAY': `${baseUrl}/shopeepay.svg`,
    'ASTRAPAY': `${baseUrl}/astrapay.svg`,
    'JENIUSPAY': `${baseUrl}/jeniuspay.svg`,
    
    // QRIS
    'QRIS': `${baseUrl}/qris.svg`,
    
    // Retail
    'ALFAMART': `${baseUrl}/alfamart.svg`,
    'INDOMARET': `${baseUrl}/indomaret.svg`,
    
    // PayLater / Cardless Credit
    'KREDIVO': `${baseUrl}/kredivo.svg`,
    'AKULAKU': `${baseUrl}/akulaku.svg`,
  }
  
  return logos[code] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%230066CC'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='white' font-family='Arial'%3E${code.substring(0, 3)}%3C/text%3E%3C/svg%3E`
}

export async function GET(request: NextRequest) {
  try {
    // Get payment settings from database
    const settings = await prisma.settings.findFirst({
      select: {
        paymentXenditChannels: true,
        paymentEnableXendit: true,
      }
    })

    let xenditChannels = []

    // Parse xendit channels
    try {
      if (settings?.paymentXenditChannels) {
        xenditChannels = typeof settings.paymentXenditChannels === 'string'
          ? JSON.parse(settings.paymentXenditChannels)
          : settings.paymentXenditChannels
      }
    } catch (e) {
      console.error('[Payment Logos] Error parsing xenditChannels:', e)
    }

    // Build logo map with custom logos if available
    const logoMap: { [key: string]: string } = {}
    const activeChannels: { [key: string]: boolean } = {}
    const channelsByType: { [key: string]: string[] } = {
      bank_transfer: [],
      ewallet: [],
      qris: [],
      retail: [],
      paylater: []
    }
    
    if (Array.isArray(xenditChannels)) {
      xenditChannels.forEach((channel: any) => {
        // Use custom logo if available, otherwise use default
        logoMap[channel.code] = channel.customLogoUrl || getDefaultLogoUrl(channel.code)
        // Track active status
        activeChannels[channel.code] = channel.isActive ?? true
        // Group by type
        if (channel.isActive && channel.type && channelsByType[channel.type]) {
          channelsByType[channel.type].push(channel.code)
        }
      })
    }

    // Add default logos for common payment methods if not in database
    const commonMethods = [
      'BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'CIMB', 'PERMATA',
      'OVO', 'DANA', 'GOPAY', 'LINKAJA', 'SHOPEEPAY',
      'QRIS', 'ALFAMART', 'INDOMARET', 'KREDIVO', 'AKULAKU'
    ]

    commonMethods.forEach(code => {
      if (!logoMap[code]) {
        logoMap[code] = getDefaultLogoUrl(code)
      }
      // Default to active if not specified
      if (activeChannels[code] === undefined) {
        activeChannels[code] = true
      }
    })

    return NextResponse.json({
      success: true,
      logos: logoMap,
      activeChannels,
      channelsByType,
      enableXendit: settings?.paymentEnableXendit ?? true
    })

  } catch (error) {
    console.error('[Payment Logos] Error fetching:', error)
    
    // Return default logos on error
    const defaultLogos: { [key: string]: string } = {}
    const defaultActive: { [key: string]: boolean } = {}
    const commonMethods = [
      'BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'CIMB', 'PERMATA',
      'OVO', 'DANA', 'GOPAY', 'LINKAJA', 'SHOPEEPAY',
      'QRIS', 'ALFAMART', 'INDOMARET', 'KREDIVO', 'AKULAKU'
    ]

    commonMethods.forEach(code => {
      defaultLogos[code] = getDefaultLogoUrl(code)
      defaultActive[code] = true
    })

    return NextResponse.json({
      success: true,
      logos: defaultLogos,
      activeChannels: defaultActive,
      channelsByType: {
        bank_transfer: ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'CIMB'],
        ewallet: ['OVO', 'DANA', 'GOPAY', 'LINKAJA'],
        qris: ['QRIS'],
        retail: ['ALFAMART', 'INDOMARET'],
        paylater: ['KREDIVO', 'AKULAKU']
      },
      enableXendit: true
    })
  }
}
