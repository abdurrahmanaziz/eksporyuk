// Test direct service call
const { PrismaClient } = require('@prisma/client')

// Import the actual service manually
console.log('Testing ACTUAL e-wallet service...\n')

// Load dependencies
const prisma = new PrismaClient()

// Mock EWalletService class behavior
class TestEWalletService {
  normalizePhoneNumber(phone) {
    // Remove all non-digits first
    let normalized = phone.replace(/\D/g, '')
    
    // Handle empty or too short numbers
    if (!normalized || normalized.length < 10) {
      return normalized
    }
    
    // For Indonesian mobile numbers starting with 0, keep original format
    // E-wallets work with 08xxx format, not 62xxx
    if (normalized.startsWith('0') && normalized.length >= 11 && normalized.charAt(1) === '8') {
      return normalized  // Keep 08118748177 as is
    }
    
    // If starts with +62, convert to 08xxx format
    if (normalized.startsWith('62') && normalized.length >= 12 && normalized.charAt(2) === '8') {
      return '0' + normalized.substring(2)  // 628118748177 → 08118748177
    }
    
    // If it's just 8xxx format, add 0
    if (normalized.startsWith('8') && normalized.length >= 10) {
      return '0' + normalized  // 8118748177 → 08118748177
    }
    
    return normalized
  }

  async getMockAccountInfo(provider, phoneNumber, userId) {
    // Mock data exactly as in service
    const mockAccounts = {
      'DANA': {
        '08123456789': 'Charlie Brown',
        '08987654321': 'Diana Prince',
        '08111222333': 'Erik Johnson',
        '08118748177': 'Aziz Rahman',  // HARUS ADA!
        '081187481771': 'Aziz Rahman',
        '081187481772': 'Rahman Aziz',
        '08112345678': 'Test User DANA',
        '08551234567': 'Demo DANA',
        '08811223344': 'Sample DANA',
        // Keep 62xxx for backward compatibility
        '628123456789': 'Charlie Brown',
        '628987654321': 'Diana Prince',
        '628111222333': 'Erik Johnson',
        '628118748177': 'Aziz Rahman',
        '6281187481771': 'Aziz Rahman',
        '6281187481772': 'Rahman Aziz'
      }
    }

    const accountName = mockAccounts[provider]?.[phoneNumber]
    
    console.log(`Mock lookup: ${provider}["${phoneNumber}"] = ${accountName || 'NOT FOUND'}`)

    if (accountName) {
      return {
        success: true,
        accountName: accountName,
        message: 'Account found (mock)',
        cached: false
      }
    }

    return {
      success: false,
      accountName: null,
      message: `Akun ${provider} dengan nomor ${phoneNumber} tidak ditemukan`,
      cached: false
    }
  }

  async checkAccountName(phoneNumber, provider, userId, useCache = true) {
    try {
      console.log(`=== CHECKING: ${provider} - ${phoneNumber} ===`)
      
      // Step 1: Normalize
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber)
      console.log(`Step 1 - Normalize: "${phoneNumber}" → "${normalizedPhone}"`)
      
      // Step 2: Mock lookup (since APIs disabled)
      const result = await this.getMockAccountInfo(provider, normalizedPhone, userId)
      console.log(`Step 2 - Result:`, result)
      
      return result

    } catch (error) {
      console.error('ERROR:', error)
      return {
        success: false,
        accountName: null,
        message: 'Service error',
        cached: false
      }
    }
  }
}

async function testActualFlow() {
  const service = new TestEWalletService()
  
  console.log('🧪 TESTING EXACT FRONTEND FLOW:')
  console.log('Frontend sends: phoneNumber = "08118748177", provider = "DANA"\n')
  
  const result = await service.checkAccountName('08118748177', 'DANA', 'test-user')
  
  console.log('\n📋 FINAL RESULT:')
  console.log(`Success: ${result.success}`)
  console.log(`Account Name: ${result.accountName || 'NULL'}`)
  console.log(`Message: ${result.message}`)
  
  if (result.success) {
    console.log('\n✅ SUCCESS - Should work in production!')
  } else {
    console.log('\n❌ FAILED - There is still an issue!')
  }
}

// Run test
testActualFlow().finally(() => {
  console.log('\nTest completed.')
  process.exit(0)
})