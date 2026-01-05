import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ewallet/check-name
 * Check account name for e-wallet phone number
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, ewalletType } = await request.json()

    if (!phoneNumber || !ewalletType) {
      return NextResponse.json({ error: 'Phone number and e-wallet type required' }, { status: 400 })
    }

    // Simulate name checking for different e-wallets
    // In real implementation, you would call the respective e-wallet APIs
    const nameChecks = {
      'OVO': checkOVOName,
      'GoPay': checkGopayName, 
      'DANA': checkDanaName,
      'LinkAja': checkLinkAjaName,
      'ShopeePay': checkShopeePayName
    }

    const checkFunction = nameChecks[ewalletType as keyof typeof nameChecks]
    
    if (!checkFunction) {
      return NextResponse.json({ error: 'Unsupported e-wallet type' }, { status: 400 })
    }

    const result = await checkFunction(phoneNumber)

    return NextResponse.json(result)

  } catch (error) {
    console.error('[EWALLET NAME CHECK ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to check e-wallet name' },
      { status: 500 }
    )
  }
}

// Mock functions for different e-wallet name checking
// In production, these would call actual e-wallet APIs

async function checkOVOName(phoneNumber: string) {
  // Simulate OVO API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock response based on phone number pattern
  const mockNames = {
    '+628123456789': 'John Doe',
    '+628987654321': 'Jane Smith',
    '+628111222333': 'Ahmad Rizki'
  }
  
  const accountName = mockNames[phoneNumber as keyof typeof mockNames]
  
  return {
    success: !!accountName,
    accountName: accountName || null,
    message: accountName ? 'Account found' : 'Account not found'
  }
}

async function checkGopayName(phoneNumber: string) {
  // Simulate GoPay API call
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const mockNames = {
    '+628123456789': 'Budi Santoso',
    '+628987654321': 'Siti Nurhaliza', 
    '+628111222333': 'Andi Wijaya'
  }
  
  const accountName = mockNames[phoneNumber as keyof typeof mockNames]
  
  return {
    success: !!accountName,
    accountName: accountName || null,
    message: accountName ? 'Account found' : 'Account not found'
  }
}

async function checkDanaName(phoneNumber: string) {
  // Simulate DANA API call
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  const mockNames = {
    '+628123456789': 'Rini Kusuma',
    '+628987654321': 'Dedi Pratama',
    '+628111222333': 'Maya Sari'
  }
  
  const accountName = mockNames[phoneNumber as keyof typeof mockNames]
  
  return {
    success: !!accountName,
    accountName: accountName || null,
    message: accountName ? 'Account found' : 'Account not found'
  }
}

async function checkLinkAjaName(phoneNumber: string) {
  // Simulate LinkAja API call
  await new Promise(resolve => setTimeout(resolve, 900))
  
  const mockNames = {
    '+628123456789': 'Fajar Nugroho',
    '+628987654321': 'Dewi Lestari',
    '+628111222333': 'Rizal Ramli'
  }
  
  const accountName = mockNames[phoneNumber as keyof typeof mockNames]
  
  return {
    success: !!accountName,
    accountName: accountName || null,
    message: accountName ? 'Account found' : 'Account not found'
  }
}

async function checkShopeePayName(phoneNumber: string) {
  // Simulate ShopeePay API call
  await new Promise(resolve => setTimeout(resolve, 1100))
  
  const mockNames = {
    '+628123456789': 'Linda Sari',
    '+628987654321': 'Hendra Gunawan',
    '+628111222333': 'Tina Marlina'
  }
  
  const accountName = mockNames[phoneNumber as keyof typeof mockNames]
  
  return {
    success: !!accountName,
    accountName: accountName || null,
    message: accountName ? 'Account found' : 'Account not found'
  }
}